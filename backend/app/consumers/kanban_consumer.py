"""
Kanban WebSocket Consumer
Real-time updates for task management with collaboration features
"""
import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from app.db.models import Task, TaskComment, UserPresence
from app.core.security import decode_token
from app.core.errors import NotFoundError
from datetime import datetime

User = get_user_model()


class KanbanConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for Kanban board real-time updates"""
    
    async def connect(self):
        """Connect to Kanban WebSocket"""
        self.tenant_id = self.scope['url_route']['kwargs']['tenant_id']
        self.room_group_name = f'kanban_{self.tenant_id}'
        
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
            payload = decode_token(token)
            self.user_id = payload['user_id']
            self.user_tenant_id = payload['tenant_id']
            
            # Verify token is not expired
            if 'exp' in payload:
                import time
                if payload['exp'] < time.time():
                    await self.close(code=4002)  # Custom close code for expired token
                    return
            
            # Verify tenant access
            if self.user_tenant_id != self.tenant_id:
                await self.close(code=4004)  # Custom close code for tenant mismatch
                return
                
        except Exception as e:
            print(f"Token decode error: {e}")
            await self.close(code=4003)  # Custom close code for invalid token
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Set user presence
        await self.set_user_presence('online')
        
        # Send initial data
        await self.send_initial_data()
    
    async def disconnect(self, close_code):
        """Disconnect from WebSocket"""
        # Set user presence to offline
        await self.set_user_presence('offline')
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'task.created':
                await self.handle_task_created(data)
            elif message_type == 'task.updated':
                await self.handle_task_updated(data)
            elif message_type == 'task.moved':
                await self.handle_task_moved(data)
            elif message_type == 'task.deleted':
                await self.handle_task_deleted(data)
            elif message_type == 'task.comment.added':
                await self.handle_task_comment_added(data)
            elif message_type == 'user.typing':
                await self.handle_user_typing(data)
            elif message_type == 'user.viewing':
                await self.handle_user_viewing(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
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
            print(f"Error processing message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def handle_task_created(self, data):
        """Handle task creation"""
        task_data = data.get('task', {})
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_created_broadcast',
                'task': task_data,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_task_updated(self, data):
        """Handle task update"""
        task_data = data.get('task', {})
        task_id = data.get('task_id')
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_updated_broadcast',
                'task_id': task_id,
                'task': task_data,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_task_moved(self, data):
        """Handle task move (drag & drop)"""
        task_id = data.get('task_id')
        old_status = data.get('old_status')
        new_status = data.get('new_status')
        position = data.get('position', 0)
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_moved_broadcast',
                'task_id': task_id,
                'old_status': old_status,
                'new_status': new_status,
                'position': position,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_task_deleted(self, data):
        """Handle task deletion"""
        task_id = data.get('task_id')
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_deleted_broadcast',
                'task_id': task_id,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_task_comment_added(self, data):
        """Handle task comment addition"""
        task_id = data.get('task_id')
        comment = data.get('comment', {})
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_comment_added_broadcast',
                'task_id': task_id,
                'comment': comment,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_user_typing(self, data):
        """Handle user typing indicator"""
        task_id = data.get('task_id')
        is_typing = data.get('is_typing', True)
        
        # Broadcast to all users in the room except sender
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_typing_broadcast',
                'task_id': task_id,
                'user_id': self.user_id,
                'is_typing': is_typing,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_user_viewing(self, data):
        """Handle user viewing task"""
        task_id = data.get('task_id')
        is_viewing = data.get('is_viewing', True)
        
        # Broadcast to all users in the room except sender
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_viewing_broadcast',
                'task_id': task_id,
                'user_id': self.user_id,
                'is_viewing': is_viewing,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    # Broadcast handlers
    async def task_created_broadcast(self, event):
        """Broadcast task created event"""
        await self.send(text_data=json.dumps({
            'type': 'task.created',
            'task': event['task'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def task_updated_broadcast(self, event):
        """Broadcast task updated event"""
        await self.send(text_data=json.dumps({
            'type': 'task.updated',
            'task_id': event['task_id'],
            'task': event['task'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def task_moved_broadcast(self, event):
        """Broadcast task moved event"""
        await self.send(text_data=json.dumps({
            'type': 'task.moved',
            'task_id': event['task_id'],
            'old_status': event['old_status'],
            'new_status': event['new_status'],
            'position': event['position'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def task_deleted_broadcast(self, event):
        """Broadcast task deleted event"""
        await self.send(text_data=json.dumps({
            'type': 'task.deleted',
            'task_id': event['task_id'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def task_comment_added_broadcast(self, event):
        """Broadcast task comment added event"""
        await self.send(text_data=json.dumps({
            'type': 'task.comment.added',
            'task_id': event['task_id'],
            'comment': event['comment'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def user_typing_broadcast(self, event):
        """Broadcast user typing event"""
        # Don't send to the user who is typing
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'user.typing',
                'task_id': event['task_id'],
                'user_id': event['user_id'],
                'is_typing': event['is_typing'],
                'timestamp': event['timestamp']
            }))
    
    async def user_viewing_broadcast(self, event):
        """Broadcast user viewing event"""
        # Don't send to the user who is viewing
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'user.viewing',
                'task_id': event['task_id'],
                'user_id': event['user_id'],
                'is_viewing': event['is_viewing'],
                'timestamp': event['timestamp']
            }))
    
    async def send_initial_data(self):
        """Send initial data when connecting"""
        try:
            # Get current user info
            user = await self.get_user()
            if user:
                await self.send(text_data=json.dumps({
                    'type': 'connection.established',
                    'user': {
                        'id': str(user.id),
                        'name': f"{user.first_name} {user.last_name}",
                        'avatar': getattr(user.profile, 'avatar', None)
                    },
                    'timestamp': datetime.utcnow().isoformat()
                }))
        except Exception as e:
            print(f"Error sending initial data: {e}")
    
    @database_sync_to_async
    def get_user(self):
        """Get current user"""
        try:
            return User.objects.get(id=self.user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def set_user_presence(self, status):
        """Set user presence status"""
        try:
            user = User.objects.get(id=self.user_id)
            presence, created = UserPresence.objects.get_or_create(
                user=user,
                defaults={'status': status, 'last_seen': datetime.utcnow()}
            )
            if not created:
                presence.status = status
                presence.last_seen = datetime.utcnow()
                presence.save()
        except Exception as e:
            print(f"Error setting user presence: {e}")
    
    @database_sync_to_async
    def get_online_users(self):
        """Get list of online users"""
        try:
            online_users = UserPresence.objects.filter(
                status='online',
                last_seen__gte=datetime.utcnow() - timedelta(minutes=5)
            ).select_related('user')
            
            return [
                {
                    'id': str(presence.user.id),
                    'name': f"{presence.user.first_name} {presence.user.last_name}",
                    'avatar': getattr(presence.user.profile, 'avatar', None),
                    'last_seen': presence.last_seen.isoformat()
                }
                for presence in online_users
            ]
        except Exception as e:
            print(f"Error getting online users: {e}")
            return []
