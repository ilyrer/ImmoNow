"""
Abstrakte AI-Service-Schnittstellen (provider-agnostisch).
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime


@dataclass
class GeneratedTaskProposal:
    title: str
    description: str
    status: str
    priority: str
    due_date: datetime
    labels: List[str]
    tags: List[str]
    story_points: Optional[int] = None


@dataclass
class PrioritySuggestion:
    task_id: str
    score: float
    suggested_priority: str
    rationale: str


@dataclass
class AssigneeSuggestion:
    task_id: str
    assignee_id: str
    reason: str


@dataclass
class BoardSummary:
    board_id: str
    summary: str
    highlights: List[str]
    risks: List[str]
    blockers: List[str]
    suggested_actions: List[str]


class AiTaskService:
    """Interface für Task-bezogene KI-Funktionen."""

    async def generate_task_from_text(self, tenant_id: str, text: str) -> GeneratedTaskProposal:
        raise NotImplementedError

    async def calculate_task_priority(self, tenant_id: str, task_id: str) -> PrioritySuggestion:
        raise NotImplementedError

    async def suggest_assignee(self, tenant_id: str, task_id: str) -> AssigneeSuggestion:
        raise NotImplementedError

    async def summarize_board(self, tenant_id: str, board_id: str) -> BoardSummary:
        raise NotImplementedError


class AiAnalyticsService:
    """Interface für KI-Analysen/Forecasting."""

    async def analyze_throughput(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError

    async def forecast_completion(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError

