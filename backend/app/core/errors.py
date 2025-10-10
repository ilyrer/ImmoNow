"""
Error Handling Module
"""
from typing import Union, List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response envelope"""
    detail: Union[str, List[Dict[str, Any]]]
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ValidationError(Exception):
    """Validation error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(Exception):
    """Not found error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ForbiddenError(Exception):
    """Forbidden error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ConflictError(Exception):
    """Conflict error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class UnauthorizedError(Exception):
    """Unauthorized error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class RateLimitError(Exception):
    """Rate limit error exception"""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)
