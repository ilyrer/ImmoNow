"""
Core Settings Configuration
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file="env.local",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    DEBUG: bool = Field(default=False, env="DEBUG")
    SECRET_KEY: str = Field(
        default="django-insecure-change-me-in-production", env="SECRET_KEY"
    )

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./cim_backend.db", env="DATABASE_URL")

    # JWT
    JWT_SECRET_KEY: str = Field(
        default="jwt-secret-change-me-in-production", env="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=480, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )  # 8 hours

    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:3000", env="CORS_ORIGINS")

    # File Storage
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(
        default=None, env="AWS_SECRET_ACCESS_KEY"
    )
    AWS_S3_BUCKET: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    AWS_S3_REGION: str = Field(default="eu-central-1", env="AWS_S3_REGION")
    MAX_FILE_SIZE: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds

    # Redis (for caching and rate limiting)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")

    # Email
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    # Stripe Settings
    STRIPE_SECRET_KEY: str = Field(default="", env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", env="STRIPE_WEBHOOK_SECRET")
    STRIPE_PRICE_FREE: Optional[str] = Field(default=None, env="STRIPE_PRICE_FREE")
    STRIPE_PRICE_STARTER: Optional[str] = Field(
        default=None, env="STRIPE_PRICE_STARTER"
    )
    STRIPE_PRICE_PRO: Optional[str] = Field(default=None, env="STRIPE_PRICE_PRO")
    STRIPE_PRICE_ENTERPRISE: Optional[str] = Field(
        default=None, env="STRIPE_PRICE_ENTERPRISE"
    )

    # Frontend URL
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")

    # AI/LLM Configuration
    AI_PROVIDER: str = Field(default="openrouter", env="AI_PROVIDER")
    
    # OpenRouter
    OPENROUTER_API_KEY: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL"
    )
    OPENROUTER_MODEL: str = Field(
        default="deepseek/deepseek-chat-v3.1:free", env="OPENROUTER_MODEL"
    )
    OPENROUTER_TIMEOUT: int = Field(default=60, env="OPENROUTER_TIMEOUT")
    OPENROUTER_MAX_TOKENS: int = Field(default=4096, env="OPENROUTER_MAX_TOKENS")
    OPENROUTER_TEMPERATURE: float = Field(default=0.7, env="OPENROUTER_TEMPERATURE")
    
    # OpenAI Direct
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")
    OPENAI_BASE_URL: str = Field(
        default="https://api.openai.com/v1", env="OPENAI_BASE_URL"
    )
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: Optional[str] = Field(default=None, env="AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT: Optional[str] = Field(
        default=None, env="AZURE_OPENAI_ENDPOINT"
    )
    AZURE_OPENAI_DEPLOYMENT: str = Field(default="gpt-4", env="AZURE_OPENAI_DEPLOYMENT")
    AZURE_OPENAI_API_VERSION: str = Field(
        default="2024-02-15-preview", env="AZURE_OPENAI_API_VERSION"
    )
    
    # AI General Settings
    AI_RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(
        default=60, env="AI_RATE_LIMIT_REQUESTS_PER_MINUTE"
    )
    AI_MAX_RETRIES: int = Field(default=3, env="AI_MAX_RETRIES")
    
    # Site Info (for OpenRouter)
    SITE_URL: str = Field(default="https://immonow.com", env="SITE_URL")
    SITE_NAME: str = Field(default="ImmoNow Dashboard", env="SITE_NAME")
    
    # Geodata APIs (for AVM)
    GOOGLE_MAPS_API_KEY: Optional[str] = Field(default=None, env="GOOGLE_MAPS_API_KEY")
    OPENROUTESERVICE_API_KEY: Optional[str] = Field(
        default=None, env="OPENROUTESERVICE_API_KEY"
    )


# Global settings instance
settings = Settings()
