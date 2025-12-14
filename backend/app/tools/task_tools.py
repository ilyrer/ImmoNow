"""
ImmoNow - Task Tools
AI tools for task management operations
"""

import logging
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from asgiref.sync import sync_to_async

from app.db.models import Task, Project, TaskStatus
from app.tools.registry import ToolRegistry, ToolParameter, ToolResult
from app.core.errors import NotFoundError, ValidationError


logger = logging.getLogger(__name__)


# Tool Handlers
async def create_task_handler(
    tenant_id: str,
    user_id: str,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[str] = None,
    priority: str = "medium",
    assignee_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: str = "todo",
    tags: Optional[List[str]] = None,
) -> ToolResult:
    """
    Create a new task

    Args:
        tenant_id: Tenant ID
        user_id: User ID (creator)
        title: Task title
        description: Task description
        due_date: Due date (ISO format: YYYY-MM-DD)
        priority: Priority (low, medium, high, urgent)
        assignee_id: Assigned user ID
        project_id: Project ID
        status: Initial status
        tags: List of tags

    Returns:
        ToolResult with created task
    """
    try:
        # Parse due_date if provided
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = datetime.fromisoformat(due_date).date()
            except ValueError:
                return ToolResult(
                    success=False,
                    error=f"Invalid due_date format: {due_date}. Use YYYY-MM-DD",
                )

        # Get or create default project if not specified
        if not project_id:
            default_project = await sync_to_async(
                Project.objects.filter(tenant_id=tenant_id, name="Default").first
            )()

            if not default_project:
                # Create default project
                default_project = await sync_to_async(Project.objects.create)(
                    tenant_id=tenant_id,
                    name="Default",
                    description="Default project for tasks",
                    created_by_id=user_id,
                )

            project_id = str(default_project.id)

        # Create task
        task = await sync_to_async(Task.objects.create)(
            tenant_id=tenant_id,
            title=title,
            description=description or "",
            due_date=parsed_due_date,
            priority=priority,
            assignee_id=assignee_id,
            project_id=project_id,
            status=status,  # status is a CharField with TaskStatus choices
            created_by_id=user_id,
        )

        # Add tags if provided
        if tags:
            from app.db.models.tasks import Tag

            for tag_name in tags:
                tag, _ = await sync_to_async(Tag.objects.get_or_create)(
                    tenant_id=tenant_id, name=tag_name, defaults={"color": "#808080"}
                )
                await sync_to_async(task.tags.add)(tag)

        logger.info(f"Task created: {task.id} - {task.title}")

        return ToolResult(
            success=True,
            data={
                "task_id": str(task.id),
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "message": f"Task '{task.title}' erfolgreich erstellt",
            },
        )

    except Exception as e:
        logger.error(f"Failed to create task: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Erstellen des Tasks: {str(e)}"
        )


async def list_tasks_handler(
    tenant_id: str,
    user_id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = 10,
) -> ToolResult:
    """
    List tasks with filters

    Args:
        tenant_id: Tenant ID
        user_id: User ID
        status: Filter by status
        priority: Filter by priority
        assignee_id: Filter by assignee
        project_id: Filter by project
        limit: Max number of tasks to return

    Returns:
        ToolResult with task list
    """
    try:
        # Build query
        query = Task.objects.filter(tenant_id=tenant_id, is_deleted=False)

        if status:
            query = query.filter(status__name=status)
        if priority:
            query = query.filter(priority=priority)
        if assignee_id:
            query = query.filter(assignee_id=assignee_id)
        if project_id:
            query = query.filter(project_id=project_id)

        # Execute query
        tasks = await sync_to_async(list)(
            query.select_related("status", "assignee", "project").order_by(
                "-created_at"
            )[:limit]
        )

        # Format results
        task_list = []
        for task in tasks:
            task_list.append(
                {
                    "task_id": str(task.id),
                    "title": task.title,
                    "status": task.status.name if task.status else "unknown",
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "assignee": task.assignee.email if task.assignee else None,
                    "project": task.project.name if task.project else None,
                }
            )

        return ToolResult(
            success=True,
            data={
                "tasks": task_list,
                "count": len(task_list),
                "message": f"{len(task_list)} Tasks gefunden",
            },
        )

    except Exception as e:
        logger.error(f"Failed to list tasks: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Abrufen der Tasks: {str(e)}"
        )


async def update_task_handler(
    tenant_id: str,
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
    assignee_id: Optional[str] = None,
) -> ToolResult:
    """
    Update a task

    Args:
        tenant_id: Tenant ID
        user_id: User ID
        task_id: Task ID to update
        title: New title
        description: New description
        status: New status
        priority: New priority
        due_date: New due date (ISO format)
        assignee_id: New assignee ID

    Returns:
        ToolResult with updated task
    """
    try:
        # Get task
        task = await sync_to_async(
            Task.objects.filter(tenant_id=tenant_id, id=task_id, is_deleted=False).first
        )()

        if not task:
            return ToolResult(
                success=False, error=f"Task mit ID {task_id} nicht gefunden"
            )

        # Update fields
        updated_fields = []

        if title is not None:
            task.title = title
            updated_fields.append("title")

        if description is not None:
            task.description = description
            updated_fields.append("description")

        if priority is not None:
            task.priority = priority
            updated_fields.append("priority")

        if due_date is not None:
            try:
                task.due_date = datetime.fromisoformat(due_date).date()
                updated_fields.append("due_date")
            except ValueError:
                return ToolResult(
                    success=False, error=f"Invalid due_date format: {due_date}"
                )

        if assignee_id is not None:
            task.assignee_id = assignee_id
            updated_fields.append("assignee")

        if status is not None:
            # Validate status is a valid TaskStatus choice
            valid_statuses = [choice[0] for choice in TaskStatus.choices]
            if status in valid_statuses:
                task.status = status
                updated_fields.append("status")

        # Save
        if updated_fields:
            await sync_to_async(task.save)()

            return ToolResult(
                success=True,
                data={
                    "task_id": str(task.id),
                    "updated_fields": updated_fields,
                    "message": f"Task '{task.title}' aktualisiert: {', '.join(updated_fields)}",
                },
            )
        else:
            return ToolResult(
                success=True,
                data={
                    "task_id": str(task.id),
                    "message": "Keine Änderungen vorgenommen",
                },
            )

    except Exception as e:
        logger.error(f"Failed to update task: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Aktualisieren des Tasks: {str(e)}"
        )


# Register Tools
def register_task_tools():
    """Register all task tools"""

    # create_task
    ToolRegistry.register(
        name="create_task",
        description="Erstellt einen neuen Task mit Titel, Beschreibung, Fälligkeitsdatum, Priorität",
        parameters=[
            ToolParameter(
                name="title",
                type="string",
                description="Task-Titel",
                required=True,
            ),
            ToolParameter(
                name="description",
                type="string",
                description="Task-Beschreibung (optional)",
                required=False,
            ),
            ToolParameter(
                name="due_date",
                type="string",
                description="Fälligkeitsdatum im Format YYYY-MM-DD (optional)",
                required=False,
            ),
            ToolParameter(
                name="priority",
                type="string",
                description="Priorität",
                required=False,
                default="medium",
                enum=["low", "medium", "high", "urgent"],
            ),
            ToolParameter(
                name="assignee_id",
                type="string",
                description="ID des zugewiesenen Benutzers (optional)",
                required=False,
            ),
            ToolParameter(
                name="project_id",
                type="string",
                description="Projekt-ID (optional)",
                required=False,
            ),
            ToolParameter(
                name="status",
                type="string",
                description="Status (optional, default: todo)",
                required=False,
                default="todo",
            ),
            ToolParameter(
                name="tags",
                type="array",
                description="Tags (optional)",
                required=False,
            ),
        ],
        handler=create_task_handler,
        requires_confirmation=False,
        required_scopes=["write"],
        category="task",
    )

    # list_tasks
    ToolRegistry.register(
        name="list_tasks",
        description="Listet Tasks auf mit optionalen Filtern (Status, Priorität, Zugewiesene, Projekt)",
        parameters=[
            ToolParameter(
                name="status",
                type="string",
                description="Filter nach Status (optional)",
                required=False,
            ),
            ToolParameter(
                name="priority",
                type="string",
                description="Filter nach Priorität (optional)",
                required=False,
                enum=["low", "medium", "high", "urgent"],
            ),
            ToolParameter(
                name="assignee_id",
                type="string",
                description="Filter nach Zugewiesene-ID (optional)",
                required=False,
            ),
            ToolParameter(
                name="project_id",
                type="string",
                description="Filter nach Projekt-ID (optional)",
                required=False,
            ),
            ToolParameter(
                name="limit",
                type="integer",
                description="Maximale Anzahl der Tasks (default: 10)",
                required=False,
                default=10,
            ),
        ],
        handler=list_tasks_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="task",
    )

    # update_task
    ToolRegistry.register(
        name="update_task",
        description="Aktualisiert einen bestehenden Task (Titel, Status, Priorität, etc.)",
        parameters=[
            ToolParameter(
                name="task_id",
                type="string",
                description="ID des zu aktualisierenden Tasks",
                required=True,
            ),
            ToolParameter(
                name="title",
                type="string",
                description="Neuer Titel (optional)",
                required=False,
            ),
            ToolParameter(
                name="description",
                type="string",
                description="Neue Beschreibung (optional)",
                required=False,
            ),
            ToolParameter(
                name="status",
                type="string",
                description="Neuer Status (optional)",
                required=False,
            ),
            ToolParameter(
                name="priority",
                type="string",
                description="Neue Priorität (optional)",
                required=False,
                enum=["low", "medium", "high", "urgent"],
            ),
            ToolParameter(
                name="due_date",
                type="string",
                description="Neues Fälligkeitsdatum YYYY-MM-DD (optional)",
                required=False,
            ),
            ToolParameter(
                name="assignee_id",
                type="string",
                description="Neue Zugewiesene-ID (optional)",
                required=False,
            ),
        ],
        handler=update_task_handler,
        requires_confirmation=False,
        required_scopes=["write"],
        category="task",
    )

    logger.info("Task tools registered")
