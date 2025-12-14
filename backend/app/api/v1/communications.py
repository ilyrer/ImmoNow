"""
Communications API Endpoints (Channels/Messages)
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    require_read_scope,
    require_write_scope,
    require_delete_scope,
    get_tenant_id,
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.communications import (
    ChannelResponse,
    ChannelMemberResponse,
    MessageResponse,
    CreateChannelRequest,
    UpdateChannelRequest,
    AddMemberRequest,
    UpdateMemberRequest,
    CreateMessageRequest,
    EditMessageRequest,
    ReactionRequest,
    SearchMessagesResponse,
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.communications_service import CommunicationsService

router = APIRouter()


@router.get("/channels", response_model=list[ChannelResponse])
async def list_channels(
    team_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.list_channels(user_id=current_user.user_id, team_id=team_id, search=search)


@router.post("/channels", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    payload: CreateChannelRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.create_channel(payload, user_id=current_user.user_id)


@router.patch("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: str,
    payload: UpdateChannelRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.update_channel(channel_id, payload, user_id=current_user.user_id)


@router.delete("/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    await service.delete_channel(channel_id, user_id=current_user.user_id)


@router.post("/channels/{channel_id}/members", response_model=ChannelMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    channel_id: str,
    payload: AddMemberRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.add_member(channel_id, payload, user_id=current_user.user_id)


@router.patch("/channels/{channel_id}/members/{member_user_id}", response_model=ChannelMemberResponse)
async def update_member(
    channel_id: str,
    member_user_id: str,
    payload: UpdateMemberRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.update_member(channel_id, member_user_id, payload, user_id=current_user.user_id)


@router.delete("/channels/{channel_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    channel_id: str,
    member_user_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    await service.remove_member(channel_id, member_user_id, user_id=current_user.user_id)


@router.get("/channels/{channel_id}/messages", response_model=PaginatedResponse[MessageResponse])
async def list_messages(
    channel_id: str,
    pagination: PaginationParams = Depends(),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    offset = get_pagination_offset(pagination.page, pagination.size)
    service = CommunicationsService(tenant_id)
    messages, total = await service.list_messages(channel_id, user_id=current_user.user_id, offset=offset, limit=pagination.size)
    return PaginatedResponse.create(items=messages, total=total, page=pagination.page, size=pagination.size)


@router.post("/channels/{channel_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    channel_id: str,
    payload: CreateMessageRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.create_message(channel_id, payload, user_id=current_user.user_id)


@router.patch("/messages/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: str,
    payload: EditMessageRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.edit_message(message_id, payload, user_id=current_user.user_id)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    await service.delete_message(message_id, user_id=current_user.user_id)


@router.post("/messages/{message_id}/reactions", response_model=MessageResponse)
async def add_reaction(
    message_id: str,
    payload: ReactionRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    await service.add_reaction(message_id, payload, user_id=current_user.user_id)
    message = await service._get_message(message_id)
    if not message:
        raise NotFoundError("Message not found")
    return await service._build_message_response(message)


@router.delete("/messages/{message_id}/reactions", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    message_id: str,
    emoji: str = Query(..., description="Emoji to remove"),
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    await service.remove_reaction(message_id, emoji, user_id=current_user.user_id)


@router.get("/search", response_model=SearchMessagesResponse)
async def search_messages(
    q: str = Query(..., description="Search term"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    service = CommunicationsService(tenant_id)
    return await service.search_messages(q, user_id=current_user.user_id)
