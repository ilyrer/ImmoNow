"""
ImmoNow - Ollama Client
REST API wrapper for local Ollama LLM inference
"""

import json
import logging
import time
from typing import Dict, List, Optional, Any
import httpx
from pydantic import BaseModel, Field

from app.core.ai_config import get_ai_config
from app.core.errors import ExternalServiceError


logger = logging.getLogger(__name__)


# Pydantic Models
class OllamaMessage(BaseModel):
    """Ollama chat message"""

    role: str = Field(..., description="Message role: system, user, assistant")
    content: str = Field(..., description="Message content")


class OllamaChatRequest(BaseModel):
    """Ollama chat request"""

    model: str = Field(..., description="Model name")
    messages: List[OllamaMessage] = Field(..., description="Chat messages")
    stream: bool = Field(default=False, description="Stream response")
    options: Optional[Dict[str, Any]] = Field(default=None, description="Model options")


class OllamaChatResponse(BaseModel):
    """Ollama chat response"""

    model: str
    created_at: str
    message: OllamaMessage
    done: bool
    total_duration: Optional[int] = None
    load_duration: Optional[int] = None
    prompt_eval_count: Optional[int] = None
    eval_count: Optional[int] = None


class OllamaEmbeddingRequest(BaseModel):
    """Ollama embedding request"""

    model: str = Field(..., description="Model name")
    prompt: str = Field(..., description="Text to embed")


class OllamaEmbeddingResponse(BaseModel):
    """Ollama embedding response"""

    embedding: List[float]


class OllamaClient:
    """
    Ollama REST API Client

    Handles communication with local Ollama server for:
    - Chat completions (DeepSeek R1 8B)
    - Text embeddings (nomic-embed-text)
    """

    def __init__(self):
        self.config = get_ai_config()
        self.base_url = self.config.ollama_base_url
        self.chat_model = self.config.ollama_chat_model
        self.embedding_model = self.config.ollama_embedding_model
        self.timeout = self.config.ollama_timeout

        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout),
            headers={"Content-Type": "application/json"},
        )

        logger.info(
            f"OllamaClient initialized: "
            f"host={self.base_url}, "
            f"chat_model={self.chat_model}, "
            f"embedding_model={self.embedding_model}"
        )

    async def health_check(self) -> bool:
        """
        Check if Ollama is reachable

        Returns:
            bool: True if Ollama is healthy
        """
        try:
            response = await self.client.get("/api/tags", timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        List all available models

        Returns:
            List of model info dicts
        """
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            raise ExternalServiceError(
                service="ollama", message=f"Failed to list models: {str(e)}"
            )

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        stream: bool = False,
    ) -> str:
        """
        Generate chat completion

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Override default model
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Max tokens to generate
            top_p: Top-p (nucleus) sampling
            stream: Stream response (not yet implemented)

        Returns:
            Generated text response
        """
        start_time = time.time()

        # Build options
        options = {}
        if temperature is not None:
            options["temperature"] = temperature
        else:
            options["temperature"] = self.config.ollama_temperature

        if max_tokens is not None:
            options["num_predict"] = max_tokens

        if top_p is not None:
            options["top_p"] = top_p
        else:
            options["top_p"] = self.config.ollama_top_p

        options["num_ctx"] = self.config.ollama_num_ctx
        options["repeat_penalty"] = self.config.ollama_repeat_penalty

        # Build request
        ollama_messages = [
            OllamaMessage(role=msg["role"], content=msg["content"]) for msg in messages
        ]

        request = OllamaChatRequest(
            model=model or self.chat_model,
            messages=ollama_messages,
            stream=stream,
            options=options if options else None,
        )

        try:
            logger.info(
                f"Ollama chat request: model={request.model}, "
                f"messages={len(messages)}, options={options}"
            )

            response = await self.client.post(
                "/api/chat", json=request.model_dump(exclude_none=True)
            )
            response.raise_for_status()

            data = response.json()
            chat_response = OllamaChatResponse(**data)

            elapsed = time.time() - start_time
            logger.info(
                f"Ollama chat completed: "
                f"elapsed={elapsed:.2f}s, "
                f"prompt_tokens={chat_response.prompt_eval_count}, "
                f"completion_tokens={chat_response.eval_count}"
            )

            return chat_response.message.content

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Ollama HTTP error: {e.response.status_code} - {e.response.text}"
            )
            raise ExternalServiceError(
                service="ollama",
                message=f"HTTP error {e.response.status_code}: {e.response.text}",
            )
        except Exception as e:
            logger.error(f"Ollama chat failed: {e}", exc_info=True)
            raise ExternalServiceError(
                service="ollama", message=f"Chat generation failed: {str(e)}"
            )

    async def generate_embeddings(
        self, texts: List[str], model: Optional[str] = None
    ) -> List[List[float]]:
        """
        Generate embeddings for text(s)

        Args:
            texts: List of texts to embed
            model: Override default embedding model

        Returns:
            List of embedding vectors
        """
        start_time = time.time()
        model_name = model or self.embedding_model

        try:
            embeddings = []

            for text in texts:
                request = OllamaEmbeddingRequest(model=model_name, prompt=text)

                response = await self.client.post(
                    "/api/embeddings", json=request.model_dump()
                )
                response.raise_for_status()

                data = response.json()
                embed_response = OllamaEmbeddingResponse(**data)
                embeddings.append(embed_response.embedding)

            elapsed = time.time() - start_time
            logger.info(
                f"Ollama embeddings generated: "
                f"count={len(texts)}, elapsed={elapsed:.2f}s"
            )

            return embeddings

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Ollama HTTP error: {e.response.status_code} - {e.response.text}"
            )
            raise ExternalServiceError(
                service="ollama",
                message=f"HTTP error {e.response.status_code}: {e.response.text}",
            )
        except Exception as e:
            logger.error(f"Ollama embeddings failed: {e}", exc_info=True)
            raise ExternalServiceError(
                service="ollama", message=f"Embedding generation failed: {str(e)}"
            )

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Singleton instance
_ollama_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """Get Ollama client singleton"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client
