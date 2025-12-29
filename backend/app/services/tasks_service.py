"""
Tasks Service
"""

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from django.db import models
from django.db.models import Q, Count, Sum, Avg
from asgiref.sync import sync_to_async

from app.db.models import (
    Task,
    TaskLabel,
    TaskComment,
    TaskSubtask,
    TaskAttachment,
    TaskActivity,
    Board,
    Project,
    UserProfile,
    User,
    TaskPriority,
    TaskStatus,
)
from app.schemas.tasks import (
    TaskResponse,
    CreateTaskRequest,
    UpdateTaskRequest,
    MoveTaskRequest,
    EmployeeResponse,
    TaskStatisticsResponse,
    TaskAssignee,
    TaskLabel as TaskLabelSchema,
    TaskComment as TaskCommentSchema,
    ActivityLogEntry,
    Subtask,
    TaskDocument,
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
        label_ids: Optional[List[str]] = None,
        project_id: Optional[str] = None,
        board_id: Optional[str] = None,
        overdue_only: bool = False,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
    ) -> Tuple[List[TaskResponse], int]:
        """Get tasks with filters and pagination"""

        @sync_to_async
        def get_tasks_sync():
            queryset = Task.objects.filter(tenant_id=self.tenant_id, archived=False)

            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search)
                    | Q(description__icontains=search)
                    | Q(tags__icontains=search)
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

            if project_id:
                queryset = queryset.filter(project_id=project_id)

            if board_id:
                queryset = queryset.filter(board_id=board_id)

            if label_ids:
                queryset = queryset.filter(labels__id__in=label_ids).distinct()

            if overdue_only:
                queryset = queryset.filter(
                    due_date__lt=datetime.utcnow(),
                    status__in=["todo", "in_progress", "review"],
                )

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
            tasks = list(queryset[offset : offset + limit])
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
        self, task_data: CreateTaskRequest, created_by_id: str
    ) -> TaskResponse:
        """Create a new task"""

        @sync_to_async
        def create_task_sync():
            user = User.objects.get(id=created_by_id)
            # Fallback: wenn Client Platzhalter (z.B. "self" oder leer) sendet, auf Ersteller setzen
            assignee_id = task_data.assignee_id
            if not assignee_id or assignee_id == "self":
                assignee_id = created_by_id

            task = Task.objects.create(
                tenant_id=self.tenant_id,
                title=task_data.title,
                description=task_data.description,
                priority=task_data.priority,
                status=task_data.status,
                project_id=task_data.project_id,
                board_id=task_data.board_id,
                assignee_id=assignee_id,
                due_date=task_data.due_date,
                start_date=task_data.start_date,
                estimated_hours=task_data.estimated_hours,
                tags=task_data.tags,
                property_id=task_data.property_id,
                story_points=task_data.story_points,
                impact_score=task_data.impact_score,
                effort_score=task_data.effort_score,
                complexity=task_data.complexity,
                dependencies=task_data.dependencies,
                created_by=user,
            )

            if task_data.label_ids:
                labels = TaskLabel.objects.filter(
                    id__in=task_data.label_ids, tenant_id=self.tenant_id
                )
                task.labels.set(labels)

            # Create subtasks (simple replace on create)
            for order, subtask in enumerate(task_data.subtasks or []):
                TaskSubtask.objects.create(
                    task=task,
                    title=subtask.title,
                    completed=subtask.completed,
                    order=subtask.order if subtask.order is not None else order,
                    due_date=subtask.due_date,
                )

            # Audit log
            AuditService.audit_action(
                user=user,
                action="create",
                resource_type="task",
                resource_id=str(task.id),
                new_values={"title": task.title, "priority": task.priority},
            )

            return task

        task = await create_task_sync()
        return await self._build_task_response(task)

    async def update_task(
        self, task_id: str, task_data: UpdateTaskRequest, updated_by_id: str
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
                "assignee_id": str(task.assignee_id),
            }

            # Update fields
            update_data = task_data.model_dump(exclude_unset=True)
            label_ids = update_data.pop("label_ids", None)
            subtasks_payload = update_data.pop("subtasks", None)

            for field, value in update_data.items():
                setattr(task, field, value)

            task.save()

            # Update labels if provided
            if label_ids is not None:
                labels = TaskLabel.objects.filter(
                    id__in=label_ids, tenant_id=self.tenant_id
                )
                task.labels.set(labels)

            # Replace subtasks if provided
            if subtasks_payload is not None:
                task.subtasks.all().delete()
                for order, subtask in enumerate(subtasks_payload):
                    TaskSubtask.objects.create(
                        task=task,
                        title=subtask.title,
                        completed=subtask.completed,
                        order=subtask.order if subtask.order is not None else order,
                        due_date=subtask.due_date,
                    )

            # Audit log
            AuditService.audit_action(
                user=user,
                action="update",
                resource_type="task",
                resource_id=task_id,
                old_values=old_values,
                new_values=update_data,
            )

            return task

        task = await update_task_sync()
        if task:
            return await self._build_task_response(task)
        return None

    async def move_task(
        self, task_id: str, move_data: MoveTaskRequest, moved_by_id: str
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
                "position": getattr(task, "position", None),
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
                new_values={"status": task.status},
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
                old_values={"title": task.title, "status": task.status},
            )

            task.delete()

        await delete_task_sync()

    async def get_statistics(self) -> TaskStatisticsResponse:
        """Get task statistics"""

        @sync_to_async
        def get_statistics_sync():
            queryset = Task.objects.filter(tenant_id=self.tenant_id, archived=False)

            total_tasks = queryset.count()
            active_tasks = queryset.exclude(status="done").count()
            completed_tasks = queryset.filter(status="done").count()
            blocked_tasks = queryset.filter(status="blocked").count()

            # Overdue tasks
            now = datetime.utcnow()
            overdue_tasks = queryset.filter(
                due_date__lt=now, status__in=["todo", "in_progress", "review"]
            ).count()

            # Hours
            total_estimated_hours = (
                queryset.aggregate(total=Sum("estimated_hours"))["total"] or 0
            )
            total_actual_hours = (
                queryset.aggregate(total=Sum("actual_hours"))["total"] or 0
            )

            # Completion rate
            completion_rate = (
                (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            )

            # Tasks by priority
            tasks_by_priority = {}
            for priority in TaskPriority:
                count = queryset.filter(priority=priority.value).count()
                tasks_by_priority[priority.value] = count

            # Tasks by status
            tasks_by_status = {}
            for status in TaskStatus:
                count = queryset.filter(status=status.value).count()
                tasks_by_status[status.value] = count

            # Tasks by assignee
            tasks_by_assignee = {}
            assignee_counts = queryset.values(
                "assignee__first_name", "assignee__last_name"
            ).annotate(count=Count("id"))
            for item in assignee_counts:
                name = f"{item['assignee__first_name']} {item['assignee__last_name']}"
                tasks_by_assignee[name] = item["count"]

            # Upcoming deadlines
            upcoming_deadlines = list(
                queryset.filter(
                    due_date__gte=now, status__in=["todo", "in_progress", "review"]
                ).order_by("due_date")[:5]
            )

            return {
                "total_tasks": total_tasks,
                "active_tasks": active_tasks,
                "completed_tasks": completed_tasks,
                "blocked_tasks": blocked_tasks,
                "overdue_tasks": overdue_tasks,
                "total_estimated_hours": total_estimated_hours,
                "total_actual_hours": total_actual_hours,
                "completion_rate": completion_rate,
                "tasks_by_priority": tasks_by_priority,
                "tasks_by_status": tasks_by_status,
                "tasks_by_assignee": tasks_by_assignee,
                "upcoming_deadlines": upcoming_deadlines,
            }

        stats = await get_statistics_sync()
        upcoming_tasks = [
            await self._build_task_response(task)
            for task in stats["upcoming_deadlines"]
        ]

        # Get recent activity (last 50 activities across all tasks)
        @sync_to_async
        def get_recent_activities():
            from app.db.models import TaskActivity

            activities = (
                TaskActivity.objects.filter(task__tenant_id=self.tenant_id)
                .select_related("task", "user")
                .order_by("-created_at")[:50]
            )

            return [
                {
                    "id": str(act.id),
                    "task_id": str(act.task_id),
                    "task_title": act.task.title,
                    "action": act.action,
                    "user": (
                        f"{act.user.first_name} {act.user.last_name}"
                        if act.user
                        else "System"
                    ),
                    "user_id": str(act.user_id) if act.user_id else None,
                    "timestamp": act.created_at,
                    "description": act.description or "",
                }
                for act in activities
            ]

        recent_activity = await get_recent_activities()

        return TaskStatisticsResponse(
            total_tasks=stats["total_tasks"],
            active_tasks=stats["active_tasks"],
            completed_tasks=stats["completed_tasks"],
            blocked_tasks=stats["blocked_tasks"],
            overdue_tasks=stats["overdue_tasks"],
            total_estimated_hours=stats["total_estimated_hours"],
            total_actual_hours=stats["total_actual_hours"],
            completion_rate=stats["completion_rate"],
            tasks_by_priority=stats["tasks_by_priority"],
            tasks_by_status=stats["tasks_by_status"],
            tasks_by_assignee=stats["tasks_by_assignee"],
            upcoming_deadlines=upcoming_tasks,
            recent_activity=recent_activity,
        )

    async def _build_task_response(self, task: Task) -> TaskResponse:
        """Build TaskResponse from Task model"""

        @sync_to_async
        def build_response_sync():
            # Get assignee info - safely handle missing profile
            try:
                assignee_avatar = (
                    task.assignee.profile.avatar or task.assignee.avatar or ""
                )
                assignee_role = (
                    task.assignee.profile.role if task.assignee.profile else ""
                )
            except User.profile.RelatedObjectDoesNotExist:
                assignee_avatar = task.assignee.avatar or ""
                assignee_role = ""

            assignee = TaskAssignee(
                id=str(task.assignee.id),
                name=f"{task.assignee.first_name} {task.assignee.last_name}",
                avatar=assignee_avatar,
                role=assignee_role,
                email=task.assignee.email,
            )

            # Get created by info - safely handle missing profile
            try:
                creator_avatar = (
                    task.created_by.profile.avatar or task.created_by.avatar or ""
                )
                creator_role = (
                    task.created_by.profile.role if task.created_by.profile else ""
                )
            except User.profile.RelatedObjectDoesNotExist:
                creator_avatar = task.created_by.avatar or ""
                creator_role = ""

            created_by = TaskAssignee(
                id=str(task.created_by.id),
                name=f"{task.created_by.first_name} {task.created_by.last_name}",
                avatar=creator_avatar,
                role=creator_role,
                email=task.created_by.email,
            )

            labels = [
                TaskLabelSchema(
                    id=str(label.id),
                    name=label.name,
                    color=label.color,
                    description=label.description,
                )
                for label in task.labels.all()
            ]

            subtasks = [
                Subtask(
                    id=str(sub.id),
                    title=sub.title,
                    completed=sub.completed,
                    order=sub.order,
                )
                for sub in task.subtasks.all().order_by("order")
            ]

            attachments = [
                TaskDocument(
                    id=str(att.id),
                    name=att.name,
                    url=att.url,
                    size=att.size or 0,
                    mime_type=att.mime_type or "",
                )
                for att in task.attachments.all()
            ]

            activities = [
                ActivityLogEntry(
                    id=str(act.id),
                    action=act.action,
                    user=created_by,  # simplified, could map act.user
                    timestamp=act.created_at,
                    description=act.description or "",
                )
                for act in task.activities.all().order_by("-created_at")[:20]
            ]

            # Load comments with author info
            comments = [
                TaskCommentSchema(
                    id=str(comment.id),
                    author=TaskAssignee(
                        id=str(comment.author.id),
                        name=f"{comment.author.first_name} {comment.author.last_name}",
                        avatar=getattr(comment.author, "avatar", "") or "",
                        role=getattr(
                            getattr(comment.author, "profile", None), "role", ""
                        )
                        or "",
                        email=comment.author.email,
                    ),
                    text=comment.text,
                    timestamp=comment.timestamp,
                    parent_id=str(comment.parent_id) if comment.parent_id else None,
                )
                for comment in task.comments.all().order_by("timestamp")
            ]

            # Load property info if property_id exists
            property_info = None
            if task.property_id:
                try:
                    from app.db.models import Property

                    property_obj = Property.objects.filter(
                        id=task.property_id, tenant_id=self.tenant_id
                    ).first()

                    if property_obj:
                        property_info = {
                            "id": str(property_obj.id),
                            "title": property_obj.title,
                            "type": property_obj.type,
                            "status": property_obj.status,
                            "address": property_obj.address or "",
                            "city": property_obj.city or "",
                            "price": (
                                float(property_obj.price)
                                if property_obj.price
                                else None
                            ),
                        }
                except Exception as e:
                    print(f"⚠️ Could not load property info: {e}")
                    property_info = None

            return TaskResponse(
                id=str(task.id),
                project_id=str(task.project_id) if task.project_id else None,
                board_id=str(task.board_id) if task.board_id else None,
                title=task.title,
                description=task.description or "",
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
                story_points=task.story_points,
                ai_score=task.ai_score,
                impact_score=task.impact_score,
                effort_score=task.effort_score,
                complexity=task.complexity,
                dependencies=task.dependencies or [],
                subtasks=subtasks,
                comments=comments,
                attachments=attachments,
                property=property_info,
                financing_status=None,  # TODO: Implement financing status if needed
                activity_log=activities,
                created_at=task.created_at,
                updated_at=task.updated_at,
                created_by=created_by,
                archived=task.archived,
                blocked=None,  # TODO: Implement blocked info if blocking system exists
            )

        return await build_response_sync()
