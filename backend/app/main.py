"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
import logging
import os
from datetime import datetime, date
from typing import Union, List, Dict, Any
import json

# Custom JSON Encoder for datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

# Setup Django FIRST before importing anything else
import django
from django.conf import settings as django_settings

# Configure Django settings
django_settings.configure(
    DEBUG=True,
    SECRET_KEY="django-insecure-change-me-in-production",
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': 'db.sqlite3',
        }
    },
    INSTALLED_APPS=[
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.admin',
        'app',
    ],
    MIDDLEWARE=[
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ],
    ROOT_URLCONF='backend.urls',
    LANGUAGE_CODE='de-de',
    TIME_ZONE='Europe/Berlin',
    USE_I18N=True,
    USE_TZ=True,
    STATIC_URL='/static/',
    MEDIA_URL='/media/',
    ALLOWED_HOSTS=['*'],
    SECURE_BROWSER_XSS_FILTER=True,
    SECURE_CONTENT_TYPE_NOSNIFF=True,
    LOGGING={
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
)

# Setup Django
django.setup()

# Now import FastAPI components
from app.core.settings import settings
from app.core.errors import ErrorResponse, ValidationError, NotFoundError, ForbiddenError
from app.core.json_response import CustomJSONResponse
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting CIM Backend API")
    yield
    # Shutdown
    logger.info("Shutting down CIM Backend API")


def create_app() -> FastAPI:
    """Create FastAPI application"""
    
    # Custom default function for JSON encoding
    def custom_json_default(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    app = FastAPI(
        title="CIM Backend API",
        description="Central Information Model Backend API für Immobilienverwaltung",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
        default_response_class=CustomJSONResponse,  # Use custom JSON response
        tags_metadata=[
            {
                "name": "documents",
                "description": "Dokumentenverwaltung mit Ordnerstruktur und Upload",
            },
            {
                "name": "tasks",
                "description": "Task-Management und Kanban-Board",
            },
            {
                "name": "employees",
                "description": "Mitarbeiterverwaltung",
            },
            {
                "name": "investor",
                "description": "Investor-Portal und Portfolio-Management",
            },
            {
                "name": "cim",
                "description": "Central Information Model - Zentrale Übersicht",
            },
            {
                "name": "avm",
                "description": "Automatische Wertermittlung",
            },
            {
                "name": "appointments",
                "description": "Terminplaner und Kalender",
            },
            {
                "name": "properties",
                "description": "Immobilienverwaltung",
            },
            {
                "name": "contacts",
                "description": "Kontaktverwaltung",
            },
            {
                "name": "analytics",
                "description": "Analytics und Berichte",
            },
        ],
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler
    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return CustomJSONResponse(
            status_code=400,
            content=ErrorResponse(
                detail=exc.detail,
                code="validation_error",
                timestamp=datetime.utcnow()
            ).model_dump()
        )

    @app.exception_handler(NotFoundError)
    async def not_found_exception_handler(request: Request, exc: NotFoundError):
        return CustomJSONResponse(
            status_code=404,
            content=ErrorResponse(
                detail=exc.detail,
                code="not_found",
                timestamp=datetime.utcnow()
            ).model_dump()
        )

    @app.exception_handler(ForbiddenError)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenError):
        return CustomJSONResponse(
            status_code=403,
            content=ErrorResponse(
                detail=exc.detail,
                code="forbidden",
                timestamp=datetime.utcnow()
            ).model_dump()
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return CustomJSONResponse(
            status_code=500,
            content=ErrorResponse(
                detail="Internal server error",
                code="internal_error",
                timestamp=datetime.utcnow()
            ).model_dump()
        )

    # Health Check
    @app.get("/healthz", tags=["health"])
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy", "timestamp": datetime.utcnow()}

    # Mount API Router
    app.include_router(api_router, prefix="/api/v1")
    
    # Custom Response Handler for datetime serialization
    @app.middleware("http")
    async def serialize_datetime_middleware(request: Request, call_next):
        """Middleware to ensure datetime objects are properly serialized"""
        response = await call_next(request)
        return response

    return app


# Create app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )