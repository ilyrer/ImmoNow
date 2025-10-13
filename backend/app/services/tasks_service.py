"""
Tasks Service
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from django.db import models
from django.db.models import Q, Count, Sum, Avg
from asgiref.sync import sync_to_async

from app.db.models import Task, TaskLabel, TaskComment, UserProfile, User
from app.schemas.tasks import (
    TaskResponse, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest,
    EmployeeResponse, TaskStatisticsResponse, TaskAssignee, TaskLabel as TaskLabelSchema,
    TaskComment as TaskCommentSchema, ActivityLogEntry
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService


class TasksService:
    """Tasks service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_tasks(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee_id: Optional[str] = None,
        property_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Tuple[List[TaskResponse], int]:
        """Get tasks with filters and pagination"""
        
        @sync_to_async
        def get_tasks_sync():
            queryset = Task.objects.filter(tenant_id=self.tenant_id, archived=False)
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(description__icontains=search) |
                    Q(tags__icontains=search)
                )
            
            if status:
                queryset = queryset.filter(status=status)
            
            if priority:
                queryset = queryset.filter(priority=priority)
            
            if assignee_id:
                queryset = queryset.filter(assignee_id=assignee_id)
            
            if property_id:
                queryset = queryset.filter(property_id=property_id)
            
            if tags:
                for tag in tags:
                    queryset = queryset.filter(tags__icontains=tag)
            
            # Apply sorting
            if sort_by:
                if sort_order == "desc":
                    sort_by_field = f"-{sort_by}"
                else:
                    sort_by_field = sort_by
                queryset = queryset.order_by(sort_by_field)
            else:
                queryset = queryset.order_by("-created_at")
            
            total = queryset.count()
            tasks = list(queryset[offset:offset + limit])
            return tasks, total
        
        tasks, total = await get_tasks_sync()
        return [await self._build_task_response(task) for task in tasks], total
    
    async def get_task(self, task_id: str) -> Optional[TaskResponse]:
        """Get a specific task"""
        
        @sync_to_async
        def get_task_sync():
            try:
                return Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                return None
        
        task = await get_task_sync()
        if task:
            return await self._build_task_response(task)
        return None
    
    async def create_task(
        self, 
        task_data: CreateTaskRequest, 
        created_by_id: str
    ) -> TaskResponse:
        """Create a new task"""
        
        @sync_to_async
        def create_task_sync():
            user = User.objects.get(id=created_by_id)
            
            task = Task.objects.create(
                tenant_id=self.tenant_id,
                title=task_data.title,
                description=task_data.description,
                priority=task_data.priority,
                assignee_id=task_data.assignee_id,
                due_date=task_data.due_date,
                start_date=task_data.start_date,
                estimated_hours=task_data.estimated_hours,
                tags=task_data.tags,
                property_id=task_data.property_id,
                created_by=user
            )
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="create",
                resource_type="task",
                resource_id=str(task.id),
                new_values={"title": task.title, "priority": task.priority}
            )
            
            return task
        
        task = await create_task_sync()
        return await self._build_task_response(task)
    
    async def update_task(
        self, 
        task_id: str, 
        task_data: UpdateTaskRequest, 
        updated_by_id: str
    ) -> Optional[TaskResponse]:
        """Update a task"""
        
        @sync_to_async
        def update_task_sync():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                return None
            
            user = User.objects.get(id=updated_by_id)
            
            # Store old values for audit
            old_values = {
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "assignee_id": str(task.assignee_id)
            }
            
            # Update fields
            update_data = task_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(task, field, value)
            
            task.save()
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="update",
                resource_type="task",
                resource_id=task_id,
                old_values=old_values,
                new_values=update_data
            )
            
            return task
        
        task = await update_task_sync()
        if task:
            return await self._build_task_response(task)
        return None
    
    async def move_task(
        self, 
        task_id: str, 
        move_data: MoveTaskRequest, 
        moved_by_id: str
    ) -> Optional[TaskResponse]:
        """Move a task to different column/status"""
        
        @sync_to_async
        def move_task_sync():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                return None
            
            user = User.objects.get(id=moved_by_id)
            
            # Store old values for audit
            old_values = {
                "status": task.status,
                "position": getattr(task, 'position', None)
            }
            
            # Update status if provided
            if move_data.new_status:
                task.status = move_data.new_status
            
            task.save()
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="move",
                resource_type="task",
                resource_id=task_id,
                old_values=old_values,
                new_values={"status": task.status}
            )
            
            return task
        
        task = await move_task_sync()
        if task:
            return await self._build_task_response(task)
        return None
    
    async def delete_task(self, task_id: str, deleted_by_id: str) -> None:
        """Delete a task"""
        
        @sync_to_async
        def delete_task_sync():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                raise NotFoundError("Task not found")
            
            user = User.objects.get(id=deleted_by_id)
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="delete",
                resource_type="task",
                resource_id=task_id,
                old_values={"title": task.title, "status": task.status}
            )
            
            task.delete()
        
        await delete_task_sync()
    
    async def get_statistics(self) -> TaskStatisticsResponse:
        """Get task statistics"""
        
        @sync_to_async
        def get_statistics_sync():
            queryset = Task.objects.filter(tenant_id=self.tenant_id, archived=False)
            
            total_tasks = queryset.count()
            active_tasks = queryset.exclude(status='done').count()
            completed_tasks = queryset.filter(status='done').count()
            blocked_tasks = queryset.filter(status='blocked').count()
            
            # Overdue tasks
            now = datetime.utcnow()
            overdue_tasks = queryset.filter(
                due_date__lt=now,
                status__in=['todo', 'in_progress', 'review']
            ).count()
            
            # Hours
            total_estimated_hours = queryset.aggregate(total=Sum('estimated_hours'))['total'] or 0
            total_actual_hours = queryset.aggregate(total=Sum('actual_hours'))['total'] or 0
            
            # Completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Tasks by priority
            tasks_by_priority = {}
            for priority, _ in Task.PRIORITY_CHOICES:
                count = queryset.filter(priority=priority).count()
                tasks_by_priority[priority] = count
            
            # Tasks by status
            tasks_by_status = {}
            for status, _ in Task.STATUS_CHOICES:
                count = queryset.filter(status=status).count()
                tasks_by_status[status] = count
            
            # Tasks by assignee
            tasks_by_assignee = {}
            assignee_counts = queryset.values('assignee__first_name', 'assignee__last_name').annotate(
                count=Count('id')
            )
            for item in assignee_counts:
                name = f"{item['assignee__first_name']} {item['assignee__last_name']}"
                tasks_by_assignee[name] = item['count']
            
            # Upcoming deadlines
            upcoming_deadlines = list(queryset.filter(
                due_date__gte=now,
                status__in=['todo', 'in_progress', 'review']
            ).order_by('due_date')[:5])
            
            return {
                'total_tasks': total_tasks,
                'active_tasks': active_tasks,
                'completed_tasks': completed_tasks,
                'blocked_tasks': blocked_tasks,
                'overdue_tasks': overdue_tasks,
                'total_estimated_hours': total_estimated_hours,
                'total_actual_hours': total_actual_hours,
                'completion_rate': completion_rate,
                'tasks_by_priority': tasks_by_priority,
                'tasks_by_status': tasks_by_status,
                'tasks_by_assignee': tasks_by_assignee,
                'upcoming_deadlines': upcoming_deadlines
            }
        
        stats = await get_statistics_sync()
        upcoming_tasks = [await self._build_task_response(task) for task in stats['upcoming_deadlines']]
        
        return TaskStatisticsResponse(
            total_tasks=stats['total_tasks'],
            active_tasks=stats['active_tasks'],
            completed_tasks=stats['completed_tasks'],
            blocked_tasks=stats['blocked_tasks'],
            overdue_tasks=stats['overdue_tasks'],
            total_estimated_hours=stats['total_estimated_hours'],
            total_actual_hours=stats['total_actual_hours'],
            completion_rate=stats['completion_rate'],
            tasks_by_priority=stats['tasks_by_priority'],
            tasks_by_status=stats['tasks_by_status'],
            tasks_by_assignee=stats['tasks_by_assignee'],
            upcoming_deadlines=upcoming_tasks,
            recent_activity=[]  # TODO: Implement recent activity
        )
    
    async def _build_task_response(self, task: Task) -> TaskResponse:
        """Build TaskResponse from Task model"""
        
        @sync_to_async
        def build_response_sync():
            # Get assignee info
            assignee = TaskAssignee(
                id=str(task.assignee.id),
                name=f"{task.assignee.first_name} {task.assignee.last_name}",
                avatar=getattr(task.assignee.profile, 'avatar', '') or '',
                role=task.assignee.profile.role if hasattr(task.assignee, 'profile') else '',
                email=task.assignee.email
            )
            
            # Get created by info
            created_by = TaskAssignee(
                id=str(task.created_by.id),
                name=f"{task.created_by.first_name} {task.created_by.last_name}",
                avatar=getattr(task.created_by.profile, 'avatar', '') or '',
                role=task.created_by.profile.role if hasattr(task.created_by, 'profile') else '',
                email=task.created_by.email
            )
            
            return TaskResponse(
                id=str(task.id),
                title=task.title,
                description=task.description or '',
                priority=task.priority,
                status=task.status,
                assignee=assignee,
                due_date=task.due_date,
                start_date=task.start_date,
                progress=task.progress,
                estimated_hours=task.estimated_hours,
                actual_hours=task.actual_hours,
                tags=task.tags or [],
                labels=[],  # TODO: Implement labels
                subtasks=[],  # TODO: Implement subtasks
                comments=[],  # TODO: Implement comments
                attachments=[],  # TODO: Implement attachments
                property=None,  # TODO: Implement property info
                financing_status=None,  # TODO: Implement financing status
                activity_log=[],  # TODO: Implement activity log
                created_at=task.created_at,
                updated_at=task.updated_at,
                created_by=created_by,
                archived=task.archived,
                blocked=None  # TODO: Implement blocked info
            )
        
        return await build_response_sync()
