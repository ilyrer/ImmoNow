"""
LLM Schemas for Qwen/OpenRouter Integration
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class LLMRequest(BaseModel):
    """Request schema for general LLM queries"""
    prompt: str = Field(..., description="The prompt/question to send to the LLM")
    context: Optional[str] = Field(None, description="Additional context for the prompt")
    max_tokens: Optional[int] = Field(2048, description="Maximum tokens in response")
    temperature: Optional[float] = Field(0.7, description="Temperature for response generation")
    stream: Optional[bool] = Field(False, description="Whether to stream the response")


class LLMResponse(BaseModel):
    """Response schema for general LLM queries"""
    response: str = Field(..., description="The LLM response")
    tokens_used: int = Field(..., description="Number of tokens used")
    model: str = Field(..., description="Model used for generation")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DashboardQARequest(BaseModel):
    """Request schema for dashboard Q&A with predefined context"""
    question: str = Field(..., description="Question about dashboard KPIs or features")
    context_type: Optional[str] = Field("dashboard", description="Type of context (dashboard, cim, investor, etc.)")
    include_data: Optional[bool] = Field(True, description="Whether to include current data in context")


class DashboardQAResponse(BaseModel):
    """Response schema for dashboard Q&A"""
    answer: str = Field(..., description="Answer to the question")
    context_used: str = Field(..., description="Context that was used for the answer")
    related_kpis: Optional[List[str]] = Field(None, description="Related KPIs mentioned")
    tokens_used: int = Field(..., description="Number of tokens used")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LLMAuditLog(BaseModel):
    """Audit log entry for LLM requests"""
    user_id: str
    tenant_id: str
    request_type: str  # 'general' or 'dashboard_qa'
    prompt: str
    response: str
    tokens_used: int
    model: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
