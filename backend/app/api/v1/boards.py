"""
Boards API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from asgiref.sync import sync_to_async

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.db.models import Board, BoardStatus
from app.schemas.tasks import BoardResponse, BoardStatus as BoardStatusSchema

router = APIRouter()


@router.get("", response_model=List[BoardResponse])
async def list_boards(
    project_id: Optional[str] = Query(None, description="Filter by project"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """List boards for tenant (workspace) with statuses."""

    @sync_to_async
    def fetch():
        qs = Board.objects.filter(tenant_id=tenant_id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        boards = list(qs.order_by("name"))
        result = []
        for board in boards:
            statuses = [
                BoardStatusSchema(
                    id=str(status.id),
                    key=status.key,
                    title=status.title,
                    color=status.color,
                    order=status.order,
                    wip_limit=status.wip_limit,
                    is_terminal=status.is_terminal,
                    allow_from=status.allow_from or [],
                )
                for status in board.statuses.all().order_by("order")
            ]
            result.append(
                BoardResponse(
                    id=str(board.id),
                    name=board.name,
                    description=board.description,
                    team=board.team,
                    project_id=str(board.project_id) if board.project_id else None,
                    wip_limit=board.wip_limit,
                    statuses=statuses,
                    created_at=board.created_at,
                    updated_at=board.updated_at,
                )
            )
        return result

    return await fetch()

