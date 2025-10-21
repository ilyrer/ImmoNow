"""
Communications Service - Production Ready with Caching
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async
from django.db.models import Q, Count, Max
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.conf import settings

from app.schemas.communications import (
    ConversationResponse, MessageResponse, CreateConversationRequest,
    SendMessageRequest, UpdateMessageRequest
)
from app.core.errors import NotFoundError, ValidationError
from app.db.models import (
    Conversation, ConversationParticipant, Message, MessageReadReceipt,
    MessageAttachment, UserPresence
)

User = get_user_model()


class CommunicationsService:
    """Service for managing communications and messaging"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    # Cache helper methods
    def _get_cache_key(self, key_type: str, *args) -> str:
        """Generate cache key with tenant isolation"""
        return f"communications:{self.tenant_id}:{key_type}:{':'.join(str(arg) for arg in args)}"
    
    def _get_cache_timeout(self, cache_type: str) -> int:
        """Get cache timeout for specific type"""
        return getattr(settings, 'CACHE_TIMEOUT', {}).get(cache_type, 300)
    
    async def _cache_get(self, cache_key: str):
        """Get from cache"""
        return await sync_to_async(cache.get)(cache_key)
    
    async def _cache_set(self, cache_key: str, value: Any, timeout: Optional[int] = None):
        """Set cache value"""
        if timeout is None:
            timeout = self._get_cache_timeout('default')
        await sync_to_async(cache.set)(cache_key, value, timeout)
    
    async def _cache_delete(self, cache_key: str):
        """Delete from cache"""
        await sync_to_async(cache.delete)(cache_key)
    
    async def _invalidate_conversation_cache(self, conversation_id: str):
        """Invalidate conversation-related cache"""
        patterns = [
            f"communications:{self.tenant_id}:conversations:*",
            f"communications:{self.tenant_id}:conversation:{conversation_id}:*",
            f"communications:{self.tenant_id}:messages:{conversation_id}:*"
        ]
        
        for pattern in patterns:
            await sync_to_async(cache.delete_many)(pattern)
    
    # Helper functions for sync_to_async
    def _get_conversations_sync(self, user_id: str, tenant_id: str, search: Optional[str] = None, status: Optional[str] = None):
        """Synchronous function to get conversations with optimized queries"""
        queryset = Conversation.objects.filter(
            participants__user_id=user_id,
            tenant_id=tenant_id,
            status='active'
        ).select_related(
            'last_message',
            'last_message__sender',
            'created_by'
        ).prefetch_related(
            'participants__user',
            'messages__read_receipts'
        ).order_by('-updated_at')
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(messages__content__icontains=search)
            ).distinct()
        
        if status:
            queryset = queryset.filter(status=status)
        
        return list(queryset)
    
    def _get_conversation_sync(self, conversation_id: str, user_id: str, tenant_id: str):
        """Synchronous function to get a single conversation with optimized queries"""
        try:
            return Conversation.objects.select_related(
                'last_message',
                'last_message__sender',
                'created_by'
            ).prefetch_related(
                'participants__user',
                'messages__read_receipts'
            ).get(
                id=conversation_id,
                participants__user_id=user_id,
                tenant_id=tenant_id
            )
        except Conversation.DoesNotExist:
            return None
    
    def _get_messages_sync(self, conversation_id: str, user_id: str):
        """Synchronous function to get messages with optimized queries"""
        # Verify user has access
        has_access = ConversationParticipant.objects.filter(
            conversation_id=conversation_id,
            user_id=user_id
        ).exists()
        
        if not has_access:
            return None
        
        return list(Message.objects.filter(
            conversation_id=conversation_id
        ).select_related(
            'sender',
            'conversation'
        ).prefetch_related(
            'read_receipts',
            'attachments',
            'reactions__user',
            'mentions__mentioned_user'
        ).order_by('created_at'))
    
    def _create_conversation_sync(self, conversation_data: CreateConversationRequest, user_id: str, tenant_id: str):
        """Synchronous function to create conversation"""
        conversation = Conversation.objects.create(
            tenant_id=tenant_id,
            title=conversation_data.title,
            conversation_type=conversation_data.conversation_type,
            property_id=conversation_data.property_id,
            contact_id=conversation_data.contact_id,
            metadata=conversation_data.metadata,
            created_by_id=user_id
        )
        
        # Add participants
        for participant_id in conversation_data.participant_ids:
            ConversationParticipant.objects.create(
                conversation=conversation,
                user_id=participant_id,
                role='member'
            )
        
        # Add creator as admin
        ConversationParticipant.objects.create(
            conversation=conversation,
            user_id=user_id,
            role='admin'
        )
        
        return conversation
    
    def _create_message_sync(self, message_data: SendMessageRequest, user_id: str):
        """Synchronous function to create message"""
        # Verify user has access
        has_access = ConversationParticipant.objects.filter(
            conversation_id=message_data.conversation_id,
            user_id=user_id
        ).exists()
        
        if not has_access:
            return None
        
        message = Message.objects.create(
            conversation_id=message_data.conversation_id,
            sender_id=user_id,
            content=message_data.content,
            message_type=message_data.message_type,
            metadata=message_data.metadata,
            reply_to_id=message_data.metadata.get('reply_to') if message_data.metadata else None
        )
        
        # Update conversation's updated_at timestamp
        Conversation.objects.filter(id=message_data.conversation_id).update(updated_at=datetime.utcnow())
        
        return message
    
    def _update_message_sync(self, message_id: str, message_data: UpdateMessageRequest, user_id: str):
        """Synchronous function to update message"""
        try:
            message = Message.objects.get(id=message_id, sender_id=user_id)
            message.content = message_data.content
            message.is_edited = True
            message.updated_at = datetime.utcnow()
            message.save()
            return message
        except Message.DoesNotExist:
            return None
    
    def _delete_message_sync(self, message_id: str, user_id: str):
        """Synchronous function to delete message"""
        try:
            message = Message.objects.get(id=message_id, sender_id=user_id)
            message.delete()
            return True
        except Message.DoesNotExist:
            return False
    
    def _mark_messages_read_sync(self, message_ids: List[str], user_id: str):
        """Synchronous function to mark messages as read"""
        # Create read receipts
        for message_id in message_ids:
            MessageReadReceipt.objects.get_or_create(
                message_id=message_id,
                user_id=user_id
            )
        
        # Update message read status
        Message.objects.filter(id__in=message_ids).update(
            is_read=True, 
            read_at=datetime.utcnow()
        )
        return True
    
    def _get_online_users_sync(self, tenant_id: str):
        """Synchronous function to get online users"""
        return list(UserPresence.objects.filter(
            status='online',
            user__tenantuser__tenant_id=tenant_id
        ).select_related('user'))
    
    def _update_presence_sync(self, user_id: str, status: str, custom_status: Optional[str] = None):
        """Synchronous function to update user presence"""
        presence, created = UserPresence.objects.get_or_create(
            user_id=user_id,
            defaults={'status': status}
        )
        
        if not created:
            presence.status = status
            presence.last_seen = datetime.utcnow()
            if custom_status is not None:
                presence.custom_status = custom_status
            presence.save()
        
        return True
    
    async def get_conversations(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        user_id: str = None
    ) -> tuple[List[ConversationResponse], int]:
        """Get conversations for a user with caching"""
        
        # Generate cache key
        cache_key = self._get_cache_key('conversations', user_id, offset, limit, search or '', status or '')
        
        # Try to get from cache first
        cached_result = await self._cache_get(cache_key)
        if cached_result:
            return cached_result['conversations'], cached_result['total']
        
        # Get conversations using sync_to_async
        conversations = await sync_to_async(self._get_conversations_sync)(
            user_id, self.tenant_id, search, status
        )
        
        # Get total count
        total = len(conversations)
        
        # Apply pagination
        conversations = conversations[offset:offset + limit]
        
        # Convert to response objects
        result = []
        for conv in conversations:
            # Get participants
            participants = []
            for participant in conv.participants.all():
                participants.append({
                    "id": str(participant.user.id),
                    "name": participant.user.get_full_name(),
                    "role": participant.role
                })
            
            # Get last message
            last_message = None
            if conv.last_message:
                last_message = MessageResponse(
                    id=str(conv.last_message.id),
                    conversation_id=str(conv.id),
                    sender_id=str(conv.last_message.sender.id),
                    sender_name=conv.last_message.sender.get_full_name(),
                    content=conv.last_message.content,
                    message_type=conv.last_message.message_type,
                    created_at=conv.last_message.created_at,
                    updated_at=conv.last_message.updated_at,
                    is_read=conv.last_message.is_read
                )
            
            # Calculate unread count
            unread_count = conv.messages.filter(
                ~Q(sender_id=user_id),
                read_receipts__isnull=True
            ).count()
            
            result.append(ConversationResponse(
                id=str(conv.id),
                title=conv.title,
                participants=participants,
                last_message=last_message,
                unread_count=unread_count,
                status=conv.status,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                metadata=conv.metadata
            ))
        
        # Cache the result
        await self._cache_set(
            cache_key,
            {'conversations': result, 'total': total},
            self._get_cache_timeout('conversations')
        )
        
        return result, total
    
    async def create_conversation(
        self,
        conversation_data: CreateConversationRequest,
        user_id: str
    ) -> ConversationResponse:
        """Create a new conversation"""
        
        conversation = await sync_to_async(self._create_conversation_sync)(
            conversation_data, user_id, self.tenant_id
        )
        
        # Get participants for response
        participants = []
        for participant in conversation.participants.all():
            participants.append({
                "id": str(participant.user.id),
                "name": participant.user.get_full_name(),
                "role": participant.role
            })
        
        return ConversationResponse(
            id=str(conversation.id),
            title=conversation.title,
            participants=participants,
            last_message=None,
            unread_count=0,
            status=conversation.status,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            metadata=conversation.metadata
        )
    
    async def get_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> ConversationResponse:
        """Get a specific conversation"""
        
        conversation = await sync_to_async(self._get_conversation_sync)(
            conversation_id, user_id, self.tenant_id
        )
        
        if not conversation:
            raise NotFoundError("Conversation not found")
        
        # Get participants
        participants = []
        for participant in conversation.participants.all():
            participants.append({
                "id": str(participant.user.id),
                "name": participant.user.get_full_name(),
                "role": participant.role
            })
        
        # Get last message
        last_message = None
        if conversation.last_message:
            last_message = MessageResponse(
                id=str(conversation.last_message.id),
                conversation_id=str(conversation.id),
                sender_id=str(conversation.last_message.sender.id),
                sender_name=conversation.last_message.sender.get_full_name(),
                content=conversation.last_message.content,
                message_type=conversation.last_message.message_type,
                created_at=conversation.last_message.created_at,
                updated_at=conversation.last_message.updated_at,
                is_read=conversation.last_message.is_read
            )
        
        # Calculate unread count
        unread_count = conversation.messages.filter(
            ~Q(sender_id=user_id),
            read_receipts__user_id=user_id
        ).count()
        
        return ConversationResponse(
            id=str(conversation.id),
            title=conversation.title,
            participants=participants,
            last_message=last_message,
            unread_count=unread_count,
            status=conversation.status,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            metadata=conversation.metadata
        )
    
    async def get_messages(
        self,
        conversation_id: str,
        offset: int = 0,
        limit: int = 50,
        user_id: str = None
    ) -> tuple[List[MessageResponse], int]:
        """Get messages for a conversation"""
        
        messages = await sync_to_async(self._get_messages_sync)(conversation_id, user_id)
        
        if messages is None:
            raise NotFoundError("Conversation not found")
        
        # Get total count
        total = len(messages)
        
        # Apply pagination
        messages = messages[offset:offset + limit]
        
        # Convert to response objects
        message_responses = []
        for msg in messages:
            message_responses.append(MessageResponse(
                id=str(msg.id),
                conversation_id=str(msg.conversation_id),
                sender_id=str(msg.sender.id),
                sender_name=msg.sender.get_full_name(),
                content=msg.content,
                message_type=msg.message_type,
                created_at=msg.created_at,
                updated_at=msg.updated_at,
                is_read=msg.is_read
            ))
        
        return message_responses, total
    
    async def send_message(
        self,
        message_data: SendMessageRequest,
        user_id: str
    ) -> MessageResponse:
        """Send a message to a conversation"""
        
        message = await sync_to_async(self._create_message_sync)(message_data, user_id)
        
        if not message:
            raise NotFoundError("Conversation not found")
        
        # Get sender info
        sender = await sync_to_async(User.objects.get)(id=user_id)
        
        # Invalidate cache for this conversation
        await self._invalidate_conversation_cache(message_data.conversation_id)
        
        return MessageResponse(
            id=str(message.id),
            conversation_id=str(message.conversation_id),
            sender_id=str(message.sender_id),
            sender_name=sender.get_full_name(),
            content=message.content,
            message_type=message.message_type,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_read=message.is_read
        )
    
    async def update_message(
        self,
        message_id: str,
        message_data: UpdateMessageRequest,
        user_id: str
    ) -> MessageResponse:
        """Update a message"""
        
        message = await sync_to_async(self._update_message_sync)(message_id, message_data, user_id)
        
        if not message:
            raise NotFoundError("Message not found")
        
        return MessageResponse(
            id=str(message.id),
            conversation_id=str(message.conversation_id),
            sender_id=str(message.sender_id),
            sender_name=message.sender.get_full_name(),
            content=message.content,
            message_type=message.message_type,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_read=message.is_read
        )
    
    async def delete_message(
        self,
        message_id: str,
        user_id: str
    ) -> bool:
        """Delete a message"""
        
        result = await sync_to_async(self._delete_message_sync)(message_id, user_id)
        
        if not result:
            raise NotFoundError("Message not found")
        
        return True
    
    async def mark_messages_as_read(
        self,
        message_ids: List[str],
        user_id: str
    ) -> bool:
        """Mark messages as read"""
        
        await sync_to_async(self._mark_messages_read_sync)(message_ids, user_id)
        return True
    
    async def get_online_users(self) -> List[Dict[str, Any]]:
        """Get list of online users"""
        
        online_users = await sync_to_async(self._get_online_users_sync)(self.tenant_id)
        
        users = []
        for presence in online_users:
            users.append({
                "id": str(presence.user.id),
                "name": presence.user.get_full_name(),
                "status": presence.status,
                "last_seen": presence.last_seen,
                "custom_status": presence.custom_status
            })
        
        return users
    
    async def update_user_presence(
        self,
        user_id: str,
        status: str,
        custom_status: Optional[str] = None
    ) -> bool:
        """Update user presence status"""
        
        await sync_to_async(self._update_presence_sync)(user_id, status, custom_status)
        return True