"""
Communications Service for Channels/Messages/Reactions
"""
from typing import Optional, List, Tuple
from datetime import datetime
from asgiref.sync import sync_to_async
from django.db.models import Q

from communications.models import (
    Channel,
    ChannelMembership,
    Message,
    Reaction,
    Attachment,
    ResourceLink,
)
from app.schemas.communications import (
    ChannelResponse,
    ChannelMemberResponse,
    MessageResponse,
    AttachmentResponse,
    ResourceLinkResponse,
    ReactionResponse,
    CreateChannelRequest,
    UpdateChannelRequest,
    AddMemberRequest,
    UpdateMemberRequest,
    CreateMessageRequest,
    EditMessageRequest,
    ReactionRequest,
    SearchMessagesResponse,
)
from app.core.errors import NotFoundError, ValidationError, ForbiddenError


class CommunicationsService:
    """Service for managing channels, messages, reactions"""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    # ---------- Channel helpers ----------

    async def _get_channel(self, channel_id: str) -> Channel:
        @sync_to_async
        def fetch():
            try:
                return Channel.objects.get(id=channel_id, tenant_id=self.tenant_id)
            except Channel.DoesNotExist:
                return None

        return await fetch()

    async def _get_membership(self, channel: Channel, user_id: str) -> Optional[ChannelMembership]:
        @sync_to_async
        def fetch():
            try:
                return ChannelMembership.objects.get(channel=channel, user_id=user_id, tenant_id=self.tenant_id)
            except ChannelMembership.DoesNotExist:
                return None

        return await fetch()

    async def _require_membership(self, channel: Channel, user_id: str) -> ChannelMembership:
        membership = await self._get_membership(channel, user_id)
        if not membership:
            raise ForbiddenError("Not a member of this channel")
        return membership

    # ---------- Channel operations ----------

    async def list_channels(self, user_id: str, team_id: Optional[str] = None, search: Optional[str] = None) -> List[ChannelResponse]:
        @sync_to_async
        def fetch():
            qs = Channel.objects.filter(tenant_id=self.tenant_id)
            if team_id:
                qs = qs.filter(team_id=team_id)
            if search:
                qs = qs.filter(name__icontains=search)
            qs = qs.filter(Q(is_private=False) | Q(memberships__user_id=user_id)).distinct()
            return list(qs.select_related("team", "created_by").prefetch_related("memberships"))

        channels = await fetch()
        return [await self._build_channel_response(ch) for ch in channels]

    async def create_channel(self, data: CreateChannelRequest, user_id: str) -> ChannelResponse:
        @sync_to_async
        def create():
            channel = Channel.objects.create(
                tenant_id=self.tenant_id,
                team_id=data.team_id,
                name=data.name,
                topic=data.topic,
                is_private=data.is_private,
                created_by_id=user_id,
            )
            ChannelMembership.objects.create(
                tenant_id=self.tenant_id, channel=channel, user_id=user_id, role="owner"
            )
            for mid in set(data.member_ids or []):
                if mid == user_id:
                    continue
                ChannelMembership.objects.get_or_create(
                    tenant_id=self.tenant_id,
                    channel=channel,
                    user_id=mid,
                    defaults={"role": "member"},
                )
            return channel

        channel = await create()
        return await self._build_channel_response(channel)

    async def update_channel(self, channel_id: str, data: UpdateChannelRequest, user_id: str) -> ChannelResponse:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        membership = await self._require_membership(channel, user_id)
        if membership.role != "owner":
            raise ForbiddenError("Only owners can update channel")

        @sync_to_async
        def update():
            if data.name is not None:
                channel.name = data.name
            if data.topic is not None:
                channel.topic = data.topic
            if data.is_private is not None:
                channel.is_private = data.is_private
            channel.save()
            return channel

        channel = await update()
        return await self._build_channel_response(channel)

    async def delete_channel(self, channel_id: str, user_id: str) -> None:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        membership = await self._require_membership(channel, user_id)
        if membership.role != "owner":
            raise ForbiddenError("Only owners can delete channel")

        @sync_to_async
        def delete():
            channel.delete()

        await delete()

    async def add_member(self, channel_id: str, data: AddMemberRequest, user_id: str) -> ChannelMemberResponse:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        membership = await self._require_membership(channel, user_id)
        if membership.role != "owner":
            raise ForbiddenError("Only owners can add members")

        @sync_to_async
        def add():
            member, _ = ChannelMembership.objects.update_or_create(
                tenant_id=self.tenant_id,
                channel=channel,
                user_id=data.user_id,
                defaults={"role": data.role.value},
            )
            return member

        member = await add()
        return ChannelMemberResponse(user_id=str(member.user_id), role=member.role, joined_at=member.created_at)

    async def update_member(self, channel_id: str, member_user_id: str, data: UpdateMemberRequest, user_id: str) -> ChannelMemberResponse:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        membership = await self._require_membership(channel, user_id)
        if membership.role != "owner":
            raise ForbiddenError("Only owners can update members")

        @sync_to_async
        def update():
            member = ChannelMembership.objects.get(
                tenant_id=self.tenant_id, channel=channel, user_id=member_user_id
            )
            member.role = data.role.value
            member.save()
            return member

        member = await update()
        return ChannelMemberResponse(user_id=str(member.user_id), role=member.role, joined_at=member.created_at)

    async def remove_member(self, channel_id: str, member_user_id: str, user_id: str) -> None:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        membership = await self._require_membership(channel, user_id)
        if membership.role != "owner":
            raise ForbiddenError("Only owners can remove members")

        @sync_to_async
        def remove():
            ChannelMembership.objects.filter(
                tenant_id=self.tenant_id, channel=channel, user_id=member_user_id
            ).delete()

        await remove()

    # ---------- Message operations ----------

    async def list_messages(self, channel_id: str, user_id: str, offset: int = 0, limit: int = 50) -> Tuple[List[MessageResponse], int]:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        await self._require_membership(channel, user_id)

        @sync_to_async
        def fetch():
            qs = (
                Message.objects.filter(channel=channel, tenant_id=self.tenant_id)
                .select_related("user", "parent")
                .prefetch_related("attachments", "reactions", "resource_links")
                .order_by("created_at")
            )
            total = qs.count()
            items = list(qs[offset : offset + limit])
            return items, total

        items, total = await fetch()
        return [await self._build_message_response(m) for m in items], total

    async def _get_message(self, message_id: str) -> Optional[Message]:
        @sync_to_async
        def fetch():
            try:
                return Message.objects.select_related("channel").get(
                    id=message_id, tenant_id=self.tenant_id
                )
            except Message.DoesNotExist:
                return None

        return await fetch()

    async def create_message(self, channel_id: str, data: CreateMessageRequest, user_id: str) -> MessageResponse:
        channel = await self._get_channel(channel_id)
        if not channel:
            raise NotFoundError("Channel not found")
        await self._require_membership(channel, user_id)

        parent = None
        if data.parent_id:
            parent = await self._get_message(data.parent_id)
            if not parent or parent.channel_id != channel.id:
                raise ValidationError("Invalid parent message")

        @sync_to_async
        def create():
            message = Message.objects.create(
                tenant_id=self.tenant_id,
                channel=channel,
                user_id=user_id,
                content=data.content,
                parent=parent,
                has_attachments=bool(data.attachments),
            )
            for att in data.attachments or []:
                Attachment.objects.create(
                    tenant_id=self.tenant_id,
                    message=message,
                    file_url=att.file_url,
                    file_name=att.file_name,
                    file_type=att.file_type,
                    file_size=att.file_size,
                )
            for rl in data.resource_links or []:
                ResourceLink.objects.create(
                    tenant_id=self.tenant_id,
                    message=message,
                    resource_type=rl.resource_type.value,
                    resource_id=rl.resource_id,
                    label=rl.label,
                )
            return message

        message = await create()
        return await self._build_message_response(message)

    async def edit_message(self, message_id: str, data: EditMessageRequest, user_id: str) -> MessageResponse:
        message = await self._get_message(message_id)
        if not message:
            raise NotFoundError("Message not found")
        membership = await self._require_membership(message.channel, user_id)
        if message.user_id != user_id and membership.role != "owner":
            raise ForbiddenError("No permission to edit this message")

        @sync_to_async
        def update():
            message.content = data.content
            message.edited_at = datetime.utcnow()
            message.save()
            return message

        message = await update()
        return await self._build_message_response(message)

    async def delete_message(self, message_id: str, user_id: str) -> None:
        message = await self._get_message(message_id)
        if not message:
            raise NotFoundError("Message not found")
        membership = await self._require_membership(message.channel, user_id)
        if message.user_id != user_id and membership.role != "owner":
            raise ForbiddenError("No permission to delete this message")

        @sync_to_async
        def delete():
            message.is_deleted = True
            message.content = ""
            message.save()

        await delete()

    async def add_reaction(self, message_id: str, data: ReactionRequest, user_id: str) -> ReactionResponse:
        message = await self._get_message(message_id)
        if not message:
            raise NotFoundError("Message not found")
        await self._require_membership(message.channel, user_id)

        @sync_to_async
        def add():
            reaction, _ = Reaction.objects.get_or_create(
                tenant_id=self.tenant_id,
                message=message,
                user_id=user_id,
                emoji=data.emoji,
            )
            return reaction

        reaction = await add()
        return ReactionResponse(
            id=str(reaction.id),
            emoji=reaction.emoji,
            user_id=str(reaction.user_id),
            created_at=reaction.created_at,
        )

    async def remove_reaction(self, message_id: str, emoji: str, user_id: str) -> None:
        message = await self._get_message(message_id)
        if not message:
            raise NotFoundError("Message not found")
        await self._require_membership(message.channel, user_id)

        @sync_to_async
        def remove():
            Reaction.objects.filter(
                tenant_id=self.tenant_id, message=message, user_id=user_id, emoji=emoji
            ).delete()

        await remove()

    async def search_messages(self, query: str, user_id: str, limit: int = 50) -> SearchMessagesResponse:
        @sync_to_async
        def fetch():
            qs = (
                Message.objects.filter(
                    tenant_id=self.tenant_id,
                    content__icontains=query,
                )
                .filter(Q(channel__is_private=False) | Q(channel__memberships__user_id=user_id))
                .select_related("channel")
                .prefetch_related("attachments", "reactions", "resource_links")
                .order_by("-created_at")[:limit]
            )
            items = list(qs)
            return items, len(items)

        items, total = await fetch()
        return SearchMessagesResponse(
            items=[await self._build_message_response(m) for m in items],
            total=total,
        )

    # ---------- Private helpers ----------

    async def _build_channel_response(self, channel: Channel) -> ChannelResponse:
        @sync_to_async
        def fetch_members():
            memberships = ChannelMembership.objects.filter(channel=channel).order_by("created_at")
            return [
                ChannelMemberResponse(
                    user_id=str(m.user_id),
                    role=m.role,
                    joined_at=m.created_at,
                )
                for m in memberships
            ]

        members = await fetch_members()
        return ChannelResponse(
            id=str(channel.id),
            name=channel.name,
            topic=channel.topic,
            team_id=str(channel.team_id) if channel.team_id else None,
            is_private=channel.is_private,
            created_by=str(channel.created_by_id),
            created_at=channel.created_at,
            updated_at=channel.updated_at,
            members=members,
        )

    async def _build_message_response(self, message: Message) -> MessageResponse:
        @sync_to_async
        def fetch_related():
            attachments = [
                AttachmentResponse(
                    id=str(a.id),
                    file_url=a.file_url,
                    file_name=a.file_name,
                    file_type=a.file_type,
                    file_size=a.file_size,
                    created_at=a.created_at,
                )
                for a in message.attachments.all()
            ]
            reactions = [
                ReactionResponse(
                    id=str(r.id),
                    emoji=r.emoji,
                    user_id=str(r.user_id),
                    created_at=r.created_at,
                )
                for r in message.reactions.all()
            ]
            resource_links = [
                ResourceLinkResponse(
                    id=str(rl.id),
                    resource_type=rl.resource_type,
                    resource_id=str(rl.resource_id),
                    label=rl.label,
                    created_at=rl.created_at,
                )
                for rl in message.resource_links.all()
            ]
            return attachments, reactions, resource_links

        attachments, reactions, resource_links = await fetch_related()
        return MessageResponse(
            id=str(message.id),
            channel_id=str(message.channel_id),
            user_id=str(message.user_id),
            content=message.content,
            parent_id=str(message.parent_id) if message.parent_id else None,
            has_attachments=message.has_attachments,
            is_deleted=message.is_deleted,
            edited_at=message.edited_at,
            created_at=message.created_at,
            updated_at=message.updated_at,
            attachments=attachments,
            reactions=reactions,
            resource_links=resource_links,
        )
