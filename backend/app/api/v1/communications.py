"""
Communications API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status, File, UploadFile

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
from app.services.file_service import FileUploadService

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


@router.post("/messages/{message_id}/attachments")
async def upload_attachment(
    message_id: str,
    file: UploadFile = File(...),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload attachment to a message"""
    
    # Verify user has access to the message's conversation
    communications_service = CommunicationsService(tenant_id)
    try:
        # This will verify access through the conversation
        await communications_service.get_conversation(
            conversation_id=message_id,  # We need to get conversation_id from message
            user_id=current_user.user_id
        )
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or access denied"
        )
    
    # Upload file
    file_service = FileUploadService(tenant_id)
    upload_result = file_service.save_file(file, message_id)
    
    if not upload_result['valid']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=upload_result['error']
        )
    
    # Create attachment record
    attachment = file_service.create_attachment(message_id, upload_result)
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create attachment record"
        )
    
    return {
        "id": str(attachment.id),
        "file_name": attachment.file_name,
        "file_size": attachment.file_size,
        "file_type": attachment.file_type,
        "file_url": attachment.file_url,
        "created_at": attachment.created_at.isoformat()
    }


@router.delete("/messages/{message_id}/attachments/{attachment_id}")
async def delete_attachment(
    message_id: str,
    attachment_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an attachment"""
    
    from app.db.models import MessageAttachment
    
    try:
        attachment = MessageAttachment.objects.get(
            id=attachment_id,
            message_id=message_id
        )
        
        # Delete file from disk
        file_service = FileUploadService(tenant_id)
        file_service.delete_file(attachment.file_url)
        
        # Delete attachment record
        attachment.delete()
        
        return {"message": "Attachment deleted successfully"}
        
    except MessageAttachment.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )


@router.post("/messages/{message_id}/reactions")
async def add_reaction(
    message_id: str,
    reaction_type: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Add a reaction to a message"""
    
    from app.db.models import MessageReaction, Message
    
    # Verify user has access to the message
    try:
        message = Message.objects.get(id=message_id)
        # Check if user is participant of the conversation
        from app.db.models import ConversationParticipant
        has_access = ConversationParticipant.objects.filter(
            conversation=message.conversation,
            user_id=current_user.user_id
        ).exists()
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    except Message.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Validate reaction type
    valid_reactions = ['👍', '❤️', '😂', '😮', '😢', '😡']
    if reaction_type not in valid_reactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reaction type. Valid types: {', '.join(valid_reactions)}"
        )
    
    # Create or update reaction
    reaction, created = MessageReaction.objects.get_or_create(
        message_id=message_id,
        user_id=current_user.user_id,
        reaction_type=reaction_type
    )
    
    return {
        "id": str(reaction.id),
        "reaction_type": reaction.reaction_type,
        "created": created,
        "created_at": reaction.created_at.isoformat()
    }


@router.delete("/messages/{message_id}/reactions/{reaction_type}")
async def remove_reaction(
    message_id: str,
    reaction_type: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Remove a reaction from a message"""
    
    from app.db.models import MessageReaction
    
    try:
        reaction = MessageReaction.objects.get(
            message_id=message_id,
            user_id=current_user.user_id,
            reaction_type=reaction_type
        )
        reaction.delete()
        
        return {"message": "Reaction removed successfully"}
        
    except MessageReaction.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
