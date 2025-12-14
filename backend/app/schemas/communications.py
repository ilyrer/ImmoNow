"""
Communications Pydantic Schemas (Channels, Messages, Reactions)
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ChannelRole(str, Enum):
    OWNER = "owner"
    MEMBER = "member"
    GUEST = "guest"


class ResourceType(str, Enum):
    CONTACT = "contact"
    PROPERTY = "property"
    TASK = "task"


class AttachmentResponse(BaseModel):
    id: str
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceLinkResponse(BaseModel):
    id: str
    resource_type: ResourceType
    resource_id: str
    label: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReactionResponse(BaseModel):
    id: str
    emoji: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: str
    channel_id: str
    user_id: str
    content: str
    parent_id: Optional[str] = None
    has_attachments: bool
    is_deleted: bool
    edited_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    attachments: List[AttachmentResponse] = []
    reactions: List[ReactionResponse] = []
    resource_links: List[ResourceLinkResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ChannelMemberResponse(BaseModel):
    user_id: str
    role: ChannelRole
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChannelResponse(BaseModel):
    id: str
    name: str
    topic: Optional[str] = None
    team_id: Optional[str] = None
    is_private: bool = False
    created_by: str
    created_at: datetime
    updated_at: datetime
    members: List[ChannelMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CreateChannelRequest(BaseModel):
    name: str = Field(..., max_length=120)
    topic: Optional[str] = Field(None, max_length=255)
    team_id: Optional[str] = None
    is_private: bool = False
    member_ids: List[str] = []


class UpdateChannelRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    topic: Optional[str] = Field(None, max_length=255)
    is_private: Optional[bool] = None


class AddMemberRequest(BaseModel):
    user_id: str
    role: ChannelRole = ChannelRole.MEMBER


class UpdateMemberRequest(BaseModel):
    role: ChannelRole


class CreateMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[str] = None
    attachments: List["AttachmentInput"] = []
    resource_links: List["ResourceLinkInput"] = []


class EditMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)


class ReactionRequest(BaseModel):
    emoji: str = Field(..., max_length=32)


class AttachmentInput(BaseModel):
    file_url: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class ResourceLinkInput(BaseModel):
    resource_type: ResourceType
    resource_id: str
    label: Optional[str] = None


class SearchMessagesResponse(BaseModel):
    items: List[MessageResponse]
    total: int
