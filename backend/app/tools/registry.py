"""
ImmoNow - Tool Registry
Central registry for AI tool calling with validation, RBAC, and audit
"""

import logging
import asyncio
from typing import Dict, List, Optional, Any, Callable, Awaitable
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.errors import ValidationError, ForbiddenError
from app.services.audit import AuditService


logger = logging.getLogger(__name__)


# Base Models
class ToolParameter(BaseModel):
    """Tool parameter definition"""

    name: str
    type: str  # "string", "integer", "boolean", "array", "object"
    description: str
    required: bool = True
    default: Optional[Any] = None
    enum: Optional[List[Any]] = None


class ToolDefinition(BaseModel):
    """Tool definition with metadata"""

    name: str = Field(..., description="Unique tool name")
    description: str = Field(..., description="Human-readable description")
    parameters: List[ToolParameter] = Field(default_factory=list)
    requires_confirmation: bool = Field(
        default=False, description="Whether tool requires user confirmation"
    )
    required_scopes: List[str] = Field(
        default_factory=list, description="Required user scopes"
    )
    category: str = Field(
        default="general", description="Tool category (task, entity, navigation, etc.)"
    )


class ToolCall(BaseModel):
    """A tool call request"""

    name: str = Field(..., description="Tool name")
    args: Dict[str, Any] = Field(..., description="Tool arguments")
    idempotency_key: Optional[str] = Field(None, description="Idempotency key")


class ToolResult(BaseModel):
    """Tool execution result"""

    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None


class ToolRegistry:
    """
    Central registry for AI tools

    Features:
    - Tool registration with metadata
    - Pydantic validation of arguments
    - RBAC permission checks
    - Idempotency keys for critical operations
    - Audit logging
    - Confirmation flow for high-risk actions
    """

    _tools: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register(
        cls,
        name: str,
        description: str,
        parameters: List[ToolParameter],
        handler: Callable[..., Awaitable[ToolResult]],
        requires_confirmation: bool = False,
        required_scopes: Optional[List[str]] = None,
        category: str = "general",
    ):
        """
        Register a new tool

        Args:
            name: Unique tool name
            description: Human-readable description
            parameters: List of ToolParameter
            handler: Async function that executes the tool
            requires_confirmation: Whether tool needs confirmation
            required_scopes: Required user scopes (e.g., ["write", "admin"])
            category: Tool category
        """
        if name in cls._tools:
            logger.warning(f"Tool {name} already registered, overwriting")

        tool_def = ToolDefinition(
            name=name,
            description=description,
            parameters=parameters,
            requires_confirmation=requires_confirmation,
            required_scopes=required_scopes or [],
            category=category,
        )

        cls._tools[name] = {
            "definition": tool_def,
            "handler": handler,
        }

        logger.info(f"Registered tool: {name} (category={category})")

    @classmethod
    def get_tool(cls, name: str) -> Optional[Dict[str, Any]]:
        """Get tool by name"""
        return cls._tools.get(name)

    @classmethod
    def list_tools(
        cls,
        category: Optional[str] = None,
        scopes: Optional[List[str]] = None,
    ) -> List[ToolDefinition]:
        """
        List all registered tools

        Args:
            category: Filter by category
            scopes: Filter by user scopes (only show accessible tools)

        Returns:
            List of ToolDefinition
        """
        tools = []

        for tool_data in cls._tools.values():
            tool_def = tool_data["definition"]

            # Filter by category
            if category and tool_def.category != category:
                continue

            # Filter by scopes (user must have ALL required scopes)
            if scopes and tool_def.required_scopes:
                if not all(scope in scopes for scope in tool_def.required_scopes):
                    continue

            tools.append(tool_def)

        return tools

    @classmethod
    def _check_permissions(
        cls,
        tool_def: ToolDefinition,
        user_scopes: List[str],
    ) -> bool:
        """
        Check if user has required permissions

        Args:
            tool_def: Tool definition
            user_scopes: User's scopes

        Returns:
            True if user has all required scopes
        """
        if not tool_def.required_scopes:
            return True

        return all(scope in user_scopes for scope in tool_def.required_scopes)

    @classmethod
    def _validate_args(
        cls,
        tool_def: ToolDefinition,
        args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Validate tool arguments against definition

        Args:
            tool_def: Tool definition
            args: Provided arguments

        Returns:
            Validated arguments (with defaults applied)

        Raises:
            ValidationError: If validation fails
        """
        validated = {}

        for param in tool_def.parameters:
            value = args.get(param.name)

            # Check required
            if param.required and value is None:
                if param.default is not None:
                    value = param.default
                else:
                    raise ValidationError(f"Missing required parameter: {param.name}")

            # Apply default if not provided
            if value is None and param.default is not None:
                value = param.default

            # Type checking (basic)
            if value is not None:
                expected_type = param.type.lower()

                if expected_type == "string" and not isinstance(value, str):
                    raise ValidationError(
                        f"Parameter {param.name} must be string, got {type(value).__name__}"
                    )
                elif expected_type == "integer" and not isinstance(value, int):
                    raise ValidationError(
                        f"Parameter {param.name} must be integer, got {type(value).__name__}"
                    )
                elif expected_type == "boolean" and not isinstance(value, bool):
                    raise ValidationError(
                        f"Parameter {param.name} must be boolean, got {type(value).__name__}"
                    )
                elif expected_type == "array" and not isinstance(value, list):
                    raise ValidationError(
                        f"Parameter {param.name} must be array, got {type(value).__name__}"
                    )
                elif expected_type == "object" and not isinstance(value, dict):
                    raise ValidationError(
                        f"Parameter {param.name} must be object, got {type(value).__name__}"
                    )

                # Check enum
                if param.enum and value not in param.enum:
                    raise ValidationError(
                        f"Parameter {param.name} must be one of {param.enum}, got {value}"
                    )

            validated[param.name] = value

        return validated

    @classmethod
    async def execute(
        cls,
        tool_call: ToolCall,
        user_id: str,
        tenant_id: str,
        user_scopes: List[str],
        skip_confirmation: bool = False,
    ) -> ToolResult:
        """
        Execute a tool call

        Args:
            tool_call: ToolCall with name and args
            user_id: User ID (for audit)
            tenant_id: Tenant ID (for audit & multi-tenancy)
            user_scopes: User's scopes (for RBAC)
            skip_confirmation: Skip confirmation check (if already confirmed by user)

        Returns:
            ToolResult
        """
        start_time = datetime.utcnow()

        # Get tool
        tool = cls.get_tool(tool_call.name)
        if not tool:
            logger.warning(f"Tool not found: {tool_call.name}")
            return ToolResult(
                success=False,
                error=f"Tool '{tool_call.name}' not found",
            )

        tool_def = tool["definition"]
        handler = tool["handler"]

        try:
            # Check permissions
            if not cls._check_permissions(tool_def, user_scopes):
                logger.warning(
                    f"Permission denied for tool {tool_call.name} "
                    f"(user_scopes={user_scopes}, required={tool_def.required_scopes})"
                )
                return ToolResult(
                    success=False,
                    error=f"Permission denied. Required scopes: {tool_def.required_scopes}",
                )

            # Validate arguments
            validated_args = cls._validate_args(tool_def, tool_call.args)

            # Check if confirmation is required
            if tool_def.requires_confirmation and not skip_confirmation:
                # Return early with confirmation request
                confirmation_msg = (
                    f"Möchtest du wirklich '{tool_def.name}' ausführen?\n"
                    f"Parameter: {validated_args}"
                )

                return ToolResult(
                    success=False,
                    requires_confirmation=True,
                    confirmation_message=confirmation_msg,
                    data={"validated_args": validated_args},
                )

            # Execute tool handler
            logger.info(
                f"Executing tool: {tool_call.name} "
                f"(user={user_id}, tenant={tenant_id})"
            )

            result = await handler(
                tenant_id=tenant_id, user_id=user_id, **validated_args
            )

            # Log success
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Tool executed successfully: {tool_call.name} "
                f"(duration={duration:.2f}s)"
            )

            # Audit log
            try:
                audit_service = AuditService(tenant_id)
                await audit_service.log_action(
                    user_id=user_id,
                    action=f"tool_call:{tool_call.name}",
                    details={
                        "args": validated_args,
                        "result": (
                            result.model_dump()
                            if hasattr(result, "model_dump")
                            else str(result)
                        ),
                        "duration_seconds": duration,
                    },
                    success=True,
                )
            except Exception as e:
                logger.error(f"Failed to log tool audit: {e}")

            return result

        except ValidationError as e:
            logger.warning(f"Tool validation error: {e}")
            return ToolResult(
                success=False,
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Tool execution failed: {e}", exc_info=True)

            # Audit log failure
            try:
                audit_service = AuditService(tenant_id)
                await audit_service.log_action(
                    user_id=user_id,
                    action=f"tool_call:{tool_call.name}",
                    details={
                        "args": tool_call.args,
                        "error": str(e),
                    },
                    success=False,
                )
            except Exception as audit_error:
                logger.error(f"Failed to log tool audit: {audit_error}")

            return ToolResult(
                success=False,
                error=f"Tool execution failed: {str(e)}",
            )

    @classmethod
    def get_tool_schema_for_llm(cls, scopes: Optional[List[str]] = None) -> str:
        """
        Get tool schema formatted for LLM prompt

        Args:
            scopes: Filter by user scopes

        Returns:
            Formatted tool schema string
        """
        tools = cls.list_tools(scopes=scopes)

        if not tools:
            return "Keine Tools verfügbar."

        schema_parts = ["Verfügbare Tools:\n"]

        for tool in tools:
            schema_parts.append(f"\n{tool.name}:")
            schema_parts.append(f"  Beschreibung: {tool.description}")

            if tool.parameters:
                schema_parts.append("  Parameter:")
                for param in tool.parameters:
                    required_str = " (required)" if param.required else " (optional)"
                    schema_parts.append(
                        f"    - {param.name} ({param.type}){required_str}: {param.description}"
                    )
                    if param.enum:
                        schema_parts.append(f"      Erlaubte Werte: {param.enum}")
                    if param.default is not None:
                        schema_parts.append(f"      Standard: {param.default}")

            schema_parts.append(
                f"  Beispiel: {{'type': 'tool', 'name': '{tool.name}', 'args': {{...}}}}"
            )

        return "\n".join(schema_parts)
