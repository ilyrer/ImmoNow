"""
Core Settings Configuration
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    model_config = SettingsConfigDict(env_file="env.local", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")
    
    # Application
    DEBUG: bool = Field(default=False, env="DEBUG")
    SECRET_KEY: str = Field(default="django-insecure-change-me-in-production", env="SECRET_KEY")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./cim_backend.db", env="DATABASE_URL")
    
    # JWT
    JWT_SECRET_KEY: str = Field(default="jwt-secret-change-me-in-production", env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:3000", env="CORS_ORIGINS")
    
    # File Storage
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
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
    
    # Email Provider Configuration
    EMAIL_PROVIDER: str = Field(default="console", env="EMAIL_PROVIDER")
    EMAIL_ENABLED: bool = Field(default=True, env="EMAIL_ENABLED")
    DEFAULT_FROM_EMAIL: str = Field(default="noreply@immonow.com", env="DEFAULT_FROM_EMAIL")
    DEFAULT_FROM_NAME: str = Field(default="ImmoNow", env="DEFAULT_FROM_NAME")
    
    # SendGrid Configuration
    SENDGRID_API_KEY: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    SENDGRID_FROM_EMAIL: str = Field(default="noreply@immonow.com", env="SENDGRID_FROM_EMAIL")
    SENDGRID_FROM_NAME: str = Field(default="ImmoNow", env="SENDGRID_FROM_NAME")
    
    # Mailgun Configuration
    MAILGUN_API_KEY: Optional[str] = Field(default=None, env="MAILGUN_API_KEY")
    MAILGUN_DOMAIN: Optional[str] = Field(default=None, env="MAILGUN_DOMAIN")
    MAILGUN_FROM_EMAIL: str = Field(default="noreply@immonow.com", env="MAILGUN_FROM_EMAIL")
    MAILGUN_FROM_NAME: str = Field(default="ImmoNow", env="MAILGUN_FROM_NAME")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Stripe Settings
    STRIPE_SECRET_KEY: str = Field(default="", env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", env="STRIPE_WEBHOOK_SECRET")
    STRIPE_PRICE_FREE: Optional[str] = Field(default=None, env="STRIPE_PRICE_FREE")
    STRIPE_PRICE_STARTER: Optional[str] = Field(default=None, env="STRIPE_PRICE_STARTER")
    STRIPE_PRICE_PRO: Optional[str] = Field(default=None, env="STRIPE_PRICE_PRO")
    STRIPE_PRICE_ENTERPRISE: Optional[str] = Field(default=None, env="STRIPE_PRICE_ENTERPRISE")
    
    # Frontend URL
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")


# Global settings instance
settings = Settings()
