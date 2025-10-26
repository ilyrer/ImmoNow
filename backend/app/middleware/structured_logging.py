"""
Structured Logging Middleware and Configuration
"""
import logging
import uuid
import time
from typing import Optional, Dict, Any
from contextvars import ContextVar
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json
from datetime import datetime

# Context variables for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
tenant_id_var: ContextVar[Optional[str]] = ContextVar('tenant_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured logging with request tracking"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = logging.getLogger("immonow.request")
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
        
        # Extract tenant and user info from request
        tenant_id = self._extract_tenant_id(request)
        user_id = self._extract_user_id(request)
        
        if tenant_id:
            tenant_id_var.set(tenant_id)
        if user_id:
            user_id_var.set(user_id)
        
        # Start timing
        start_time = time.time()
        
        # Log request start
        self.logger.info(
            "Request started",
            extra={
                "request_id": request_id,
                "tenant_id": tenant_id,
                "user_id": user_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "event_type": "request_start"
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log request completion
            self.logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "event_type": "request_complete"
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time
            
            # Log request error
            self.logger.error(
                "Request failed",
                extra={
                    "request_id": request_id,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "method": request.method,
                    "url": str(request.url),
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "duration_ms": round(duration * 1000, 2),
                    "event_type": "request_error"
                },
                exc_info=True
            )
            
            raise
    
    def _extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from JWT token or headers"""
        # Try to get from Authorization header
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.security import decode_token
                token = auth_header.split(" ")[1]
                payload = decode_token(token)
                return payload.get("tenant_id")
            except Exception:
                pass
        
        # Try to get from X-Tenant-ID header
        return request.headers.get("X-Tenant-ID")
    
    def _extract_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from JWT token"""
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.security import decode_token
                token = auth_header.split(" ")[1]
                payload = decode_token(token)
                return payload.get("user_id")
            except Exception:
                pass
        return None


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        # Base log data
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add context variables
        if request_id := request_id_var.get():
            log_data["request_id"] = request_id
        
        if tenant_id := tenant_id_var.get():
            log_data["tenant_id"] = tenant_id
        
        if user_id := user_id_var.get():
            log_data["user_id"] = user_id
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                'filename', 'module', 'lineno', 'funcName', 'created',
                'msecs', 'relativeCreated', 'thread', 'threadName',
                'processName', 'process', 'getMessage', 'exc_info',
                'exc_text', 'stack_info'
            }:
                log_data[key] = value
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


class TenantContextFilter(logging.Filter):
    """Filter to add tenant context to log records"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Add tenant context to record
        if tenant_id := tenant_id_var.get():
            record.tenant_id = tenant_id
        
        if request_id := request_id_var.get():
            record.request_id = request_id
        
        if user_id := user_id_var.get():
            record.user_id = user_id
        
        return True


def setup_structured_logging():
    """Setup structured logging configuration"""
    
    # Create logger
    logger = logging.getLogger("immonow")
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Console handler with structured formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(StructuredFormatter())
    console_handler.addFilter(TenantContextFilter())
    logger.addHandler(console_handler)
    
    # File handler for application logs
    file_handler = logging.handlers.RotatingFileHandler(
        "./logs/app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(StructuredFormatter())
    file_handler.addFilter(TenantContextFilter())
    logger.addHandler(file_handler)
    
    # Security logger for audit events
    security_logger = logging.getLogger("immonow.security")
    security_logger.setLevel(logging.INFO)
    
    security_handler = logging.handlers.RotatingFileHandler(
        "./logs/security.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    security_handler.setFormatter(StructuredFormatter())
    security_handler.addFilter(TenantContextFilter())
    security_logger.addHandler(security_handler)
    
    # Request logger
    request_logger = logging.getLogger("immonow.request")
    request_logger.setLevel(logging.INFO)
    
    request_handler = logging.handlers.RotatingFileHandler(
        "./logs/requests.log",
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=3
    )
    request_handler.setFormatter(StructuredFormatter())
    request_handler.addFilter(TenantContextFilter())
    request_logger.addHandler(request_handler)
    
    # Set log levels for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("django").setLevel(logging.WARNING)
    
    return logger


def log_audit_event(
    event_type: str,
    resource_type: str,
    resource_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None
):
    """Log audit events for compliance and security"""
    
    logger = logging.getLogger("immonow.security")
    
    audit_data = {
        "event_type": event_type,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_category": "audit"
    }
    
    if details:
        audit_data["details"] = details
    
    if user_id:
        audit_data["user_id"] = user_id
    elif user_id_var.get():
        audit_data["user_id"] = user_id_var.get()
    
    if tenant_id:
        audit_data["tenant_id"] = tenant_id
    elif tenant_id_var.get():
        audit_data["tenant_id"] = tenant_id_var.get()
    
    logger.info("Audit event", extra=audit_data)


def log_business_event(
    event_type: str,
    event_data: Dict[str, Any],
    level: str = "INFO"
):
    """Log business events for analytics and monitoring"""
    
    logger = logging.getLogger("immonow.business")
    
    business_data = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_category": "business",
        **event_data
    }
    
    # Add context
    if tenant_id := tenant_id_var.get():
        business_data["tenant_id"] = tenant_id
    
    if user_id := user_id_var.get():
        business_data["user_id"] = user_id
    
    if request_id := request_id_var.get():
        business_data["request_id"] = request_id
    
    getattr(logger, level.lower())("Business event", extra=business_data)


def log_performance_metric(
    metric_name: str,
    value: float,
    unit: str = "ms",
    tags: Optional[Dict[str, str]] = None
):
    """Log performance metrics"""
    
    logger = logging.getLogger("immonow.metrics")
    
    metric_data = {
        "metric_name": metric_name,
        "value": value,
        "unit": unit,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_category": "metric"
    }
    
    if tags:
        metric_data["tags"] = tags
    
    # Add context
    if tenant_id := tenant_id_var.get():
        metric_data["tenant_id"] = tenant_id
    
    if request_id := request_id_var.get():
        metric_data["request_id"] = request_id
    
    logger.info("Performance metric", extra=metric_data)


def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    level: str = "ERROR"
):
    """Log errors with context"""
    
    logger = logging.getLogger("immonow.error")
    
    error_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_category": "error"
    }
    
    if context:
        error_data["context"] = context
    
    # Add context
    if tenant_id := tenant_id_var.get():
        error_data["tenant_id"] = tenant_id
    
    if user_id := user_id_var.get():
        error_data["user_id"] = user_id
    
    if request_id := request_id_var.get():
        error_data["request_id"] = request_id
    
    getattr(logger, level.lower())("Error occurred", extra=error_data, exc_info=True)


# Utility functions for services
def get_current_request_id() -> Optional[str]:
    """Get current request ID"""
    return request_id_var.get()


def get_current_tenant_id() -> Optional[str]:
    """Get current tenant ID"""
    return tenant_id_var.get()


def get_current_user_id() -> Optional[str]:
    """Get current user ID"""
    return user_id_var.get()


def set_tenant_context(tenant_id: str, user_id: Optional[str] = None):
    """Set tenant context for logging"""
    tenant_id_var.set(tenant_id)
    if user_id:
        user_id_var.set(user_id)
