"""
Automation Service
Verwaltet Automation Rules und führt sie bei Events aus
"""
from typing import Dict, Any, List, Optional
from asgiref.sync import sync_to_async
from datetime import datetime
import logging
import time

from app.db.models import AutomationRule, AutomationLog, Task
from app.services.automation.condition_evaluator import ConditionEvaluator
from app.services.automation.action_executor import ActionExecutor

logger = logging.getLogger(__name__)


class AutomationService:
    """Service für Automation Rules"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.condition_evaluator = ConditionEvaluator()
        self.action_executor = ActionExecutor(tenant_id)
    
    async def handle_event(self, event_type: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Verarbeitet Event und führt passende Automation Rules aus
        
        Args:
            event_type: Event-Type (z.B. "task.status_changed")
            payload: Event-Payload
        
        Returns:
            Liste von Execution-Results
        """
        # Hole aktive Rules für diesen Event-Type
        rules = await self._get_active_rules(event_type)
        
        if not rules:
            return []
        
        results = []
        
        for rule in rules:
            try:
                result = await self._execute_rule(rule, event_type, payload)
                results.append(result)
            except Exception as e:
                logger.error(f"Error executing automation rule {rule.id}: {str(e)}", exc_info=True)
                results.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "status": "error",
                    "error": str(e),
                })
        
        return results
    
    async def _get_active_rules(self, event_type: str) -> List[AutomationRule]:
        """Holt aktive Automation Rules für Event-Type"""
        
        @sync_to_async
        def fetch_rules():
            return list(
                AutomationRule.objects.filter(
                    tenant_id=self.tenant_id,
                    trigger=event_type,
                    is_active=True
                ).order_by("created_at")
            )
        
        return await fetch_rules()
    
    async def _execute_rule(
        self, 
        rule: AutomationRule, 
        event_type: str, 
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Führt eine Automation Rule aus"""
        start_time = time.time()
        
        # Erstelle Log-Eintrag
        log_entry = await self._create_log_entry(rule, event_type, payload)
        
        try:
            # Prüfe Conditions
            conditions_met = self.condition_evaluator.evaluate(rule.conditions, payload)
            
            if not conditions_met:
                # Conditions nicht erfüllt → Skipped
                await self._update_log_entry(
                    log_entry, 
                    status="skipped",
                    conditions_met=False
                )
                return {
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "status": "skipped",
                    "reason": "Conditions not met",
                }
            
            # Führe Actions aus
            action_results = await self.action_executor.execute(rule.actions, payload)
            
            # Update Rule stats
            await self._update_rule_stats(rule)
            
            # Update Log
            execution_time_ms = int((time.time() - start_time) * 1000)
            await self._update_log_entry(
                log_entry,
                status="success",
                conditions_met=True,
                actions_executed=action_results,
                execution_time_ms=execution_time_ms,
            )
            
            return {
                "rule_id": str(rule.id),
                "rule_name": rule.name,
                "status": "success",
                "actions_executed": len(action_results),
                "action_results": action_results,
            }
            
        except Exception as e:
            # Fehler beim Ausführen
            execution_time_ms = int((time.time() - start_time) * 1000)
            await self._update_log_entry(
                log_entry,
                status="failed",
                error_message=str(e),
                execution_time_ms=execution_time_ms,
            )
            
            raise
    
    async def _create_log_entry(
        self, 
        rule: AutomationRule, 
        event_type: str, 
        payload: Dict[str, Any]
    ) -> AutomationLog:
        """Erstellt AutomationLog Eintrag"""
        
        @sync_to_async
        def create_log():
            return AutomationLog.objects.create(
                automation_rule=rule,
                tenant_id=self.tenant_id,
                trigger_event=event_type,
                event_payload=payload,
                status="success",  # Wird später aktualisiert
            )
        
        return await create_log()
    
    async def _update_log_entry(
        self,
        log_entry: AutomationLog,
        status: str,
        conditions_met: bool = True,
        actions_executed: Optional[List[Dict[str, Any]]] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[int] = None,
    ) -> None:
        """Aktualisiert AutomationLog Eintrag"""
        
        @sync_to_async
        def update_log():
            log_entry.status = status
            log_entry.conditions_met = conditions_met
            if actions_executed is not None:
                log_entry.actions_executed = actions_executed
            if error_message:
                log_entry.error_message = error_message
            if execution_time_ms:
                log_entry.execution_time_ms = execution_time_ms
            log_entry.completed_at = datetime.utcnow()
            log_entry.save()
        
        await update_log()
    
    async def _update_rule_stats(self, rule: AutomationRule) -> None:
        """Aktualisiert Execution-Stats der Rule"""
        
        @sync_to_async
        def update_stats():
            rule.execution_count += 1
            rule.last_executed_at = datetime.utcnow()
            rule.save()
        
        await update_stats()
    
    async def create_rule(
        self,
        name: str,
        trigger: str,
        conditions: List[Dict[str, Any]],
        actions: List[Dict[str, Any]],
        description: Optional[str] = None,
        created_by_id: Optional[str] = None,
    ) -> AutomationRule:
        """Erstellt neue Automation Rule"""
        
        @sync_to_async
        def create():
            from app.db.models import User
            
            created_by = None
            if created_by_id:
                try:
                    created_by = User.objects.get(id=created_by_id)
                except User.DoesNotExist:
                    pass
            
            return AutomationRule.objects.create(
                tenant_id=self.tenant_id,
                name=name,
                description=description,
                trigger=trigger,
                conditions=conditions,
                actions=actions,
                created_by=created_by,
                is_active=True,
            )
        
        return await create()
    
    async def get_rules(self) -> List[AutomationRule]:
        """Holt alle Automation Rules für Tenant"""
        
        @sync_to_async
        def fetch():
            return list(
                AutomationRule.objects.filter(tenant_id=self.tenant_id).order_by("-created_at")
            )
        
        return await fetch()
    
    async def get_rule(self, rule_id: str) -> Optional[AutomationRule]:
        """Holt einzelne Automation Rule"""
        
        @sync_to_async
        def fetch():
            try:
                return AutomationRule.objects.get(id=rule_id, tenant_id=self.tenant_id)
            except AutomationRule.DoesNotExist:
                return None
        
        return await fetch()
    
    async def update_rule(
        self,
        rule_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        trigger: Optional[str] = None,
        conditions: Optional[List[Dict[str, Any]]] = None,
        actions: Optional[List[Dict[str, Any]]] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[AutomationRule]:
        """Aktualisiert Automation Rule"""
        
        @sync_to_async
        def update():
            try:
                rule = AutomationRule.objects.get(id=rule_id, tenant_id=self.tenant_id)
            except AutomationRule.DoesNotExist:
                return None
            
            if name is not None:
                rule.name = name
            if description is not None:
                rule.description = description
            if trigger is not None:
                rule.trigger = trigger
            if conditions is not None:
                rule.conditions = conditions
            if actions is not None:
                rule.actions = actions
            if is_active is not None:
                rule.is_active = is_active
            
            rule.save()
            return rule
        
        return await update()
    
    async def delete_rule(self, rule_id: str) -> bool:
        """Löscht Automation Rule"""
        
        @sync_to_async
        def delete():
            try:
                rule = AutomationRule.objects.get(id=rule_id, tenant_id=self.tenant_id)
                rule.delete()
                return True
            except AutomationRule.DoesNotExist:
                return False
        
        return await delete()
    
    async def get_execution_logs(
        self,
        rule_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[AutomationLog]:
        """Holt Execution Logs"""
        
        @sync_to_async
        def fetch():
            queryset = AutomationLog.objects.filter(tenant_id=self.tenant_id)
            
            if rule_id:
                queryset = queryset.filter(automation_rule_id=rule_id)
            
            return list(queryset[:limit])
        
        return await fetch()

