"""
Local AI Chat Endpoints - Ollama + RAG + Tool Calling
"""

import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from fastapi import APIRouter, Depends, Body, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user, get_tenant_id
from app.core.security import TokenData
from app.services.ai_orchestrator_service import (
    AiOrchestrator,
    ChatMessage,
    ChatContext,
    ChatResponse,
)
from app.services.rag_service import RagService, IngestionResult
from app.services.ai.ollama_client import get_ollama_client
from app.tools import ToolRegistry


logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class ChatRequest(BaseModel):
    """Chat request"""

    message: str = Field(..., description="User message")
    history: Optional[List[ChatMessage]] = Field(
        default=None, description="Chat history"
    )
    context: Optional[ChatContext] = Field(
        default=None, description="Optional context (properties, contacts, etc.)"
    )
    skip_rag: bool = Field(default=False, description="Skip RAG retrieval")


class ConfirmToolRequest(BaseModel):
    """Confirm tool execution"""

    message: str = Field(..., description="Original user message")
    tool_call: Dict[str, Any] = Field(..., description="Tool call to confirm")
    history: Optional[List[ChatMessage]] = None


class IngestRequest(BaseModel):
    """Ingest document request"""

    source: str = Field(..., description="Source identifier (file path, URL)")
    content: str = Field(..., description="Document content")
    source_type: str = Field(
        default="docs", description="Source type (docs, schema, entity)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata"
    )


class IngestFileRequest(BaseModel):
    """Ingest file request"""

    source_type: str = Field(default="docs", description="Source type")


class HealthResponse(BaseModel):
    """Health check response"""

    status: str
    ollama: bool
    qdrant: bool
    collection_exists: bool
    tenant_chunk_count: int
    models: List[str]


class SourcesResponse(BaseModel):
    """List of sources"""

    sources: List[Dict[str, Any]]
    count: int


class ToolsResponse(BaseModel):
    """Available tools"""

    tools: List[Dict[str, Any]]
    count: int


# Endpoints


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Chat with AI assistant (RAG + Tool Calling)

    Workflow:
    1. Retrieve RAG context
    2. Call Ollama LLM
    3. Parse response (final or tool call)
    4. Execute tool if needed
    5. Return response with sources and UI commands
    """
    try:
        orchestrator = AiOrchestrator(
            tenant_id=tenant_id,
            user_id=current_user.user_id,
            user_scopes=current_user.scopes,
        )

        response = await orchestrator.chat(
            message=request.message,
            history=request.history,
            context=request.context,
            skip_rag=request.skip_rag,
        )

        return response

    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/chat/confirm", response_model=ChatResponse)
async def confirm_tool_execution(
    request: ConfirmToolRequest,
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Confirm and execute a tool call that requires confirmation
    """
    try:
        orchestrator = AiOrchestrator(
            tenant_id=tenant_id,
            user_id=current_user.user_id,
            user_scopes=current_user.scopes,
        )

        # Re-run chat with skip_confirmation=True
        response = await orchestrator.chat(
            message=request.message,
            history=request.history,
            skip_confirmation=True,
        )

        return response

    except Exception as e:
        logger.error(f"Tool confirmation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Tool confirmation failed: {str(e)}"
        )


@router.post("/ingest", response_model=IngestionResult)
async def ingest_document(
    request: IngestRequest,
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Ingest a document into RAG vector store
    """
    try:
        rag_service = RagService(tenant_id)

        result = await rag_service.ingest_document(
            source=request.source,
            content=request.content,
            source_type=request.source_type,
            metadata=request.metadata,
        )

        return result

    except Exception as e:
        logger.error(f"Document ingestion failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Document ingestion failed: {str(e)}"
        )


@router.post("/ingest/file", response_model=IngestionResult)
async def ingest_file(
    file: UploadFile = File(...),
    source_type: str = Body("docs", embed=True),
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Ingest a file upload into RAG vector store
    """
    try:
        # Read file content
        content = await file.read()
        text_content = content.decode("utf-8")

        rag_service = RagService(tenant_id)

        result = await rag_service.ingest_document(
            source=file.filename or "uploaded_file",
            content=text_content,
            source_type=source_type,
            metadata={
                "filename": file.filename,
                "content_type": file.content_type,
            },
        )

        return result

    except Exception as e:
        logger.error(f"File ingestion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File ingestion failed: {str(e)}")


@router.get("/sources", response_model=SourcesResponse)
async def list_sources(
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    List all ingested sources for current tenant
    """
    try:
        rag_service = RagService(tenant_id)
        sources = await rag_service.list_sources()

        return SourcesResponse(
            sources=sources,
            count=len(sources),
        )

    except Exception as e:
        logger.error(f"Failed to list sources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list sources: {str(e)}")


@router.delete("/sources/{source}")
async def delete_source(
    source: str,
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Delete a source and all its chunks
    """
    try:
        rag_service = RagService(tenant_id)
        deleted_count = await rag_service.delete_source(source)

        return {
            "source": source,
            "deleted_count": deleted_count,
            "message": f"Source '{source}' deleted",
        }

    except Exception as e:
        logger.error(f"Failed to delete source: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete source: {str(e)}"
        )


@router.post("/reindex")
async def reindex_collection(
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Recreate RAG collection (admin only)
    """
    # Check admin scope
    if "admin" not in current_user.scopes:
        raise HTTPException(status_code=403, detail="Admin scope required")

    try:
        rag_service = RagService(tenant_id)

        # Delete and recreate collection
        await rag_service.ensure_collection()

        return {
            "message": "Collection reindexed successfully",
            "tenant_id": tenant_id,
        }

    except Exception as e:
        logger.error(f"Reindex failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Reindex failed: {str(e)}")


@router.get("/tools", response_model=ToolsResponse)
async def list_tools(
    category: Optional[str] = None,
    current_user: TokenData = Depends(get_current_user),
):
    """
    List available tools for current user
    """
    try:
        tools = ToolRegistry.list_tools(
            category=category,
            scopes=current_user.scopes,
        )

        tools_data = [
            {
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "parameters": [
                    {
                        "name": p.name,
                        "type": p.type,
                        "description": p.description,
                        "required": p.required,
                        "default": p.default,
                        "enum": p.enum,
                    }
                    for p in t.parameters
                ],
                "requires_confirmation": t.requires_confirmation,
                "required_scopes": t.required_scopes,
            }
            for t in tools
        ]

        return ToolsResponse(
            tools=tools_data,
            count=len(tools_data),
        )

    except Exception as e:
        logger.error(f"Failed to list tools: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list tools: {str(e)}")


@router.get("/health", response_model=HealthResponse)
async def health_check(
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Check health of AI system (Ollama + Qdrant + Models)
    """
    try:
        # Check Ollama
        ollama_client = get_ollama_client()
        ollama_healthy = await ollama_client.health_check()

        # Get models
        models = []
        if ollama_healthy:
            try:
                model_list = await ollama_client.list_models()
                models = [m.get("name", "unknown") for m in model_list]
            except Exception as e:
                logger.error(f"Failed to list models: {e}")

        # Check RAG
        rag_service = RagService(tenant_id)
        rag_health = await rag_service.health_check()

        status = (
            "healthy"
            if (
                ollama_healthy
                and rag_health["qdrant"]
                and rag_health["collection_exists"]
            )
            else "degraded"
        )

        return HealthResponse(
            status=status,
            ollama=ollama_healthy,
            qdrant=rag_health["qdrant"],
            collection_exists=rag_health["collection_exists"],
            tenant_chunk_count=rag_health["tenant_chunk_count"],
            models=models,
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return HealthResponse(
            status="error",
            ollama=False,
            qdrant=False,
            collection_exists=False,
            tenant_chunk_count=0,
            models=[],
        )
