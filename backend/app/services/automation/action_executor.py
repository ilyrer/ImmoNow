"""
Action Executor für Automation Rules
Führt Actions aus (assign_user, send_notification, update_field, add_comment)
"""
from typing import Dict, Any, List
from asgiref.sync import sync_to_async
from django.db import models
import logging

from app.db.models import Task, User, TaskComment
from app.services.tasks_service import TasksService
from app.core.errors import ValidationError

logger = logging.getLogger(__name__)


class ActionExecutor:
    """Führt Automation Actions aus"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.tasks_service = TasksService(tenant_id)
    
    async def execute(self, actions: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Führt Liste von Actions aus
        
        Args:
            actions: Liste von Actions
                Format: [{"type": "assign_user", "params": {"user_id": "..."}}, ...]
            context: Event-Payload mit Task-Daten
        
        Returns:
            Liste von Execution-Results
        """
        results = []
        
        for action in actions:
            try:
                result = await self._execute_single(action, context)
                results.append({
                    "action": action,
                    "status": "success",
                    "result": result,
                })
            except Exception as e:
                logger.error(f"Error executing action {action}: {str(e)}", exc_info=True)
                results.append({
                    "action": action,
                    "status": "failed",
                    "error": str(e),
                })
        
        return results
    
    async def _execute_single(self, action: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """Führt eine einzelne Action aus"""
        action_type = action.get("type")
        params = action.get("params", {})
        task_id = context.get("task_id")
        
        if not task_id:
            raise ValidationError("task_id missing in context")
        
        if action_type == "assign_user":
            return await self._assign_user(task_id, params)
        elif action_type == "send_notification":
            return await self._send_notification(task_id, params, context)
        elif action_type == "update_field":
            return await self._update_field(task_id, params)
        elif action_type == "add_comment":
            return await self._add_comment(task_id, params, context)
        elif action_type == "create_subtask":
            return await self._create_subtask(task_id, params)
        else:
            raise ValidationError(f"Unknown action type: {action_type}")
    
    async def _assign_user(self, task_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Weist Task einem User zu"""
        user_id = params.get("user_id")
        if not user_id:
            raise ValidationError("user_id required for assign_user action")
        
        # Validiere User existiert
        @sync_to_async
        def check_user():
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise ValidationError(f"User {user_id} not found")
        
        await check_user()
        
        # Update Task
        from app.schemas.tasks import UpdateTaskRequest
        update_request = UpdateTaskRequest(assignee_id=user_id)
        
        task = await self.tasks_service.update_task(task_id, update_request, user_id)
        
        return {"assigned_to": user_id, "task_id": task_id}
    
    async def _send_notification(self, task_id: str, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Sendet Notification"""
        recipient_id = params.get("recipient_id") or params.get("user_id")
        message = params.get("message", "Task wurde aktualisiert")
        
        if not recipient_id:
            # Fallback: Assignee des Tasks
            @sync_to_async
            def get_task_assignee():
                try:
                    task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
                    return str(task.assignee_id) if task.assignee_id else None
                except Task.DoesNotExist:
                    return None
            
            recipient_id = await get_task_assignee()
            if not recipient_id:
                raise ValidationError("No recipient specified and task has no assignee")
        
        # Erstelle Notification (vereinfacht - nutze bestehendes Notification-System)
        @sync_to_async
        def create_notification():
            from app.db.models import Notification
            
            Notification.objects.create(
                tenant_id=self.tenant_id,
                user_id=recipient_id,
                title="Automation Notification",
                message=message,
                type="task_update",
                related_type="task",
                related_id=task_id,
            )
        
        await create_notification()
        
        return {"sent_to": recipient_id, "message": message}
    
    async def _update_field(self, task_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Aktualisiert Task-Feld"""
        field = params.get("field")
        value = params.get("value")
        
        if not field:
            raise ValidationError("field required for update_field action")
        
        # Erlaubte Felder
        allowed_fields = ["priority", "status", "tags", "progress"]
        if field not in allowed_fields:
            raise ValidationError(f"Field {field} not allowed for automation updates")
        
        # Update Task
        from app.schemas.tasks import UpdateTaskRequest
        update_data = {field: value}
        update_request = UpdateTaskRequest(**update_data)
        
        # System-User für Automation-Updates
        @sync_to_async
        def get_system_user():
            # Versuche Admin-User zu finden, sonst ersten User
            try:
                from app.db.models import User
                return User.objects.filter(tenantuser__tenant_id=self.tenant_id).first()
            except Exception:
                return None
        
        system_user = await get_system_user()
        if not system_user:
            raise ValidationError("No system user found for automation")
        
        task = await self.tasks_service.update_task(task_id, update_request, str(system_user.id))
        
        return {"field": field, "value": value, "task_id": task_id}
    
    async def _add_comment(self, task_id: str, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Fügt Comment zu Task hinzu"""
        text = params.get("text", "Automation comment")
        
        @sync_to_async
        def create_comment():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                raise ValidationError(f"Task {task_id} not found")
            
            # System-User für Automation-Comments
            try:
                from app.db.models import User
                system_user = User.objects.filter(tenantuser__tenant_id=self.tenant_id).first()
                if not system_user:
                    raise ValidationError("No system user found")
            except Exception:
                raise ValidationError("No system user found")
            
            comment = TaskComment.objects.create(
                task=task,
                author=system_user,
                text=text,
            )
            
            return {"comment_id": str(comment.id), "text": text}
        
        return await create_comment()
    
    async def _create_subtask(self, task_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Erstellt Subtask"""
        title = params.get("title", "New subtask")
        
        @sync_to_async
        def create_subtask():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                raise ValidationError(f"Task {task_id} not found")
            
            from app.db.models import TaskSubtask
            
            # Hole nächste Order
            max_order = task.subtasks.aggregate(models.Max("order"))["order__max"] or 0
            
            subtask = TaskSubtask.objects.create(
                task=task,
                title=title,
                completed=False,
                order=max_order + 1,
            )
            
            return {"subtask_id": str(subtask.id), "title": title}
        
        return await create_subtask()

