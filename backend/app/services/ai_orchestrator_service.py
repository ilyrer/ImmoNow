"""
ImmoNow - AI Orchestrator Service
Central service for AI chat with RAG, tool calling, and response generation
"""

import json
import logging
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.ai_config import get_ai_config
from app.services.ai.ollama_client import get_ollama_client
from app.services.rag_service import RagService, RetrievedChunk
from app.tools import ToolRegistry, ToolCall, ToolResult, register_all_tools
from app.services.audit import AuditService
from app.core.errors import ValidationError


logger = logging.getLogger(__name__)


# Pydantic Models
class ChatMessage(BaseModel):
    """A chat message"""

    role: str = Field(..., description="Message role: system, user, assistant")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatContext(BaseModel):
    """Chat context information"""

    context_type: Optional[str] = Field(
        None, description="Context type (properties, contacts, etc.)"
    )
    context_data: Optional[Dict[str, Any]] = Field(
        None, description="Context-specific data"
    )


class Source(BaseModel):
    """A RAG source"""

    id: str
    title: str
    snippet: str
    score: float
    source_type: str


class UICommand(BaseModel):
    """A UI command for frontend execution"""

    type: str = Field(..., description="Command type: NAVIGATE, TOAST, OPEN_MODAL")
    payload: Dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Chat response"""

    message: str = Field(..., description="Assistant's response message")
    sources: List[Source] = Field(default_factory=list, description="RAG sources used")
    tool_call: Optional[Dict[str, Any]] = Field(None, description="Tool call (if any)")
    ui_commands: List[UICommand] = Field(
        default_factory=list, description="UI commands"
    )
    requires_confirmation: bool = Field(
        default=False, description="Needs user confirmation"
    )
    confirmation_message: Optional[str] = Field(None, description="Confirmation prompt")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )


class AiOrchestrator:
    """
    AI Orchestrator - Central service for AI-powered chat

    Workflow:
    1. Receive user message + context
    2. Retrieve relevant context from RAG (if enabled)
    3. Build prompt with system prompt + RAG context + chat history
    4. Call Ollama LLM for generation
    5. Parse response (JSON: {"type": "final"|"tool", ...})
    6. If tool call: Execute tool → Get result → Second LLM call for final response
    7. Return ChatResponse with message, sources, ui_commands
    """

    def __init__(self, tenant_id: str, user_id: str, user_scopes: List[str]):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.user_scopes = user_scopes

        self.config = get_ai_config()
        self.ollama_client = get_ollama_client()
        self.rag_service = RagService(tenant_id)
        self.audit_service = AuditService(tenant_id)

        # Ensure tools are registered
        register_all_tools()

        logger.info(
            f"AiOrchestrator initialized: "
            f"tenant={tenant_id}, user={user_id}, scopes={user_scopes}"
        )

    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON from text (handles LLM responses with extra text)

        Tries multiple strategies:
        1. Direct JSON parse
        2. Extract between ```json and ```
        3. Extract between { and } (greedy)

        Returns:
            Parsed JSON dict or None
        """
        # Strategy 1: Direct parse
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Strategy 2: Extract from code block
        code_block_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if code_block_match:
            try:
                return json.loads(code_block_match.group(1))
            except json.JSONDecodeError:
                pass

        # Strategy 3: Extract first JSON object
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        logger.warning(f"Failed to extract JSON from text: {text[:200]}...")
        return None

    def _build_system_prompt(self, retrieved_chunks: List[RetrievedChunk]) -> str:
        """
        Build system prompt with RAG context and tool definitions

        Args:
            retrieved_chunks: RAG-retrieved chunks

        Returns:
            System prompt string
        """
        parts = [self.config.chat_system_prompt]

        # Add RAG context if available
        if retrieved_chunks:
            parts.append("\n\n### Kontext aus Wissensdatenbank:\n")
            for i, chunk in enumerate(retrieved_chunks, 1):
                parts.append(
                    f"\n[Quelle {i}] {chunk.chunk.source} (Score: {chunk.score:.2f}):\n"
                    f"{chunk.chunk.content}\n"
                )

        # Add tool definitions
        if self.config.tool_calling_enabled:
            tool_schema = ToolRegistry.get_tool_schema_for_llm(scopes=self.user_scopes)
            parts.append(f"\n\n### {tool_schema}")

        return "".join(parts)

    async def _retrieve_context(
        self,
        query: str,
        context: Optional[ChatContext] = None,
    ) -> List[RetrievedChunk]:
        """
        Retrieve relevant context from RAG

        Args:
            query: User query
            context: Optional context filter

        Returns:
            List of retrieved chunks
        """
        try:
            # Determine source type filter
            source_type = None
            if context and context.context_type:
                # Map context type to source type
                type_mapping = {
                    "properties": "entity",
                    "contacts": "entity",
                    "tasks": "entity",
                    "documents": "docs",
                    "general": None,
                }
                source_type = type_mapping.get(context.context_type)

            # Retrieve chunks
            chunks = await self.rag_service.retrieve_context(
                query=query,
                top_k=self.config.rag_top_k,
                source_type=source_type,
            )

            logger.info(f"Retrieved {len(chunks)} chunks for query")
            return chunks

        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}", exc_info=True)
            return []

    async def _call_llm(
        self,
        messages: List[Dict[str, str]],
        max_retries: int = 2,
    ) -> str:
        """
        Call Ollama LLM with retry logic

        Args:
            messages: List of message dicts
            max_retries: Max retry attempts

        Returns:
            LLM response text
        """
        for attempt in range(max_retries + 1):
            try:
                response = await self.ollama_client.generate_completion(
                    messages=messages,
                    temperature=self.config.ollama_temperature,
                    max_tokens=2048,
                )
                return response
            except Exception as e:
                if attempt < max_retries:
                    logger.warning(
                        f"LLM call failed (attempt {attempt + 1}/{max_retries + 1}): {e}"
                    )
                else:
                    logger.error(
                        f"LLM call failed after {max_retries + 1} attempts: {e}"
                    )
                    raise

        return ""  # Should never reach here

    async def chat(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
        context: Optional[ChatContext] = None,
        skip_rag: bool = False,
        skip_confirmation: bool = False,
    ) -> ChatResponse:
        """
        Process a chat message with RAG and tool calling

        Args:
            message: User message
            history: Chat history
            context: Optional context information
            skip_rag: Skip RAG retrieval
            skip_confirmation: Skip confirmation check (if already confirmed)

        Returns:
            ChatResponse
        """
        start_time = datetime.utcnow()

        try:
            # Retrieve RAG context
            retrieved_chunks = []
            if not skip_rag:
                retrieved_chunks = await self._retrieve_context(message, context)

            # Build system prompt with RAG context
            system_prompt = self._build_system_prompt(retrieved_chunks)

            # Build messages
            messages = [{"role": "system", "content": system_prompt}]

            # Add history (limited by max_history)
            if history:
                history_limit = self.config.chat_max_history
                recent_history = history[-history_limit:]
                for msg in recent_history:
                    messages.append({"role": msg.role, "content": msg.content})

            # Add user message
            messages.append({"role": "user", "content": message})

            # Call LLM
            logger.info(f"Calling LLM with {len(messages)} messages")
            llm_response = await self._call_llm(messages)

            # Parse response
            parsed = self._extract_json_from_text(llm_response)

            if not parsed:
                # Fallback: Treat as final message
                logger.warning("Failed to parse JSON from LLM response, using raw text")
                return ChatResponse(
                    message=llm_response,
                    sources=self._chunks_to_sources(retrieved_chunks),
                    metadata={"raw_response": llm_response[:500]},
                )

            response_type = parsed.get("type")

            # Handle final response
            if response_type == "final":
                final_message = parsed.get("message", "")

                duration = (datetime.utcnow() - start_time).total_seconds()
                logger.info(f"Chat completed (final): duration={duration:.2f}s")

                return ChatResponse(
                    message=final_message,
                    sources=self._chunks_to_sources(retrieved_chunks),
                    metadata={
                        "duration_seconds": duration,
                        "chunks_used": len(retrieved_chunks),
                    },
                )

            # Handle tool call
            elif response_type == "tool":
                tool_name = parsed.get("name")
                tool_args = parsed.get("args", {})

                if not tool_name:
                    return ChatResponse(
                        message="Fehler: Tool-Name fehlt in der Antwort",
                        sources=self._chunks_to_sources(retrieved_chunks),
                    )

                logger.info(f"Tool call: {tool_name} with args {tool_args}")

                # Create tool call
                tool_call = ToolCall(name=tool_name, args=tool_args)

                # Execute tool
                tool_result = await ToolRegistry.execute(
                    tool_call=tool_call,
                    user_id=self.user_id,
                    tenant_id=self.tenant_id,
                    user_scopes=self.user_scopes,
                    skip_confirmation=skip_confirmation,
                )

                # Check if confirmation is required
                if tool_result.requires_confirmation:
                    return ChatResponse(
                        message=tool_result.confirmation_message
                        or "Bestätigung erforderlich",
                        sources=self._chunks_to_sources(retrieved_chunks),
                        tool_call={
                            "name": tool_name,
                            "args": tool_args,
                            "validated_args": (
                                tool_result.data.get("validated_args")
                                if tool_result.data
                                else tool_args
                            ),
                        },
                        requires_confirmation=True,
                        confirmation_message=tool_result.confirmation_message,
                    )

                # Tool failed
                if not tool_result.success:
                    error_message = (
                        f"Tool-Ausführung fehlgeschlagen: {tool_result.error}"
                    )
                    return ChatResponse(
                        message=error_message,
                        sources=self._chunks_to_sources(retrieved_chunks),
                        tool_call={
                            "name": tool_name,
                            "args": tool_args,
                            "error": tool_result.error,
                        },
                    )

                # Tool succeeded - Generate final response with tool result
                tool_result_text = json.dumps(
                    tool_result.data, ensure_ascii=False, indent=2
                )

                final_messages = messages + [
                    {
                        "role": "assistant",
                        "content": json.dumps(parsed, ensure_ascii=False),
                    },
                    {
                        "role": "user",
                        "content": f"Tool-Ergebnis:\n{tool_result_text}\n\nErstelle eine abschließende Antwort für den Benutzer.",
                    },
                ]

                final_response = await self._call_llm(final_messages)
                final_parsed = self._extract_json_from_text(final_response)

                final_message = (
                    final_parsed.get("message", final_response)
                    if final_parsed
                    else final_response
                )

                # Extract UI commands from tool result
                ui_commands = []
                if tool_result.data and "ui_command" in tool_result.data:
                    ui_cmd = tool_result.data["ui_command"]
                    ui_commands.append(UICommand(type=ui_cmd["type"], payload=ui_cmd))

                duration = (datetime.utcnow() - start_time).total_seconds()
                logger.info(f"Chat completed (tool): duration={duration:.2f}s")

                return ChatResponse(
                    message=final_message,
                    sources=self._chunks_to_sources(retrieved_chunks),
                    tool_call={
                        "name": tool_name,
                        "args": tool_args,
                        "result": tool_result.data,
                    },
                    ui_commands=ui_commands,
                    metadata={
                        "duration_seconds": duration,
                        "chunks_used": len(retrieved_chunks),
                        "tool_executed": True,
                    },
                )

            else:
                # Unknown type
                logger.warning(f"Unknown response type: {response_type}")
                return ChatResponse(
                    message=f"Unbekannter Antworttyp: {response_type}",
                    sources=self._chunks_to_sources(retrieved_chunks),
                    metadata={"raw_response": llm_response[:500]},
                )

        except Exception as e:
            logger.error(f"Chat orchestration failed: {e}", exc_info=True)

            # Log error to audit
            try:
                await self.audit_service.log_action(
                    user_id=self.user_id,
                    action="ai_chat_error",
                    details={
                        "message": message,
                        "error": str(e),
                    },
                    success=False,
                )
            except Exception as audit_error:
                logger.error(f"Failed to log audit: {audit_error}")

            return ChatResponse(
                message=f"Entschuldigung, es ist ein Fehler aufgetreten: {str(e)}",
                sources=[],
                metadata={"error": str(e)},
            )

    def _chunks_to_sources(self, chunks: List[RetrievedChunk]) -> List[Source]:
        """Convert retrieved chunks to Source objects"""
        sources = []
        for chunk in chunks:
            sources.append(
                Source(
                    id=chunk.chunk.id,
                    title=chunk.chunk.section or chunk.chunk.source,
                    snippet=(
                        chunk.chunk.content[:200] + "..."
                        if len(chunk.chunk.content) > 200
                        else chunk.chunk.content
                    ),
                    score=chunk.score,
                    source_type=chunk.chunk.source_type,
                )
            )
        return sources
