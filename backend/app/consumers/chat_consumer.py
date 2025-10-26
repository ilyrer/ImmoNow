"""
WebSocket Consumer for Chat Communications with Token Authentication
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from app.db.models import Conversation, Message, ConversationParticipant, UserPresence
from app.core.security import JWTService
from app.core.errors import NotFoundError
from datetime import datetime

User = get_user_model()

# Create JWT service instance
jwt_service = JWTService()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Extract token from query params
        query_string = self.scope['query_string'].decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            await self.close(code=4001)  # Custom close code for missing token
            return
        
        try:
            # Decode token to get user info
            token_data = jwt_service.verify_token(token)
            self.user_id = token_data.user_id
            self.tenant_id = token_data.tenant_id
                    
        except Exception as e:
            print(f"Token decode error: {e}")
            await self.close(code=4003)  # Custom close code for invalid token
            return
        
        # Verify user has access to conversation
        if not await self.has_access():
            await self.close(code=4004)  # Custom close code for access denied
            return
        
        # Verify tenant access
        if not await self.verify_tenant_access():
            await self.close(code=4005)  # Custom close code for tenant access denied
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Update user presence
        await self.update_presence('online')
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat',
            'user_id': self.user_id,
            'tenant_id': self.tenant_id
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Update user presence
        await self.update_presence('offline')
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'message':
                await self.handle_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'read_receipt':
                await self.handle_read_receipt(data)
            elif message_type == 'video_signal':
                await self.handle_video_signal(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}'
            }))
    
    async def handle_message(self, data):
        """Handle incoming chat message"""
        content = data.get('content', '').strip()
        if not content:
            return
        
        # Save message to database
        message = await self.save_message(content)
        
        if message:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': str(message.id),
                        'conversation_id': str(message.conversation_id),
                        'sender_id': str(message.sender_id),
                        'sender_name': message.sender.get_full_name(),
                        'content': message.content,
                        'message_type': message.message_type,
                        'created_at': message.created_at.isoformat(),
                        'updated_at': message.updated_at.isoformat(),
                        'is_read': message.is_read
                    }
                }
            )
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        is_typing = data.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user_id,
                'is_typing': is_typing
            }
        )
    
    async def handle_read_receipt(self, data):
        """Handle read receipt"""
        message_ids = data.get('message_ids', [])
        
        if message_ids:
            await self.mark_messages_as_read(message_ids)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'user_id': self.user_id,
                    'message_ids': message_ids
                }
            )
    
    async def handle_video_signal(self, data):
        """Handle video call signaling"""
        signal = data.get('signal')
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'video_signal',
                'signal': signal,
                'sender': self.user_id
            }
        )
    
    # WebSocket event handlers
    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': event['message']
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))
    
    async def read_receipt(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event['user_id'],
            'message_ids': event['message_ids']
        }))
    
    async def video_signal(self, event):
        """Send video signal to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'video_signal',
            'signal': event['signal'],
            'sender': event['sender']
        }))
    
    # Database operations
    @database_sync_to_async
    def has_access(self):
        """Check if user has access to conversation"""
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id,
            user_id=self.user_id
        ).exists()
    
    @database_sync_to_async
    def verify_tenant_access(self):
        """Verify user has access to tenant"""
        try:
            from app.db.models import TenantUser
            return TenantUser.objects.filter(
                user_id=self.user_id,
                tenant_id=self.tenant_id
            ).exists()
        except Exception:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        """Save message to database"""
        try:
            message = Message.objects.create(
                conversation_id=self.conversation_id,
                sender_id=self.user_id,
                content=content,
                message_type='text',
                metadata={}
            )
            
            # Update conversation's last_message and updated_at
            conversation = Conversation.objects.get(id=self.conversation_id)
            conversation.last_message = message
            conversation.save(update_fields=['last_message', 'updated_at'])
            
            return message
        except Exception as e:
            print(f"Error saving message: {e}")
            return None
    
    @database_sync_to_async
    def mark_messages_as_read(self, message_ids):
        """Mark messages as read"""
        try:
            from app.db.models import MessageReadReceipt
            
            # Create read receipts
            for message_id in message_ids:
                MessageReadReceipt.objects.get_or_create(
                    message_id=message_id,
                    user_id=self.user_id
                )
            
            # Update message read status
            Message.objects.filter(id__in=message_ids).update(
                is_read=True,
                read_at=datetime.utcnow()
            )
        except Exception as e:
            print(f"Error marking messages as read: {e}")
    
    @database_sync_to_async
    def update_presence(self, status):
        """Update user presence status"""
        try:
            presence, created = UserPresence.objects.get_or_create(
                user_id=self.user_id,
                defaults={'status': status}
            )
            
            if not created:
                presence.status = status
                presence.last_seen = datetime.utcnow()
                presence.save()
        except Exception as e:
            print(f"Error updating presence: {e}")