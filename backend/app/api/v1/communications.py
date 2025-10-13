"""
Communications API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError
from app.schemas.communications import (
    ConversationResponse, MessageResponse, ConversationListResponse,
    MessageListResponse, CreateConversationRequest, SendMessageRequest,
    UpdateMessageRequest, MarkAsReadRequest
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.communications_service import CommunicationsService

router = APIRouter()


@router.get("/conversations", response_model=PaginatedResponse[ConversationResponse])
async def get_conversations(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Status filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of conversations"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    communications_service = CommunicationsService(tenant_id)
    conversations, total = await communications_service.get_conversations(
        offset=offset,
        limit=pagination.size,
        search=search,
        status=status,
        user_id=current_user.user_id
    )
    
    return PaginatedResponse.create(
        items=conversations,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: CreateConversationRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new conversation"""
    
    communications_service = CommunicationsService(tenant_id)
    conversation = await communications_service.create_conversation(
        conversation_data, current_user.user_id
    )
    
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific conversation"""
    
    communications_service = CommunicationsService(tenant_id)
    conversation = await communications_service.get_conversation(
        conversation_id, current_user.user_id
    )
    
    if not conversation:
        raise NotFoundError("Conversation not found")
    
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=PaginatedResponse[MessageResponse])
async def get_messages(
    conversation_id: str,
    pagination: PaginationParams = Depends(),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get messages for a conversation"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    communications_service = CommunicationsService(tenant_id)
    messages, total = await communications_service.get_messages(
        conversation_id=conversation_id,
        offset=offset,
        limit=pagination.size,
        user_id=current_user.user_id
    )
    
    return PaginatedResponse.create(
        items=messages,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    message_data: SendMessageRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Send a message to a conversation"""
    
    communications_service = CommunicationsService(tenant_id)
    message = await communications_service.send_message(
        conversation_id, message_data, current_user.user_id
    )
    
    return message


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    message_data: UpdateMessageRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a message"""
    
    communications_service = CommunicationsService(tenant_id)
    message = await communications_service.update_message(
        message_id, message_data, current_user.user_id
    )
    
    if not message:
        raise NotFoundError("Message not found")
    
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a message"""
    
    communications_service = CommunicationsService(tenant_id)
    await communications_service.delete_message(message_id, current_user.user_id)


@router.post("/messages/mark-read", status_code=status.HTTP_200_OK)
async def mark_messages_as_read(
    request: MarkAsReadRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mark messages as read"""
    
    communications_service = CommunicationsService(tenant_id)
    await communications_service.mark_messages_as_read(
        request.message_ids, current_user.user_id
    )
    
    return {"message": "Messages marked as read"}
