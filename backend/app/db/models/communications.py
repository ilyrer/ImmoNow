"""
Communications Models for Real-Time Messaging
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Conversation(models.Model):
    """Conversation model for messaging"""
    CONVERSATION_TYPES = [
        ('dm', 'Direct Message'),
        ('group', 'Group Chat'),
        ('object', 'Property Discussion'),
        ('customer', 'Customer Thread'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255)
    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPES, default='dm')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Related entities
    property_id = models.UUIDField(blank=True, null=True, help_text="Related property for object conversations")
    contact_id = models.UUIDField(blank=True, null=True, help_text="Related contact for customer conversations")
    
    # Last message reference
    last_message = models.ForeignKey(
        'Message', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='+'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    is_pinned = models.BooleanField(default=False)
    priority = models.CharField(max_length=20, default='normal', choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'conversations'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'conversation_type']),
            models.Index(fields=['tenant', 'is_pinned']),
            models.Index(fields=['tenant', 'updated_at']),
            models.Index(fields=['property_id']),
            models.Index(fields=['contact_id']),
        ]
    
    def __str__(self):
        return self.title


class ConversationParticipant(models.Model):
    """Participant model for conversations"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('readonly', 'Read Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'conversation_participants'
        unique_together = ['conversation', 'user']
        indexes = [
            models.Index(fields=['conversation', 'user']),
            models.Index(fields=['user', 'last_read_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} in {self.conversation.title}"


class Message(models.Model):
    """Message model for conversations"""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    
    # Message metadata
    metadata = models.JSONField(default=dict, blank=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='replies')
    is_edited = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    
    # Read receipts
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    read_by = models.ManyToManyField(User, through='MessageReadReceipt', related_name='read_messages')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['conversation', 'is_pinned']),
            models.Index(fields=['reply_to']),
        ]
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender.get_full_name()} in {self.conversation.title}"


class MessageReadReceipt(models.Model):
    """Read receipt model for messages"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_read_receipts'
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['message', 'user']),
            models.Index(fields=['user', 'read_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} read message at {self.read_at}"


class MessageAttachment(models.Model):
    """Attachment model for messages"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    file_url = models.URLField()
    thumbnail_url = models.URLField(blank=True, null=True)
    file_hash = models.CharField(max_length=64, blank=True, help_text="SHA-256 hash for duplicate detection")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_attachments'
        indexes = [
            models.Index(fields=['message', 'created_at']),
            models.Index(fields=['file_hash']),
        ]
    
    def __str__(self):
        return f"{self.file_name} attached to message"


class TypingIndicator(models.Model):
    """Typing indicator model for real-time typing status"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'typing_indicators'
        unique_together = ['conversation', 'user']
        indexes = [
            models.Index(fields=['conversation', 'user']),
            models.Index(fields=['last_seen']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} typing in {self.conversation.title}"


class MessageMention(models.Model):
    """Message mentions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='mentions')
    mentioned_user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_mentions'
        unique_together = ['message', 'mentioned_user']
        indexes = [
            models.Index(fields=['message', 'created_at']),
            models.Index(fields=['mentioned_user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.message.id} mentions {self.mentioned_user.get_full_name()}"


class MessageReaction(models.Model):
    """Message reactions"""
    REACTION_TYPES = [
        ('👍', 'Thumbs Up'),
        ('❤️', 'Heart'),
        ('😂', 'Laugh'),
        ('😮', 'Wow'),
        ('😢', 'Sad'),
        ('😡', 'Angry'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_reactions'
        unique_together = ['message', 'user', 'reaction_type']
        indexes = [
            models.Index(fields=['message', 'reaction_type']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} reacted {self.reaction_type} to {self.message.id}"


class UserPresence(models.Model):
    """User presence model for online/offline status"""
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='presence')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    last_seen = models.DateTimeField(auto_now=True)
    custom_status = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'user_presence'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['last_seen']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} is {self.status}"
