"""
Event Subscribers für Task-Events
Erstellt TaskActivity Einträge basierend auf Events
"""
from typing import Dict, Any
from asgiref.sync import sync_to_async
import logging

from tasks.models import TaskActivity, Task
from accounts.models import User

logger = logging.getLogger(__name__)


async def handle_task_activity_event(event_type: str, payload: Dict[str, Any]) -> None:
    """Erstellt TaskActivity Einträge aus Events"""
    try:
        task_id = payload.get("task_id")
        tenant_id = payload.get("tenant_id")
        
        if not task_id or not tenant_id:
            logger.warning(f"Missing task_id or tenant_id in event payload: {event_type}")
            return
        
        # Mapping: event_type → TaskActivity.action
        action_mapping = {
            "task.created": "created",
            "task.status_changed": "moved",
            "task.assigned": "updated",
        }
        
        action = action_mapping.get(event_type, "updated")
        
        # Hole Task und User
        @sync_to_async
        def create_activity():
            try:
                task = Task.objects.get(id=task_id, tenant_id=tenant_id)
            except Task.DoesNotExist:
                logger.warning(f"Task {task_id} not found for activity log")
                return
            
            # User-ID aus payload (falls vorhanden)
            user_id = payload.get("user_id")
            user = None
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    pass
            
            # Beschreibung basierend auf Event-Type
            description = _build_description(event_type, payload)
            
            # Old/New Values
            old_values = {}
            new_values = {}
            
            if event_type == "task.status_changed":
                old_values = {"status": payload.get("old_status")}
                new_values = {"status": payload.get("new_status")}
            elif event_type == "task.assigned":
                old_values = {"assignee_id": payload.get("old_assignee_id")}
                new_values = {"assignee_id": payload.get("assignee_id")}
            elif event_type == "task.created":
                task_data = payload.get("task_data", {})
                new_values = {
                    "title": task_data.get("title"),
                    "status": task_data.get("status"),
                    "priority": task_data.get("priority"),
                }
            
            # Erstelle TaskActivity
            TaskActivity.objects.create(
                task=task,
                action=action,
                user=user,
                description=description,
                old_values=old_values,
                new_values=new_values,
            )
        
        await create_activity()
        
    except Exception as e:
        logger.error(f"Error handling task activity event {event_type}: {str(e)}", exc_info=True)


async def handle_automation_event(event_type: str, payload: Dict[str, Any]) -> None:
    """Führt Automation Rules bei Events aus"""
    try:
        tenant_id = payload.get("tenant_id")
        
        if not tenant_id:
            logger.warning(f"Missing tenant_id in event payload: {event_type}")
            return
        
        # Import hier um Circular Import zu vermeiden
        from app.services.automation import AutomationService
        
        automation_service = AutomationService(tenant_id)
        results = await automation_service.handle_event(event_type, payload)
        
        if results:
            logger.info(f"Executed {len(results)} automation rules for event {event_type}")
        
    except Exception as e:
        logger.error(f"Error handling automation event {event_type}: {str(e)}", exc_info=True)


def _build_description(event_type: str, payload: Dict[str, Any]) -> str:
    """Baut Beschreibung für TaskActivity"""
    if event_type == "task.created":
        return f"Task '{payload.get('task_data', {}).get('title', '')}' wurde erstellt"
    elif event_type == "task.status_changed":
        old_status = payload.get("old_status", "unknown")
        new_status = payload.get("new_status", "unknown")
        return f"Status geändert von '{old_status}' zu '{new_status}'"
    elif event_type == "task.assigned":
        assignee_id = payload.get("assignee_id")
        return f"Task wurde zugewiesen an User {assignee_id}"
    else:
        return f"Task wurde aktualisiert"
