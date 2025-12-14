"""
ImmoNow - RAG (Retrieval-Augmented Generation) Service
Document ingestion, chunking, embedding, and retrieval using Qdrant
"""

import hashlib
import logging
import re
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchRequest,
)
from pydantic import BaseModel, Field

from app.core.ai_config import get_ai_config
from app.services.ai.ollama_client import get_ollama_client
from app.core.errors import ValidationError, NotFoundError


logger = logging.getLogger(__name__)


# Pydantic Models
class DocumentChunk(BaseModel):
    """A chunk of a document with metadata"""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str = Field(..., description="Chunk text content")
    source: str = Field(..., description="Source file/URL")
    source_type: str = Field(..., description="Type: docs, schema, entity")
    section: Optional[str] = Field(None, description="Section/header")
    chunk_index: int = Field(..., description="Index within source")
    tenant_id: str = Field(..., description="Tenant ID (multi-tenancy)")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RetrievedChunk(BaseModel):
    """A retrieved chunk with score"""

    chunk: DocumentChunk
    score: float = Field(..., description="Similarity score (0.0-1.0)")


class IngestionResult(BaseModel):
    """Result of document ingestion"""

    source: str
    chunks_created: int
    tenant_id: str
    duration_seconds: float
    success: bool
    error: Optional[str] = None


class RagService:
    """
    RAG Service for document ingestion and retrieval

    Features:
    - Multi-tenant isolation (separate collections or metadata filtering)
    - Document chunking with overlap
    - Embedding generation via Ollama
    - Vector storage in Qdrant
    - Semantic search with metadata filtering
    """

    COLLECTION_PREFIX = "immonow_docs"
    EMBEDDING_DIM = 768  # nomic-embed-text dimension

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.config = get_ai_config()
        self.ollama_client = get_ollama_client()

        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(
            host=self.config.qdrant_host,
            port=self.config.qdrant_port,
            timeout=self.config.qdrant_timeout,
        )

        # Collection name (shared across tenants, filtered by metadata)
        self.collection_name = self.COLLECTION_PREFIX

        logger.info(f"RagService initialized for tenant {tenant_id}")

    async def ensure_collection(self):
        """
        Ensure Qdrant collection exists
        """
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.collection_name not in collection_names:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")

                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.EMBEDDING_DIM,
                        distance=Distance.COSINE,
                    ),
                )

                # Create payload indexes for fast filtering
                self.qdrant_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="tenant_id",
                    field_schema="keyword",
                )
                self.qdrant_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="source_type",
                    field_schema="keyword",
                )

                logger.info(f"Collection {self.collection_name} created successfully")
            else:
                logger.debug(f"Collection {self.collection_name} already exists")

        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}", exc_info=True)
            raise

    def chunk_text(
        self,
        text: str,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[str]:
        """
        Split text into chunks with overlap

        Args:
            text: Input text
            chunk_size: Chunk size in characters (approx 0.25 tokens/char)
            chunk_overlap: Overlap between chunks

        Returns:
            List of text chunks
        """
        chunk_size = chunk_size or self.config.rag_chunk_size
        chunk_overlap = chunk_overlap or self.config.rag_chunk_overlap

        # Simple chunking by characters (can be improved with sentence boundaries)
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end].strip()

            if chunk:
                chunks.append(chunk)

            start = end - chunk_overlap

            if end >= len(text):
                break

        return chunks

    def chunk_markdown(self, text: str) -> List[Dict[str, Any]]:
        """
        Chunk markdown document by headers

        Returns:
            List of dicts with 'content' and 'section'
        """
        chunks = []
        current_section = "Introduction"
        current_content = []

        for line in text.split("\n"):
            # Check if header (# or ##)
            header_match = re.match(r"^(#{1,3})\s+(.+)$", line)

            if header_match:
                # Save previous section
                if current_content:
                    content = "\n".join(current_content).strip()
                    if content:
                        chunks.append(
                            {
                                "content": content,
                                "section": current_section,
                            }
                        )

                # Start new section
                current_section = header_match.group(2)
                current_content = []
            else:
                current_content.append(line)

        # Save last section
        if current_content:
            content = "\n".join(current_content).strip()
            if content:
                chunks.append(
                    {
                        "content": content,
                        "section": current_section,
                    }
                )

        return chunks

    async def ingest_document(
        self,
        source: str,
        content: str,
        source_type: str = "docs",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> IngestionResult:
        """
        Ingest a document into the vector store

        Args:
            source: Source identifier (file path, URL, etc.)
            content: Document content
            source_type: Type of source (docs, schema, entity)
            metadata: Additional metadata

        Returns:
            IngestionResult
        """
        start_time = datetime.utcnow()

        try:
            # Ensure collection exists
            await self.ensure_collection()

            # Chunk document (use markdown chunking for .md files)
            if source.endswith(".md"):
                md_chunks = self.chunk_markdown(content)
                chunks = []
                for i, chunk_data in enumerate(md_chunks):
                    doc_chunk = DocumentChunk(
                        content=chunk_data["content"],
                        source=source,
                        source_type=source_type,
                        section=chunk_data["section"],
                        chunk_index=i,
                        tenant_id=self.tenant_id,
                        metadata=metadata or {},
                    )
                    chunks.append(doc_chunk)
            else:
                # Simple text chunking
                text_chunks = self.chunk_text(content)
                chunks = []
                for i, text_chunk in enumerate(text_chunks):
                    doc_chunk = DocumentChunk(
                        content=text_chunk,
                        source=source,
                        source_type=source_type,
                        section=None,
                        chunk_index=i,
                        tenant_id=self.tenant_id,
                        metadata=metadata or {},
                    )
                    chunks.append(doc_chunk)

            if not chunks:
                logger.warning(f"No chunks created for {source}")
                return IngestionResult(
                    source=source,
                    chunks_created=0,
                    tenant_id=self.tenant_id,
                    duration_seconds=0.0,
                    success=True,
                )

            # Generate embeddings
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = await self.ollama_client.generate_embeddings(chunk_texts)

            # Create Qdrant points
            points = []
            for chunk, embedding in zip(chunks, embeddings):
                point = PointStruct(
                    id=chunk.id,
                    vector=embedding,
                    payload={
                        "content": chunk.content,
                        "source": chunk.source,
                        "source_type": chunk.source_type,
                        "section": chunk.section,
                        "chunk_index": chunk.chunk_index,
                        "tenant_id": chunk.tenant_id,
                        "metadata": chunk.metadata,
                        "created_at": chunk.created_at.isoformat(),
                    },
                )
                points.append(point)

            # Upsert to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points,
            )

            duration = (datetime.utcnow() - start_time).total_seconds()

            logger.info(
                f"Ingested document: source={source}, "
                f"chunks={len(chunks)}, duration={duration:.2f}s"
            )

            return IngestionResult(
                source=source,
                chunks_created=len(chunks),
                tenant_id=self.tenant_id,
                duration_seconds=duration,
                success=True,
            )

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Failed to ingest document {source}: {e}", exc_info=True)

            return IngestionResult(
                source=source,
                chunks_created=0,
                tenant_id=self.tenant_id,
                duration_seconds=duration,
                success=False,
                error=str(e),
            )

    async def retrieve_context(
        self,
        query: str,
        top_k: Optional[int] = None,
        source_type: Optional[str] = None,
        score_threshold: Optional[float] = None,
    ) -> List[RetrievedChunk]:
        """
        Retrieve relevant chunks for a query

        Args:
            query: Query text
            top_k: Number of chunks to retrieve
            source_type: Filter by source type
            score_threshold: Minimum similarity score

        Returns:
            List of RetrievedChunk
        """
        top_k = top_k or self.config.rag_top_k
        score_threshold = score_threshold or self.config.rag_score_threshold

        try:
            # Ensure collection exists
            await self.ensure_collection()

            # Generate query embedding
            query_embeddings = await self.ollama_client.generate_embeddings([query])
            query_embedding = query_embeddings[0]

            # Build filter (tenant + optional source_type)
            filter_conditions = [
                FieldCondition(
                    key="tenant_id",
                    match=MatchValue(value=self.tenant_id),
                )
            ]

            if source_type:
                filter_conditions.append(
                    FieldCondition(
                        key="source_type",
                        match=MatchValue(value=source_type),
                    )
                )

            filter_obj = Filter(must=filter_conditions)

            # Search in Qdrant
            search_result = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=top_k,
                query_filter=filter_obj,
                score_threshold=score_threshold,
            )

            # Convert to RetrievedChunk
            retrieved_chunks = []
            for scored_point in search_result:
                payload = scored_point.payload

                chunk = DocumentChunk(
                    id=str(scored_point.id),
                    content=payload["content"],
                    source=payload["source"],
                    source_type=payload["source_type"],
                    section=payload.get("section"),
                    chunk_index=payload["chunk_index"],
                    tenant_id=payload["tenant_id"],
                    metadata=payload.get("metadata", {}),
                    created_at=datetime.fromisoformat(payload["created_at"]),
                )

                retrieved_chunks.append(
                    RetrievedChunk(
                        chunk=chunk,
                        score=scored_point.score,
                    )
                )

            logger.info(
                f"Retrieved {len(retrieved_chunks)} chunks for query "
                f"(top_k={top_k}, threshold={score_threshold})"
            )

            return retrieved_chunks

        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}", exc_info=True)
            return []

    async def delete_source(self, source: str) -> int:
        """
        Delete all chunks from a specific source

        Args:
            source: Source identifier

        Returns:
            Number of chunks deleted
        """
        try:
            # Build filter
            filter_obj = Filter(
                must=[
                    FieldCondition(
                        key="tenant_id",
                        match=MatchValue(value=self.tenant_id),
                    ),
                    FieldCondition(
                        key="source",
                        match=MatchValue(value=source),
                    ),
                ]
            )

            # Delete points
            result = self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=filter_obj,
            )

            logger.info(
                f"Deleted chunks from source {source} (tenant {self.tenant_id})"
            )
            return 0  # Qdrant doesn't return count in delete result

        except Exception as e:
            logger.error(f"Failed to delete source {source}: {e}", exc_info=True)
            return 0

    async def list_sources(self) -> List[Dict[str, Any]]:
        """
        List all ingested sources for this tenant

        Returns:
            List of source info dicts
        """
        try:
            # Scroll through collection with tenant filter
            filter_obj = Filter(
                must=[
                    FieldCondition(
                        key="tenant_id",
                        match=MatchValue(value=self.tenant_id),
                    )
                ]
            )

            records, _ = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_obj,
                limit=1000,  # Adjust as needed
                with_payload=True,
                with_vectors=False,
            )

            # Group by source
            sources_map = {}
            for record in records:
                source = record.payload["source"]
                source_type = record.payload["source_type"]

                if source not in sources_map:
                    sources_map[source] = {
                        "source": source,
                        "source_type": source_type,
                        "chunk_count": 0,
                        "created_at": record.payload["created_at"],
                    }

                sources_map[source]["chunk_count"] += 1

            sources = list(sources_map.values())
            logger.info(f"Found {len(sources)} sources for tenant {self.tenant_id}")

            return sources

        except Exception as e:
            logger.error(f"Failed to list sources: {e}", exc_info=True)
            return []

    async def health_check(self) -> Dict[str, Any]:
        """
        Check RAG system health

        Returns:
            Health status dict
        """
        health = {
            "qdrant": False,
            "ollama": False,
            "collection_exists": False,
            "tenant_chunk_count": 0,
        }

        try:
            # Check Qdrant
            collections = self.qdrant_client.get_collections().collections
            health["qdrant"] = True

            collection_names = [c.name for c in collections]
            if self.collection_name in collection_names:
                health["collection_exists"] = True

                # Count tenant chunks
                filter_obj = Filter(
                    must=[
                        FieldCondition(
                            key="tenant_id",
                            match=MatchValue(value=self.tenant_id),
                        )
                    ]
                )

                result = self.qdrant_client.count(
                    collection_name=self.collection_name,
                    count_filter=filter_obj,
                )
                health["tenant_chunk_count"] = result.count

        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")

        try:
            # Check Ollama
            health["ollama"] = await self.ollama_client.health_check()
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")

        return health
