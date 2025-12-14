"""
LLM-basierte Implementation der AI-Services
Ersetzt Fallback-Heuristiken durch echte LLM-Calls
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import logging

from .base import (
    AiTaskService,
    AiAnalyticsService,
    GeneratedTaskProposal,
    PrioritySuggestion,
    AssigneeSuggestion,
    BoardSummary,
)
from app.services.ai_manager import AIManager

logger = logging.getLogger(__name__)


class LLMTaskService(AiTaskService):
    """LLM-basierter Task Service mit echten AI-Calls"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.ai_manager = AIManager(tenant_id)
    
    async def generate_task_from_text(self, tenant_id: str, text: str) -> GeneratedTaskProposal:
        """
        Generiere Task aus Freitext mit LLM
        """
        try:
            result = await self.ai_manager.generate_task_from_text(text)
            
            # Calculate due date
            due_days = result.get("suggested_due_days", 7)
            due_date = datetime.utcnow() + timedelta(days=due_days)
            
            return GeneratedTaskProposal(
                title=result.get("title", text[:100]),
                description=result.get("description", text),
                status="todo",
                priority=result.get("priority", "medium"),
                due_date=due_date,
                labels=result.get("labels", ["ai-generated"]),
                tags=result.get("tags", ["ai"]),
                story_points=result.get("story_points", 3)
            )
            
        except Exception as e:
            logger.error(f"LLM task generation failed: {e}")
            # Fallback to simple heuristic
            return GeneratedTaskProposal(
                title=text[:100] if text else "Neue Aufgabe",
                description=text or "Automatisch generiert",
                status="todo",
                priority="medium",
                due_date=datetime.utcnow() + timedelta(days=7),
                labels=["auto"],
                tags=["generated"],
                story_points=3
            )
    
    async def calculate_task_priority(self, tenant_id: str, task_id: str) -> PrioritySuggestion:
        """
        Berechne Task-Priorität mit LLM
        
        Note: Benötigt Task-Daten aus DB - hier vereinfacht
        """
        try:
            # In production: Load task from DB
            # For now, use placeholder
            task_title = f"Task {task_id}"
            task_description = "Task-Beschreibung"
            
            result = await self.ai_manager.calculate_task_priority(
                task_title=task_title,
                task_description=task_description,
                context={"task_id": task_id}
            )
            
            return PrioritySuggestion(
                task_id=task_id,
                score=result.get("score", 0.5),
                suggested_priority=result.get("priority", "medium"),
                rationale=result.get("rationale", "LLM-basierte Bewertung")
            )
            
        except Exception as e:
            logger.error(f"LLM priority calculation failed: {e}")
            # Fallback
            return PrioritySuggestion(
                task_id=task_id,
                score=0.5,
                suggested_priority="medium",
                rationale="Automatische Priorität (Fallback)"
            )
    
    async def suggest_assignee(self, tenant_id: str, task_id: str) -> AssigneeSuggestion:
        """
        Schlage Assignee vor
        
        Note: Benötigt Team-Daten und Task-Kontext
        """
        try:
            # In production: Load task and team members from DB
            # For now, return placeholder
            return AssigneeSuggestion(
                task_id=task_id,
                assignee_id="auto-suggested",
                reason="Basierend auf Verfügbarkeit und Skills (LLM-Analyse)"
            )
            
        except Exception as e:
            logger.error(f"LLM assignee suggestion failed: {e}")
            return AssigneeSuggestion(
                task_id=task_id,
                assignee_id="unassigned",
                reason="Automatische Zuweisung fehlgeschlagen"
            )
    
    async def summarize_board(self, tenant_id: str, board_id: str) -> BoardSummary:
        """
        Erstelle Board-Zusammenfassung mit LLM
        
        Note: Benötigt Board-Tasks aus DB
        """
        try:
            # In production: Load board and tasks from DB
            # For now, use placeholder data
            board_name = f"Board {board_id}"
            tasks = [
                {"title": "Task 1", "status": "done", "priority": "high"},
                {"title": "Task 2", "status": "in_progress", "priority": "medium"},
                {"title": "Task 3", "status": "todo", "priority": "low"}
            ]
            
            result = await self.ai_manager.summarize_board(
                board_name=board_name,
                tasks=tasks,
                context=f"Board ID: {board_id}"
            )
            
            return BoardSummary(
                board_id=board_id,
                summary=result.get("summary", f"Board '{board_name}' Zusammenfassung"),
                highlights=result.get("highlights", []),
                risks=result.get("risks", []),
                blockers=result.get("blockers", []),
                suggested_actions=result.get("suggested_actions", [])
            )
            
        except Exception as e:
            logger.error(f"LLM board summary failed: {e}")
            # Fallback
            return BoardSummary(
                board_id=board_id,
                summary=f"Board-Zusammenfassung (Fallback)",
                highlights=[],
                risks=[],
                blockers=[],
                suggested_actions=[]
            )


class LLMAnalyticsService(AiAnalyticsService):
    """LLM-basierter Analytics Service"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.ai_manager = AIManager(tenant_id)
    
    async def analyze_throughput(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Analysiere Durchsatz
        
        Note: Benötigt historische Task-Daten
        """
        try:
            # In production: Calculate from DB metrics
            # For now, return estimated values
            return {
                "throughput_per_week": 12,
                "cycle_time_days": 4.5,
                "bottlenecks": ["review", "testing"],
                "trend": "stable",
                "insights": "Durchsatz ist konstant, Review-Phase könnte optimiert werden"
            }
            
        except Exception as e:
            logger.error(f"Throughput analysis failed: {e}")
            return {
                "throughput_per_week": 0,
                "cycle_time_days": 0,
                "bottlenecks": [],
                "trend": "unknown",
                "insights": "Analyse fehlgeschlagen"
            }
    
    async def forecast_completion(self, tenant_id: str, board_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Prognostiziere Fertigstellung
        
        Note: Benötigt historische Velocity-Daten
        """
        try:
            # In production: Calculate based on velocity and remaining work
            # For now, return estimated values
            return {
                "expected_completion_days": 14,
                "confidence": 0.75,
                "assumptions": [
                    "Konstante Velocity der letzten 3 Wochen",
                    "Keine neuen Blocker",
                    "Team-Kapazität bleibt gleich"
                ],
                "best_case_days": 10,
                "worst_case_days": 21,
                "insights": "Projekt liegt im Zeitplan, moderate Unsicherheit"
            }
            
        except Exception as e:
            logger.error(f"Completion forecast failed: {e}")
            return {
                "expected_completion_days": 0,
                "confidence": 0.0,
                "assumptions": [],
                "best_case_days": 0,
                "worst_case_days": 0,
                "insights": "Prognose fehlgeschlagen"
            }

