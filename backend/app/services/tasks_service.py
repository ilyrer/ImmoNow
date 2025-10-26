"""
Tasks Service
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from django.db import models
from django.db.models import Q, Count, Sum, Avg
from asgiref.sync import sync_to_async

from app.db.models import Task, TaskLabel, TaskComment, UserProfile, User, TaskSubtask, TaskAttachment, TaskWatcher, Sprint, Tenant
from app.schemas.tasks import (
    TaskResponse, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest,
    EmployeeResponse, TaskStatisticsResponse, TaskAssignee, TaskLabel as TaskLabelSchema,
    TaskComment as TaskCommentSchema, ActivityLogEntry, CreateTaskCommentRequest,
    UpdateTaskCommentRequest, BulkUpdateTasksRequest, BulkMoveTasksRequest,
    # New Kanban schemas
    CreateSubtaskRequest, UpdateSubtaskRequest, CreateLabelRequest, UpdateLabelRequest,
    UploadAttachmentRequest, CreateSprintRequest, UpdateSprintRequest, SprintResponse,
    TaskDocument, Subtask
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService


class TasksService:
    """Tasks service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    def _get_tenant(self):
        """Get tenant instance"""
        from app.db.models import Tenant
        return Tenant.objects.get(id=self.tenant_id)
    
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
            tenant = self._get_tenant()
            queryset = Task.objects.filter(tenant=tenant, archived=False)
            
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
                tenant = self._get_tenant()
                return Task.objects.get(id=task_id, tenant=tenant)
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
            try:
                print(f"DEBUG: Creating task with data: {task_data.model_dump(mode='json')}")
                print(f"DEBUG: assignee_id: {task_data.assignee_id}")
                print(f"DEBUG: created_by_id: {created_by_id}")
                
                tenant = self._get_tenant()
                user = User.objects.get(id=created_by_id)
                
                # Validate all UUID fields
                if task_data.assignee_id and task_data.assignee_id.strip():
                    try:
                        import uuid
                        uuid.UUID(task_data.assignee_id)
                        print(f"DEBUG: assignee_id is valid UUID: {task_data.assignee_id}")
                    except ValueError:
                        print(f"ERROR: assignee_id is not a valid UUID: {task_data.assignee_id}")
                        task_data.assignee_id = None
                
                if task_data.property_id and task_data.property_id.strip():
                    try:
                        import uuid
                        uuid.UUID(task_data.property_id)
                        print(f"DEBUG: property_id is valid UUID: {task_data.property_id}")
                    except ValueError:
                        print(f"ERROR: property_id is not a valid UUID: {task_data.property_id}")
                        task_data.property_id = None
                
                if task_data.sprint_id and task_data.sprint_id.strip():
                    try:
                        import uuid
                        uuid.UUID(task_data.sprint_id)
                        print(f"DEBUG: sprint_id is valid UUID: {task_data.sprint_id}")
                    except ValueError:
                        print(f"ERROR: sprint_id is not a valid UUID: {task_data.sprint_id}")
                        task_data.sprint_id = None
                
                print(f"DEBUG: task_data.status: {task_data.status}")
                print(f"DEBUG: task_data.status type: {type(task_data.status)}")
                
                task = Task.objects.create(
                    tenant=tenant,
                    title=task_data.title,
                    description=task_data.description,
                    priority=task_data.priority,
                    status=task_data.status,
                    assignee_id=task_data.assignee_id if task_data.assignee_id else None,
                    due_date=task_data.due_date,
                    start_date=task_data.start_date,
                    estimated_hours=task_data.estimated_hours,
                    tags=task_data.tags,
                    property_id=task_data.property_id,
                    created_by=user
                )
                
                # Audit log
                audit_service = AuditService(self.tenant_id)
                audit_service.audit_action(
                    user_id=str(user.id),
                    action="create",
                    resource_type="task",
                    resource_id=str(task.id),
                    description=f"Task created: {task.title}"
                )
                
                print(f"DEBUG: Task created successfully with ID: {task.id}")
                return task
            except Exception as e:
                print(f"ERROR in create_task_sync: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                raise e
        
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
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            except Task.DoesNotExist:
                return None
            
            user = User.objects.get(id=updated_by_id)
            
            # Store old values for audit and activity log
            old_values = {
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "assignee_id": str(task.assignee_id) if task.assignee_id else None,
                "due_date": task.due_date.isoformat() if task.due_date else None
            }
            
            # Track changes for activity description
            changes = []
            
            # Update fields - handle special cases
            update_data = task_data.model_dump(exclude_unset=True)
            
            # Check what changed
            for field, new_value in update_data.items():
                if field == 'label_ids' or field == 'watcher_ids':
                    continue
                old_value = getattr(task, field, None)
                if old_value != new_value:
                    if field == 'status':
                        changes.append(f"Status changed from '{old_value}' to '{new_value}'")
                    elif field == 'priority':
                        changes.append(f"Priority changed from '{old_value}' to '{new_value}'")
                    elif field == 'assignee_id':
                        old_name = task.assignee.get_full_name() if task.assignee else "Unassigned"
                        try:
                            new_assignee = User.objects.get(id=new_value) if new_value else None
                            new_name = new_assignee.get_full_name() if new_assignee else "Unassigned"
                            changes.append(f"Assignee changed from '{old_name}' to '{new_name}'")
                        except User.DoesNotExist:
                            pass
                    elif field == 'title':
                        changes.append(f"Title changed")
                    elif field == 'description':
                        changes.append(f"Description updated")
                    elif field == 'due_date':
                        changes.append(f"Due date changed")
            
            # Update task fields
            for field, value in update_data.items():
                if field == 'label_ids':
                    # Handle label_ids separately for many-to-many
                    if value is not None:
                        labels = TaskLabel.objects.filter(id__in=value, tenant=self._get_tenant())
                        task.labels.set(labels)
                elif field == 'watcher_ids':
                    # Handle watchers separately
                    if value is not None:
                        # Clear existing watchers
                        TaskWatcher.objects.filter(task=task).delete()
                        # Add new watchers
                        for user_id in value:
                            try:
                                watcher_user = User.objects.get(id=user_id)
                                TaskWatcher.objects.create(task=task, user=watcher_user)
                            except User.DoesNotExist:
                                pass
                else:
                    setattr(task, field, value)
            
            task.save()
            
            # Create detailed audit log with changes
            audit_service = AuditService(self.tenant_id)
            description = " • ".join(changes) if changes else f"Task updated: {task.title}"
            
            # Store new values
            new_values = {
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "assignee_id": str(task.assignee_id) if task.assignee_id else None,
                "due_date": task.due_date.isoformat() if task.due_date else None
            }
            
            audit_service.audit_action(
                user_id=str(user.id),
                action="update",
                resource_type="task",
                resource_id=task_id,
                description=description
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
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
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
            audit_service = AuditService(self.tenant_id)
            audit_service.audit_action(
                user_id=str(user.id),
                action="move",
                resource_type="task",
                resource_id=task_id,
                description=f"Task moved to {task.status}"
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
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            except Task.DoesNotExist:
                raise NotFoundError("Task not found")
            
            user = User.objects.get(id=deleted_by_id)
            
            # Audit log
            audit_service = AuditService(self.tenant_id)
            audit_service.audit_action(
                user_id=str(user.id),
                action="delete",
                resource_type="task",
                resource_id=task_id,
                description=f"Task deleted: {task.title}"
            )
            
            task.delete()
        
        await delete_task_sync()
    
    async def get_statistics(self) -> TaskStatisticsResponse:
        """Get task statistics"""
        
        @sync_to_async
        def get_statistics_sync():
            queryset = Task.objects.filter(tenant=self._get_tenant(), archived=False)
            
            total_tasks = queryset.count()
            active_tasks = queryset.exclude(status='done').count()
            completed_tasks = queryset.filter(status='done').count()
            blocked_tasks = queryset.filter(status='blocked').count()
            
            # Overdue tasks
            now = datetime.utcnow()
            overdue_tasks = queryset.filter(
                due_date__lt=now,
                status__in=['backlog', 'in_progress', 'review']
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
                status__in=['backlog', 'in_progress', 'review']
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
            # Get assignee info (handle None assignee and missing profile)
            assignee = None
            if task.assignee:
                assignee_avatar = ''
                assignee_role = ''
                try:
                    if hasattr(task.assignee, 'profile') and task.assignee.profile:
                        assignee_avatar = getattr(task.assignee.profile, 'avatar', '') or ''
                        assignee_role = getattr(task.assignee.profile, 'role', '') or ''
                except:
                    # Profile doesn't exist, use defaults
                    pass
                
                assignee = TaskAssignee(
                    id=str(task.assignee.id),
                    name=f"{task.assignee.first_name} {task.assignee.last_name}",
                    avatar=assignee_avatar,
                    role=assignee_role,
                    email=task.assignee.email
                )
            
            # Get created by info (handle missing profile)
            created_by_avatar = ''
            created_by_role = ''
            try:
                if hasattr(task.created_by, 'profile') and task.created_by.profile:
                    created_by_avatar = getattr(task.created_by.profile, 'avatar', '') or ''
                    created_by_role = getattr(task.created_by.profile, 'role', '') or ''
            except:
                # Profile doesn't exist, use defaults
                pass
            
            created_by = TaskAssignee(
                id=str(task.created_by.id),
                name=f"{task.created_by.first_name} {task.created_by.last_name}",
                avatar=created_by_avatar,
                role=created_by_role,
                email=task.created_by.email
            )
            
            # Get labels - MUST be inside sync_to_async
            labels = []
            for label in task.labels.all():
                labels.append(TaskLabelSchema(
                    id=str(label.id),
                    name=label.name,
                    color=label.color,
                    description=label.description
                ))
            
            # Get subtasks - MUST be inside sync_to_async  
            subtasks = []
            for subtask in TaskSubtask.objects.filter(task=task).order_by('order'):
                subtasks.append(Subtask(
                    id=str(subtask.id),
                    title=subtask.title,
                    completed=subtask.completed,
                    order=subtask.order
                ))
            
            # Get attachments - MUST be inside sync_to_async
            attachments = []
            for attachment in TaskAttachment.objects.filter(task=task):
                # Get uploader info
                uploader = attachment.uploaded_by
                uploader_name = f"{uploader.first_name} {uploader.last_name}" if uploader else "Unknown"
                uploader_avatar = getattr(uploader.profile, 'avatar', '') if hasattr(uploader, 'profile') and uploader.profile else ''
                
                attachments.append(TaskDocument(
                    id=str(attachment.id),
                    name=attachment.name,
                    file_url=attachment.file_url,
                    file_size=attachment.file_size,
                    mime_type=attachment.mime_type,
                    uploaded_by=TaskAssignee(
                        id=str(uploader.id),
                        name=uploader_name,
                        avatar=uploader_avatar,
                        role=getattr(uploader.profile, 'role', '') if hasattr(uploader, 'profile') and uploader.profile else '',
                        email=uploader.email
                    ),
                    uploaded_at=attachment.uploaded_at
                ))
            
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
                labels=labels,
                subtasks=subtasks,
                comments=[],  # Loaded separately via API
                attachments=attachments,
                property=None,  # TODO: Implement property info
                financing_status=None,  # TODO: Implement financing status
                activity_log=[],  # Loaded separately via API
                created_at=task.created_at,
                updated_at=task.updated_at,
                created_by=created_by,
                archived=task.archived,
                blocked=None  # TODO: Implement blocked info
            )
        
        return await build_response_sync()
    
    # ============================================================================
    # TASK COMMENTS METHODS
    # ============================================================================
    
    async def add_task_comment(
        self, 
        task_id: str, 
        comment_data: CreateTaskCommentRequest, 
        user_id: str
    ) -> Optional[TaskCommentSchema]:
        """Add a comment to a task"""
        
        @sync_to_async
        def add_comment_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            except Task.DoesNotExist:
                return None
            
            user = User.objects.get(id=user_id)
            
            comment = TaskComment.objects.create(
                task=task,
                author=user,
                text=comment_data.text,
                parent_id=comment_data.parent_id
            )
            
            # Audit log
            audit_service = AuditService(self.tenant_id)
            audit_service.audit_action(
                user_id=str(user.id),
                action="comment_added",
                resource_type="task",
                resource_id=task_id,
                description=f"Comment added to task"
            )
            
            return comment
        
        comment = await add_comment_sync()
        if comment:
            return await self._build_comment_response(comment)
        return None
    
    async def get_task_comments(self, task_id: str) -> Optional[List[TaskCommentSchema]]:
        """Get all comments for a task"""
        
        @sync_to_async
        def get_comments_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            except Task.DoesNotExist:
                return None
            
            comments = TaskComment.objects.filter(task=task).select_related('author').order_by('timestamp')
            return list(comments)
        
        comments = await get_comments_sync()
        if comments is not None:
            return [await self._build_comment_response(comment) for comment in comments]
        return None
    
    async def update_task_comment(
        self, 
        task_id: str, 
        comment_id: str, 
        comment_data: UpdateTaskCommentRequest, 
        user_id: str
    ) -> Optional[TaskCommentSchema]:
        """Update a task comment"""
        
        @sync_to_async
        def update_comment_sync():
            try:
                comment = TaskComment.objects.get(
                    id=comment_id,
                    task_id=task_id,
                    author_id=user_id
                )
            except TaskComment.DoesNotExist:
                return None
            
            comment.text = comment_data.text
            comment.is_edited = True
            comment.save()
            
            return comment
        
        comment = await update_comment_sync()
        if comment:
            return await self._build_comment_response(comment)
        return None
    
    async def delete_task_comment(self, task_id: str, comment_id: str, user_id: str) -> bool:
        """Delete a task comment"""
        
        @sync_to_async
        def delete_comment_sync():
            try:
                comment = TaskComment.objects.get(
                    id=comment_id,
                    task_id=task_id,
                    author_id=user_id
                )
                comment.delete()
                return True
            except TaskComment.DoesNotExist:
                return False
        
        return await delete_comment_sync()
    
    # ============================================================================
    # TASK ACTIVITY LOG METHODS
    # ============================================================================
    
    async def get_task_activity(self, task_id: str) -> Optional[List[ActivityLogEntry]]:
        """Get activity log for a task"""
        
        @sync_to_async
        def get_activity_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            except Task.DoesNotExist:
                return None
            
            # Get audit logs for this task
            from app.db.models import AuditLog
            audit_logs = AuditLog.objects.filter(
                resource_type='task',
                resource_id=task_id
            ).select_related('user').order_by('-timestamp')[:50]
            
            activity_entries = []
            for log in audit_logs:
                activity_entries.append(ActivityLogEntry(
                    id=str(log.id),
                    action=log.action,
                    description=self._format_activity_description(log),
                    user=TaskAssignee(
                        id=str(log.user.id),
                        name=f"{log.user.first_name} {log.user.last_name}",
                        avatar=getattr(log.user.profile, 'avatar', '') or '',
                        role=log.user.profile.role if hasattr(log.user, 'profile') else '',
                        email=log.user.email
                    ),
                    timestamp=log.timestamp,
                    old_values=log.old_values,
                    new_values=log.new_values
                ))
            
            return activity_entries
        
        return await get_activity_sync()
    
    def _format_activity_description(self, log) -> str:
        """Format activity description based on action"""
        if log.action == 'create':
            return f"Task created"
        elif log.action == 'update':
            return f"Task updated"
        elif log.action == 'move':
            return f"Task moved to {log.new_values.get('status', 'unknown')}"
        elif log.action == 'comment_added':
            return f"Comment added"
        elif log.action == 'delete':
            return f"Task deleted"
        else:
            return f"Task {log.action}"
    
    # ============================================================================
    # BULK OPERATIONS METHODS
    # ============================================================================
    
    async def bulk_update_tasks(
        self, 
        bulk_data: BulkUpdateTasksRequest, 
        user_id: str
    ) -> List[TaskResponse]:
        """Bulk update multiple tasks"""
        
        @sync_to_async
        def bulk_update_sync():
            user = User.objects.get(id=user_id)
            updated_tasks = []
            
            for task_id in bulk_data.task_ids:
                try:
                    task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                    
                    # Store old values for audit
                    old_values = {
                        "title": task.title,
                        "status": task.status,
                        "priority": task.priority,
                        "assignee_id": str(task.assignee_id)
                    }
                    
                    # Update fields
                    for field, value in bulk_data.updates.items():
                        if hasattr(task, field):
                            setattr(task, field, value)
                    
                    task.save()
                    
                    # Audit log
                    audit_service = AuditService(self.tenant_id)
                    audit_service.audit_action(
                        user_id=str(user.id),
                        action="bulk_update",
                        resource_type="task",
                        resource_id=task_id,
                        description=f"Task bulk updated"
                    )
                    
                    updated_tasks.append(task)
                    
                except Task.DoesNotExist:
                    continue
            
            return updated_tasks
        
        tasks = await bulk_update_sync()
        return [await self._build_task_response(task) for task in tasks]
    
    async def bulk_delete_tasks(self, task_ids: List[str], user_id: str) -> None:
        """Bulk delete multiple tasks"""
        
        @sync_to_async
        def bulk_delete_sync():
            user = User.objects.get(id=user_id)
            
            for task_id in task_ids:
                try:
                    task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                    
                    # Audit log
                    audit_service = AuditService(self.tenant_id)
                    audit_service.audit_action(
                        user_id=str(user.id),
                        action="bulk_delete",
                        resource_type="task",
                        resource_id=task_id,
                        description=f"Task bulk deleted: {task.title}"
                    )
                    
                    task.delete()
                    
                except Task.DoesNotExist:
                    continue
        
        await bulk_delete_sync()
    
    async def bulk_move_tasks(
        self, 
        bulk_move_data: BulkMoveTasksRequest, 
        user_id: str
    ) -> List[TaskResponse]:
        """Bulk move multiple tasks to different status"""
        
        @sync_to_async
        def bulk_move_sync():
            user = User.objects.get(id=user_id)
            moved_tasks = []
            
            for task_id in bulk_move_data.task_ids:
                try:
                    task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                    
                    # Store old values for audit
                    old_values = {
                        "status": task.status,
                        "position": getattr(task, 'position', None)
                    }
                    
                    # Update status
                    task.status = bulk_move_data.new_status
                    task.save()
                    
                    # Audit log
                    audit_service = AuditService(self.tenant_id)
                    audit_service.audit_action(
                        user_id=str(user.id),
                        action="bulk_move",
                        resource_type="task",
                        resource_id=task_id,
                        description=f"Task moved to {bulk_move_data.new_status}"
                    )
                    
                    moved_tasks.append(task)
                    
                except Task.DoesNotExist:
                    continue
            
            return moved_tasks
        
        tasks = await bulk_move_sync()
        return [await self._build_task_response(task) for task in tasks]
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _build_comment_response(self, comment: TaskComment) -> TaskCommentSchema:
        """Build TaskCommentSchema from TaskComment model"""
        
        @sync_to_async
        def build_comment_sync():
            author = TaskAssignee(
                id=str(comment.author.id),
                name=f"{comment.author.first_name} {comment.author.last_name}",
                avatar=getattr(comment.author.profile, 'avatar', '') or '',
                role=comment.author.profile.role if hasattr(comment.author, 'profile') else '',
                email=comment.author.email
            )
            
            return TaskCommentSchema(
                id=str(comment.id),
                author=author,
                text=comment.text,
                timestamp=comment.timestamp,
                parent_id=str(comment.parent_id) if comment.parent_id else None,
                is_edited=comment.is_edited
            )
        
        return await build_comment_sync()
    
    # New Kanban service methods
    
    async def create_label(self, label_data: CreateLabelRequest) -> TaskLabelSchema:
        """Create a new task label"""
        @sync_to_async
        def create_sync():
            # Get the tenant instance
            from app.db.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            
            label = TaskLabel.objects.create(
                tenant=tenant,
                name=label_data.name,
                color=label_data.color,
                description=label_data.description
            )
            return TaskLabelSchema(
                id=str(label.id),
                name=label.name,
                color=label.color,
                description=label.description
            )
        return await create_sync()
    
    async def get_labels(self) -> List[TaskLabelSchema]:
        """Get all task labels"""
        print(f"DEBUG: TasksService.get_labels called with tenant_id={self.tenant_id}")
        
        @sync_to_async
        def get_sync():
            try:
                print(f"DEBUG: Inside get_labels get_sync, tenant_id={self.tenant_id}")
                print(f"DEBUG: About to create queryset with tenant={self.tenant_id}")
                
                # Check if tenant_id is valid UUID
                import uuid
                try:
                    uuid.UUID(self.tenant_id)
                    print(f"DEBUG: tenant_id is valid UUID")
                except ValueError as e:
                    print(f"ERROR: tenant_id is not a valid UUID: {self.tenant_id}")
                    raise ValueError(f"tenant_id must be a valid UUID, got: {self.tenant_id}")
                
                # Get the tenant instance
                from app.db.models import Tenant
                tenant = Tenant.objects.get(id=self.tenant_id)
                
                labels = TaskLabel.objects.filter(tenant=tenant)
                print(f"DEBUG: Labels queryset created successfully: {labels}")
                
                result = [
                    TaskLabelSchema(
                        id=str(label.id),
                        name=label.name,
                        color=label.color,
                        description=label.description
                    )
                    for label in labels
                ]
                print(f"DEBUG: Found {len(result)} labels")
                return result
            except Exception as e:
                print(f"ERROR in get_labels get_sync: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                raise e
        return await get_sync()
    
    async def update_label(self, label_id: str, label_data: UpdateLabelRequest) -> TaskLabelSchema:
        """Update a task label"""
        @sync_to_async
        def update_sync():
            # Get the tenant instance
            from app.db.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            
            label = TaskLabel.objects.get(id=label_id, tenant=tenant)
            if label_data.name is not None:
                label.name = label_data.name
            if label_data.color is not None:
                label.color = label_data.color
            if label_data.description is not None:
                label.description = label_data.description
            label.save()
            
            return TaskLabelSchema(
                id=str(label.id),
                name=label.name,
                color=label.color,
                description=label.description
            )
        return await update_sync()
    
    async def delete_label(self, label_id: str):
        """Delete a task label"""
        @sync_to_async
        def delete_sync():
            tenant = self._get_tenant()
            
            TaskLabel.objects.filter(id=label_id, tenant=tenant).delete()
        await delete_sync()
    
    async def create_subtask(self, task_id: str, subtask_data: CreateSubtaskRequest) -> TaskSubtask:
        """Create a subtask"""
        @sync_to_async
        def create_sync():
            task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            max_order = task.subtasks.aggregate(models.Max('order'))['order__max'] or 0
            return TaskSubtask.objects.create(
                task=task,
                title=subtask_data.title,
                assignee_id=subtask_data.assignee_id,
                order=max_order + 1
            )
        return await create_sync()
    
    async def update_subtask(self, subtask_id: str, subtask_data: UpdateSubtaskRequest) -> TaskSubtask:
        """Update a subtask"""
        @sync_to_async
        def update_sync():
            subtask = TaskSubtask.objects.get(id=subtask_id, task__tenant=self._get_tenant())
            if subtask_data.title is not None:
                subtask.title = subtask_data.title
            if subtask_data.completed is not None:
                subtask.completed = subtask_data.completed
            if subtask_data.assignee_id is not None:
                subtask.assignee_id = subtask_data.assignee_id
            subtask.save()
            return subtask
        return await update_sync()
    
    async def delete_subtask(self, subtask_id: str):
        """Delete a subtask"""
        @sync_to_async
        def delete_sync():
            TaskSubtask.objects.filter(id=subtask_id, task__tenant=self._get_tenant()).delete()
        await delete_sync()
    
    async def add_attachment(self, task_id: str, attachment_data: UploadAttachmentRequest, user_id: str) -> TaskAttachment:
        """Add an attachment to a task"""
        @sync_to_async
        def create_sync():
            task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            attachment = TaskAttachment.objects.create(
                task=task,
                name=attachment_data.name,
                file_url=attachment_data.file_url,
                file_size=attachment_data.file_size,
                mime_type=attachment_data.mime_type,
                uploaded_by_id=user_id
            )
            # Convert to schema with string IDs
            from app.schemas.tasks import TaskAttachment as TaskAttachmentSchema
            return TaskAttachmentSchema(
                id=str(attachment.id),
                name=attachment.name,
                file_url=attachment.file_url,
                file_size=attachment.file_size,
                mime_type=attachment.mime_type,
                uploaded_by_id=str(attachment.uploaded_by_id),
                uploaded_at=attachment.uploaded_at
            )
        return await create_sync()
    
    async def delete_attachment(self, attachment_id: str):
        """Delete an attachment"""
        @sync_to_async
        def delete_sync():
            TaskAttachment.objects.filter(id=attachment_id, task__tenant=self._get_tenant()).delete()
        await delete_sync()
    
    async def add_watcher(self, task_id: str, user_id: str):
        """Add a watcher to a task"""
        @sync_to_async
        def create_sync():
            task = Task.objects.get(id=task_id, tenant=self._get_tenant())
            TaskWatcher.objects.get_or_create(task=task, user_id=user_id)
        await create_sync()
    
    async def remove_watcher(self, task_id: str, user_id: str):
        """Remove a watcher from a task"""
        @sync_to_async
        def delete_sync():
            TaskWatcher.objects.filter(task_id=task_id, user_id=user_id, task__tenant=self._get_tenant()).delete()
        await delete_sync()
    
    async def create_sprint(self, sprint_data: CreateSprintRequest) -> SprintResponse:
        """Create a new sprint"""
        @sync_to_async
        def create_sync():
            tenant = self._get_tenant()
            
            sprint = Sprint.objects.create(
                tenant=tenant,
                name=sprint_data.name,
                goal=sprint_data.goal,
                start_date=sprint_data.start_date,
                end_date=sprint_data.end_date
            )
            return SprintResponse(
                id=str(sprint.id),
                name=sprint.name,
                goal=sprint.goal,
                start_date=sprint.start_date,
                end_date=sprint.end_date,
                status=sprint.status,
                created_at=sprint.created_at
            )
        return await create_sync()
    
    async def get_sprints(self, status: Optional[str] = None) -> List[SprintResponse]:
        """Get all sprints"""
        print(f"DEBUG: TasksService.get_sprints called with tenant_id={self.tenant_id}, status={status}")
        
        @sync_to_async
        def get_sync():
            try:
                tenant = self._get_tenant()
                print(f"DEBUG: Tenant instance loaded: {tenant}")
                
                labels = Sprint.objects.filter(tenant=tenant)
                print(f"DEBUG: Sprints queryset created successfully: {labels}")
                
                result = [
                    SprintResponse(
                        id=str(sprint.id),
                        name=sprint.name,
                        goal=sprint.goal,
                        start_date=sprint.start_date,
                        end_date=sprint.end_date,
                        status=sprint.status,
                        created_at=sprint.created_at
                    )
                    for sprint in labels
                ]
                print(f"DEBUG: Found {len(result)} sprints")
                return result
            except Exception as e:
                print(f"ERROR in get_sync: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                raise e
        return await get_sync()
    
    async def update_sprint(self, sprint_id: str, sprint_data: UpdateSprintRequest) -> SprintResponse:
        """Update a sprint"""
        @sync_to_async
        def update_sync():
            tenant = self._get_tenant()
            
            sprint = Sprint.objects.get(id=sprint_id, tenant=tenant)
            if sprint_data.name is not None:
                sprint.name = sprint_data.name
            if sprint_data.goal is not None:
                sprint.goal = sprint_data.goal
            if sprint_data.start_date is not None:
                sprint.start_date = sprint_data.start_date
            if sprint_data.end_date is not None:
                sprint.end_date = sprint_data.end_date
            if sprint_data.status is not None:
                sprint.status = sprint_data.status
            sprint.save()
            
            return SprintResponse(
                id=str(sprint.id),
                name=sprint.name,
                goal=sprint.goal,
                start_date=sprint.start_date,
                end_date=sprint.end_date,
                status=sprint.status,
                created_at=sprint.created_at
            )
        return await update_sync()
    
    async def delete_sprint(self, sprint_id: str):
        """Delete a sprint"""
        @sync_to_async
        def delete_sync():
            tenant = self._get_tenant()
            
            Sprint.objects.filter(id=sprint_id, tenant=tenant).delete()
        await delete_sync()

    async def get_task_activity(self, task_id: str) -> List[ActivityLogEntry]:
        """Get task activity log"""
        @sync_to_async
        def get_activity_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                # Mock activity data for now
                return [
                    ActivityLogEntry(
                        id="1",
                        user="System",
                        action="Task created",
                        timestamp=task.created_at,
                        details=f"Task '{task.title}' was created"
                    ),
                    ActivityLogEntry(
                        id="2", 
                        user="System",
                        action="Task updated",
                        timestamp=task.updated_at,
                        details=f"Task '{task.title}' was last updated"
                    )
                ]
            except Task.DoesNotExist:
                return []
        
        return await get_activity_sync()

    async def get_task_comments(self, task_id: str) -> List[TaskCommentSchema]:
        """Get task comments"""
        @sync_to_async
        def get_comments_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                comments = []
                for comment in task.comments.all():
                    comments.append(TaskCommentSchema(
                        id=str(comment.id),
                        user=TaskAssignee(
                            id=str(comment.user.id),
                            name=f"{comment.user.first_name} {comment.user.last_name}",
                            avatar=getattr(comment.user.profile, 'avatar', '') or '',
                            email=comment.user.email
                        ),
                        text=comment.text,
                        timestamp=comment.timestamp,
                        parent_id=str(comment.parent_id) if comment.parent_id else None
                    ))
                return comments
            except Task.DoesNotExist:
                return []
        
        return await get_comments_sync()

    async def add_task_comment(self, task_id: str, comment_data: CreateTaskCommentRequest, user_id: str) -> TaskCommentSchema:
        """Add a comment to a task"""
        @sync_to_async
        def add_comment_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                user = User.objects.get(id=user_id)
                
                comment = TaskComment.objects.create(
                    task=task,
                    user=user,
                    text=comment_data.text,
                    parent_id=comment_data.parent_id
                )
                
                return TaskCommentSchema(
                    id=str(comment.id),
                    user=TaskAssignee(
                        id=str(comment.user.id),
                        name=f"{comment.user.first_name} {comment.user.last_name}",
                        avatar=getattr(comment.user.profile, 'avatar', '') or '',
                        email=comment.user.email
                    ),
                    text=comment.text,
                    timestamp=comment.timestamp,
                    parent_id=str(comment.parent_id) if comment.parent_id else None
                )
            except Task.DoesNotExist:
                raise HTTPException(status_code=404, detail="Task not found")
            except User.DoesNotExist:
                raise HTTPException(status_code=404, detail="User not found")
        
        return await add_comment_sync()

    async def get_task_attachments(self, task_id: str) -> List[TaskDocument]:
        """Get task attachments"""
        @sync_to_async
        def get_attachments_sync():
            try:
                task = Task.objects.get(id=task_id, tenant=self._get_tenant())
                attachments = []
                for attachment in task.attachments.all():
                    attachments.append(TaskDocument(
                        id=str(attachment.id),
                        name=attachment.name,
                        file_url=attachment.file_url,
                        file_size=attachment.file_size,
                        mime_type=attachment.mime_type,
                        uploaded_by=TaskAssignee(
                            id=str(attachment.uploaded_by.id),
                            name=f"{attachment.uploaded_by.first_name} {attachment.uploaded_by.last_name}",
                            avatar=getattr(attachment.uploaded_by.profile, 'avatar', '') or '',
                            email=attachment.uploaded_by.email
                        ),
                        uploaded_at=attachment.uploaded_at
                    ))
                return attachments
            except Task.DoesNotExist:
                return []
        
        return await get_attachments_sync()
