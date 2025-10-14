"""
LLM API Endpoints for Qwen/OpenRouter Integration
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
import uuid

from app.api.deps import (
    require_read_scope, require_write_scope,
    get_tenant_id, apply_rate_limit
)
from app.core.security import TokenData
from app.core.errors import ValidationError, ServiceError
from app.schemas.llm import (
    LLMRequest, LLMResponse, DashboardQARequest, DashboardQAResponse
)
from app.services.llm_service import LLMService

router = APIRouter()


@router.post("/ask", response_model=LLMResponse)
async def ask_llm_question(
    request: LLMRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Ask a general question to the LLM"""
    
    try:
        llm_service = LLMService(tenant_id)
        request_id = str(uuid.uuid4())
        
        response = await llm_service.ask_question(
            request=request,
            user_id=current_user.user_id,
            request_id=request_id
        )
        
        return response
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/dashboard_qa", response_model=DashboardQAResponse)
async def ask_dashboard_question(
    request: DashboardQARequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Ask a question about dashboard KPIs with predefined context"""
    
    try:
        llm_service = LLMService(tenant_id)
        request_id = str(uuid.uuid4())
        
        response = await llm_service.ask_dashboard_question(
            request=request,
            user_id=current_user.user_id,
            request_id=request_id
        )
        
        return response
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/health")
async def llm_health_check(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Health check for LLM service"""
    
    try:
        llm_service = LLMService(tenant_id)
        
        # Simple test to check if service is properly configured
        return {
            "status": "healthy",
            "model": llm_service.openrouter_model,
            "base_url": llm_service.openrouter_base_url,
            "rate_limit_enabled": True,
            "max_requests_per_minute": 10
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"LLM service unavailable: {str(e)}"
        )
