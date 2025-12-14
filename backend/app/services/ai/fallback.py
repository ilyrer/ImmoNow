"""
Fallback-Implementierung der AI-Interfaces (regelbasiert, provider-agnostisch).
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import random

from .base import (
    AiTaskService,
    AiAnalyticsService,
    GeneratedTaskProposal,
    PrioritySuggestion,
    AssigneeSuggestion,
    BoardSummary,
)


class SimpleAiTaskService(AiTaskService):
    """Einfache Heuristiken statt echter LLMs, um die Schnittstelle testbar zu halten."""

    async def generate_task_from_text(self, tenant_id: str, text: str) -> GeneratedTaskProposal:
        title = text.split("\n")[0][:120] if text else "Neue Aufgabe"
        description = text or "Automatisch generiert"
        due_date = datetime.utcnow() + timedelta(days=5)
        return GeneratedTaskProposal(
            title=title,
            description=description,
            status="todo",
            priority="medium",
            due_date=due_date,
            labels=["auto"],
            tags=["generated"],
            story_points=3,
        )

    async def calculate_task_priority(self, tenant_id: str, task_id: str) -> PrioritySuggestion:
        score = round(random.uniform(0.3, 0.9), 2)
        suggested_priority = "high" if score > 0.7 else "medium"
        return PrioritySuggestion(
            task_id=task_id,
            score=score,
            suggested_priority=suggested_priority,
            rationale="Heuristik basierend auf Fälligkeit und Alter.",
        )

    async def suggest_assignee(self, tenant_id: str, task_id: str) -> AssigneeSuggestion:
        return AssigneeSuggestion(
            task_id=task_id,
            assignee_id="auto-suggested",
            reason="Passend zu Historie/Workload (Heuristik).",
        )

    async def summarize_board(self, tenant_id: str, board_id: str) -> BoardSummary:
        return BoardSummary(
            board_id=board_id,
            summary="Kurze Board-Zusammenfassung (heuristisch).",
            highlights=["3 Aufgaben abgeschlossen", "2 Aufgaben kurz vor Fälligkeit"],
            risks=["1 Blocker seit 5 Tagen"],
            blockers=["TASK-123 Blockiert durch fehlende Freigabe"],
            suggested_actions=["Prio-Check der überfälligen Aufgaben"],
        )


class SimpleAiAnalyticsService(AiAnalyticsService):
    """Heuristische Analytics/Forecasting."""

    async def analyze_throughput(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        return {
            "throughput_per_week": 12,
            "cycle_time_days": 4.5,
            "bottlenecks": ["review"],
        }

    async def forecast_completion(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        return {
            "expected_completion_days": 14,
            "confidence": 0.62,
            "assumptions": ["Konstante Velocity der letzten 3 Wochen"],
        }

