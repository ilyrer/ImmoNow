"""
Tools package initialization
"""

from .registry import (
    ToolRegistry,
    ToolDefinition,
    ToolParameter,
    ToolCall,
    ToolResult,
)
from .task_tools import register_task_tools
from .entity_tools import register_entity_tools
from .navigation_tools import register_navigation_tools


def register_all_tools():
    """Register all available tools"""
    register_task_tools()
    register_entity_tools()
    register_navigation_tools()


__all__ = [
    "ToolRegistry",
    "ToolDefinition",
    "ToolParameter",
    "ToolCall",
    "ToolResult",
    "register_all_tools",
]
