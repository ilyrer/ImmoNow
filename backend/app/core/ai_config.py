"""
ImmoNow - Local AI Configuration
Environment variables and settings for Ollama + Qdrant integration
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class AIConfig(BaseSettings):
    """Local AI System Configuration"""

    # Ollama Configuration
    ollama_host: str = Field(
        default="http://localhost:11434", description="Ollama API host URL"
    )
    ollama_chat_model: str = Field(
        default="deepseek-r1:8b",
        description="Chat model name (e.g., deepseek-r1:8b, llama3.1:8b)",
    )
    ollama_embedding_model: str = Field(
        default="nomic-embed-text", description="Embedding model name"
    )
    ollama_timeout: int = Field(
        default=120, description="Ollama request timeout in seconds"
    )
    ollama_num_ctx: int = Field(
        default=8192, description="Context window size (tokens)"
    )
    ollama_temperature: float = Field(
        default=0.7, description="Temperature for generation (0.0-1.0)"
    )
    ollama_top_p: float = Field(default=0.9, description="Top-p (nucleus sampling)")
    ollama_repeat_penalty: float = Field(
        default=1.1, description="Repeat penalty (1.0 = no penalty)"
    )

    # Qdrant Configuration
    qdrant_host: str = Field(default="localhost", description="Qdrant host")
    qdrant_port: int = Field(default=6333, description="Qdrant port")
    qdrant_grpc_port: int = Field(
        default=6334, description="Qdrant gRPC port (optional)"
    )
    qdrant_api_key: Optional[str] = Field(
        default=None, description="Qdrant API key (for cloud)"
    )
    qdrant_timeout: int = Field(
        default=30, description="Qdrant request timeout in seconds"
    )

    # RAG Configuration
    rag_chunk_size: int = Field(
        default=600, description="Document chunk size in tokens"
    )
    rag_chunk_overlap: int = Field(default=100, description="Overlap between chunks")
    rag_top_k: int = Field(default=5, description="Number of chunks to retrieve")
    rag_score_threshold: float = Field(
        default=0.5, description="Minimum similarity score (0.0-1.0)"
    )
    rag_rerank_enabled: bool = Field(
        default=False, description="Enable reranking of retrieved chunks"
    )

    # Tool Calling Configuration
    tool_calling_enabled: bool = Field(
        default=True, description="Enable tool calling feature"
    )
    tool_max_retries: int = Field(
        default=2, description="Max retries for tool call JSON parsing"
    )
    tool_confirmation_required: bool = Field(
        default=True, description="Require confirmation for critical actions"
    )
    tool_timeout: int = Field(
        default=30, description="Tool execution timeout in seconds"
    )

    # Chat Configuration
    chat_max_history: int = Field(
        default=10, description="Max number of messages in chat history"
    )
    chat_system_prompt: str = Field(
        default="""Du bist ein intelligenter Assistent für ImmoNow, eine Immobilien-Management-Plattform.

Du kannst:
- Fragen zu Immobilien, Kontakten, Tasks und Dokumenten beantworten
- System-Aktionen über Tools ausführen (Tasks erstellen, Kontakte anlegen, etc.)
- Kontext aus der Wissensdatenbank nutzen

Antworte IMMER in einem der folgenden JSON-Formate:

1. Finale Antwort:
{"type": "final", "message": "Deine Antwort hier"}

2. Tool-Aufruf:
{"type": "tool", "name": "create_task", "args": {"title": "...", "due_date": "..."}}

Sei präzise, professionell und hilfsbereit.""",
        description="System prompt for chat",
    )

    # Performance Configuration
    enable_caching: bool = Field(
        default=True, description="Enable response caching (Redis)"
    )
    cache_ttl: int = Field(default=3600, description="Cache TTL in seconds")
    enable_async_ingestion: bool = Field(
        default=True, description="Enable async document ingestion"
    )

    # Logging Configuration
    ai_log_level: str = Field(
        default="INFO", description="Logging level for AI components"
    )
    ai_log_requests: bool = Field(
        default=True, description="Log all AI requests/responses"
    )
    ai_log_tool_calls: bool = Field(default=True, description="Log all tool calls")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def qdrant_url(self) -> str:
        """Full Qdrant URL"""
        return f"http://{self.qdrant_host}:{self.qdrant_port}"

    @property
    def ollama_base_url(self) -> str:
        """Ollama base URL"""
        return self.ollama_host.rstrip("/")


# Singleton instance
_ai_config: Optional[AIConfig] = None


def get_ai_config() -> AIConfig:
    """Get AI configuration singleton"""
    global _ai_config
    if _ai_config is None:
        _ai_config = AIConfig()
    return _ai_config


def reload_ai_config():
    """Reload AI configuration from environment"""
    global _ai_config
    _ai_config = AIConfig()
    return _ai_config
