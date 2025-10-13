"""
Communications Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

from app.schemas.common import PaginatedResponse


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class ConversationStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class MessageResponse(BaseModel):
    """Message response model"""
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: MessageType
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    is_read: bool = False
    read_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Conversation response model"""
    id: str
    title: str
    participants: List[Dict[str, Any]]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    status: ConversationStatus
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)


class CreateConversationRequest(BaseModel):
    """Create conversation request"""
    title: str
    participant_ids: List[str]
    initial_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    """Send message request"""
    conversation_id: str
    content: str
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[Dict[str, Any]] = None


class UpdateMessageRequest(BaseModel):
    """Update message request"""
    content: str
    metadata: Optional[Dict[str, Any]] = None


class MarkAsReadRequest(BaseModel):
    """Mark messages as read request"""
    message_ids: List[str]


class ConversationListResponse(BaseModel):
    """Conversation list response"""
    conversations: List[ConversationResponse]
    total: int
    page: int
    size: int
    pages: int
    
    model_config = ConfigDict(from_attributes=True)


class MessageListResponse(BaseModel):
    """Message list response"""
    messages: List[MessageResponse]
    total: int
    page: int
    size: int
    pages: int
    
    model_config = ConfigDict(from_attributes=True)
