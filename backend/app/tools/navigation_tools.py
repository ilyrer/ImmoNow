"""
ImmoNow - Navigation Tools
AI tools for UI navigation commands (frontend-executed)
"""

import logging
from typing import Optional, Dict, Any

from app.tools.registry import ToolRegistry, ToolParameter, ToolResult


logger = logging.getLogger(__name__)


# Navigation Handler
async def navigate_handler(
    tenant_id: str,
    user_id: str,
    route: str,
    params: Optional[Dict[str, Any]] = None,
) -> ToolResult:
    """
    Navigate to a route (returns UI command for frontend)

    Args:
        tenant_id: Tenant ID
        user_id: User ID
        route: Route path (e.g., /tasks, /properties/123)
        params: Optional query parameters

    Returns:
        ToolResult with UI command
    """
    try:
        # Validate route format
        if not route.startswith("/"):
            route = f"/{route}"

        logger.info(f"Navigation command: route={route}, params={params}")

        return ToolResult(
            success=True,
            data={
                "ui_command": {
                    "type": "NAVIGATE",
                    "route": route,
                    "params": params or {},
                },
                "message": f"Navigation zu {route}",
            },
        )
    except Exception as e:
        logger.error(f"Navigation failed: {e}", exc_info=True)
        return ToolResult(success=False, error=f"Fehler bei der Navigation: {str(e)}")


async def show_toast_handler(
    tenant_id: str,
    user_id: str,
    message: str,
    type: str = "info",
    duration: int = 3000,
) -> ToolResult:
    """
    Show a toast notification (returns UI command)

    Args:
        tenant_id: Tenant ID
        user_id: User ID
        message: Toast message
        type: Toast type (info, success, warning, error)
        duration: Duration in milliseconds

    Returns:
        ToolResult with UI command
    """
    try:
        return ToolResult(
            success=True,
            data={
                "ui_command": {
                    "type": "TOAST",
                    "message": message,
                    "toast_type": type,
                    "duration": duration,
                },
                "message": "Toast-Nachricht wird angezeigt",
            },
        )
    except Exception as e:
        logger.error(f"Toast failed: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Anzeigen der Nachricht: {str(e)}"
        )


async def open_modal_handler(
    tenant_id: str,
    user_id: str,
    modal_id: str,
    data: Optional[Dict[str, Any]] = None,
) -> ToolResult:
    """
    Open a modal (returns UI command)

    Args:
        tenant_id: Tenant ID
        user_id: User ID
        modal_id: Modal identifier
        data: Optional data to pass to modal

    Returns:
        ToolResult with UI command
    """
    try:
        return ToolResult(
            success=True,
            data={
                "ui_command": {
                    "type": "OPEN_MODAL",
                    "modal_id": modal_id,
                    "data": data or {},
                },
                "message": f"Modal '{modal_id}' wird geöffnet",
            },
        )
    except Exception as e:
        logger.error(f"Modal open failed: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Öffnen des Modals: {str(e)}"
        )


# Register Tools
def register_navigation_tools():
    """Register all navigation tools"""

    # navigate
    ToolRegistry.register(
        name="navigate",
        description="Navigiert zu einer bestimmten Seite in der App",
        parameters=[
            ToolParameter(
                name="route",
                type="string",
                description="Route-Pfad (z.B. /tasks, /properties, /contacts)",
                required=True,
            ),
            ToolParameter(
                name="params",
                type="object",
                description="Query-Parameter (optional)",
                required=False,
            ),
        ],
        handler=navigate_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="navigation",
    )

    # show_toast
    ToolRegistry.register(
        name="show_toast",
        description="Zeigt eine Toast-Benachrichtigung an",
        parameters=[
            ToolParameter(
                name="message",
                type="string",
                description="Nachricht",
                required=True,
            ),
            ToolParameter(
                name="type",
                type="string",
                description="Toast-Typ",
                required=False,
                default="info",
                enum=["info", "success", "warning", "error"],
            ),
            ToolParameter(
                name="duration",
                type="integer",
                description="Dauer in Millisekunden (default: 3000)",
                required=False,
                default=3000,
            ),
        ],
        handler=show_toast_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="navigation",
    )

    # open_modal
    ToolRegistry.register(
        name="open_modal",
        description="Öffnet ein Modal-Fenster",
        parameters=[
            ToolParameter(
                name="modal_id",
                type="string",
                description="Modal-Identifier (z.B. 'create_task', 'edit_contact')",
                required=True,
            ),
            ToolParameter(
                name="data",
                type="object",
                description="Daten für das Modal (optional)",
                required=False,
            ),
        ],
        handler=open_modal_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="navigation",
    )

    logger.info("Navigation tools registered")
