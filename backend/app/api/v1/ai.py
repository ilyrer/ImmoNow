"""
AI Endpoints (abstrakte Schnittstellen, provider-agnostisch)
"""
import os
from fastapi import APIRouter, Depends, Body
from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.services.ai import SimpleAiTaskService, SimpleAiAnalyticsService
from app.services.ai.llm_implementation import LLMTaskService, LLMAnalyticsService
from app.schemas.tasks import (
    AiGeneratedTask,
    AiPrioritySuggestion,
    AiAssigneeSuggestion,
    BoardSummaryResponse,
)

router = APIRouter()

# Use LLM-based services if AI provider is configured, otherwise fallback
USE_LLM = os.getenv("AI_PROVIDER") and os.getenv("OPENROUTER_API_KEY")

def get_task_ai_service(tenant_id: str):
    """Get appropriate task AI service based on configuration"""
    if USE_LLM:
        return LLMTaskService(tenant_id)
    return SimpleAiTaskService()

def get_analytics_ai_service(tenant_id: str):
    """Get appropriate analytics AI service based on configuration"""
    if USE_LLM:
        return LLMAnalyticsService(tenant_id)
    return SimpleAiAnalyticsService()


@router.post("/tasks/generate", response_model=AiGeneratedTask)
async def generate_task_from_text(
    text: str = Body(..., embed=True, description="Freitext/Notizen"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    task_ai = get_task_ai_service(tenant_id)
    proposal = await task_ai.generate_task_from_text(tenant_id, text)
    return AiGeneratedTask(
        title=proposal.title,
        description=proposal.description,
        status=proposal.status,
        priority=proposal.priority,
        due_date=proposal.due_date,
        labels=proposal.labels,
        suggested_tags=proposal.tags,
        suggested_story_points=proposal.story_points,
    )


@router.post("/tasks/{task_id}/priority", response_model=AiPrioritySuggestion)
async def calculate_priority(
    task_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    task_ai = get_task_ai_service(tenant_id)
    suggestion = await task_ai.calculate_task_priority(tenant_id, task_id)
    return suggestion


@router.post("/tasks/{task_id}/assignee", response_model=AiAssigneeSuggestion)
async def suggest_assignee(
    task_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    task_ai = get_task_ai_service(tenant_id)
    suggestion = await task_ai.suggest_assignee(tenant_id, task_id)
    return suggestion


@router.post("/boards/{board_id}/summary", response_model=BoardSummaryResponse)
async def summarize_board(
    board_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    task_ai = get_task_ai_service(tenant_id)
    summary = await task_ai.summarize_board(tenant_id, board_id)
    return BoardSummaryResponse(**summary.__dict__)


@router.get("/boards/{board_id}/forecast")
async def forecast_board_completion(
    board_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    analytics_ai = get_analytics_ai_service(tenant_id)
    return await analytics_ai.forecast_completion(tenant_id, board_id)

