# ImmoNow - Lokales AI-System: Architektur

**Version**: 1.0  
**Datum**: 13.12.2025  
**Autor**: AI Platform Team

---

## Überblick

Das lokale AI-System von ImmoNow ist eine vollständig **offline-first**, **privacy-focused** Lösung für intelligente Immobilien-Management-Operationen. Es kombiniert:

- **Lokale LLM-Inference** (DeepSeek R1 8B via Ollama)
- **Retrieval-Augmented Generation (RAG)** mit Qdrant Vector Store
- **Strukturiertes Tool-Calling** für kontrollierte System-Aktionen
- **Multi-Tenancy** mit tenant-isoliertem Kontext
- **RBAC-gesicherte** Tool-Ausführung

### Designprinzipien

1. **Kein externer Cloud-LLM** - Alle AI-Operationen laufen lokal
2. **Keine UI-Automation** - Tools nutzen APIs, niemals DOM-Manipulation
3. **Validierung First** - Pydantic-validierte Inputs/Outputs überall
4. **Audit Everything** - Alle AI-Aktionen werden geloggt
5. **Fail Gracefully** - Robuste Error-Handling, keine Crashes

---

## System-Komponenten

### 1. Ollama (LLM Inference Engine)

**Rolle**: Lokaler LLM-Server für Chat & Embeddings

- **Image**: `ollama/ollama:latest`
- **Port**: 11434
- **Modelle**:
  - `deepseek-r1:8b` - Chat-Completion (8B Parameter)
  - `nomic-embed-text` - Text-Embeddings (768 Dimensionen)
- **API**: REST-basiert, OpenAI-kompatibel
- **GPU-Support**: Optional via NVIDIA Container Toolkit

**Konfiguration**:
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=deepseek-r1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_NUM_CTX=8192  # Context Window
OLLAMA_TEMPERATURE=0.7
```

**Health-Check**: `GET /api/tags`

---

### 2. Qdrant (Vector Database)

**Rolle**: Vektor-Speicher für RAG-Kontext

- **Image**: `qdrant/qdrant:latest`
- **Ports**: 6333 (REST), 6334 (gRPC)
- **Storage**: Persistent volume `qdrant_storage`
- **Collections**: 
  - `immonow_docs` - Shared collection mit `tenant_id` Filter

**Features**:
- **Cosine Similarity** für Vektor-Suche
- **Payload Indexing** für schnelle Filter (tenant_id, source_type)
- **Atomic Updates** mit Upsert-Semantik

**Konfiguration**:
```env
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_TIMEOUT=30
```

**Health-Check**: `GET /health`

---

### 3. Ollama Client (`backend/app/services/ai/ollama_client.py`)

**Rolle**: REST API Wrapper für Ollama

**Methoden**:
```python
async def generate_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str

async def generate_embeddings(
    texts: List[str],
) -> List[List[float]]

async def health_check() -> bool
```

**Error Handling**:
- Wrapped in `ExternalServiceError` 
- Retry-Logik (optional, nicht standardmäßig)
- Timeout nach 120s (konfigurierbar)

**Logging**: Alle Requests mit Duration, Token-Counts, Model-Name

---

### 4. RAG Service (`backend/app/services/rag_service.py`)

**Rolle**: Document Ingestion, Chunking, Retrieval

#### Ingestion Pipeline

```
Document → Chunking → Embedding → Qdrant Storage
```

**Chunking-Strategien**:
1. **Markdown**: Header-basiert (# → Sections)
2. **Plain Text**: Sliding Window (600 Tokens, 100 Overlap)

**Metadata**:
```python
{
    "tenant_id": str,
    "source": str,          # File path/URL
    "source_type": str,     # "docs", "schema", "entity"
    "section": str,         # Header/Section name
    "chunk_index": int,
    "created_at": datetime,
}
```

#### Retrieval Pipeline

```
Query → Embedding → Vector Search → Metadata Filter → Top-K
```

**Filter Chain**:
1. **Tenant Isolation**: `tenant_id == current_tenant`
2. **Source Type** (optional): `source_type == "docs"`
3. **Score Threshold**: `score >= 0.5`

**API**:
```python
async def ingest_document(
    source: str,
    content: str,
    source_type: str = "docs",
    metadata: Dict = None,
) -> IngestionResult

async def retrieve_context(
    query: str,
    top_k: int = 5,
    source_type: str = None,
) -> List[RetrievedChunk]
```

---

### 5. Tool Registry (`backend/app/tools/`)

**Rolle**: Zentrale Tool-Verwaltung mit Validation & RBAC

#### Architektur

```
Tool Definition → Registration → Validation → Execution → Audit
```

**Tool Definition**:
```python
ToolParameter(
    name="title",
    type="string",
    description="Task-Titel",
    required=True,
)

ToolDefinition(
    name="create_task",
    description="Erstellt einen neuen Task",
    parameters=[...],
    requires_confirmation=False,
    required_scopes=["write"],
    category="task",
)
```

**Tool Categories**:
- **task**: Task-Management (create, update, list)
- **entity**: Entity-Operations (contacts, properties)
- **navigation**: UI-Commands (navigate, toast, modal)

**Validation Flow**:
1. **Permission Check**: User hat alle `required_scopes`?
2. **Argument Validation**: Pydantic-basiert
3. **Idempotency**: Optional via `idempotency_key`
4. **Confirmation**: Bei `requires_confirmation=True`

**Execution Result**:
```python
ToolResult(
    success: bool,
    data: Any,
    error: str,
    requires_confirmation: bool,
    confirmation_message: str,
)
```

**UI Commands**:
- `NAVIGATE`: Router.push("/route")
- `TOAST`: Show notification
- `OPEN_MODAL`: Open modal with data

---

### 6. AI Orchestrator (`backend/app/services/ai_orchestrator_service.py`)

**Rolle**: Zentrale Chat-Logik mit RAG + Tool-Calling

#### Chat Flow

```
User Message 
  ↓
RAG Retrieval (Top-5 Chunks)
  ↓
Build Prompt (System + Context + History + User)
  ↓
Ollama LLM Call
  ↓
JSON Parse → {"type": "final"|"tool", ...}
  ↓
┌─────────────┬─────────────┐
│  Final      │  Tool Call  │
│  Response   │  ↓          │
│             │  Execute    │
│             │  ↓          │
│             │  LLM Call   │
│             │  (Final)    │
└─────────────┴─────────────┘
  ↓
ChatResponse (Message + Sources + UI-Commands)
```

#### Prompt Structure

```
SYSTEM PROMPT:
  - Base Instructions (JSON format, tool definitions)
  - RAG Context (Top-K chunks with sources)
  - Tool Schema (Available tools with parameters)

CHAT HISTORY:
  - Last 10 messages (sliding window)

USER MESSAGE:
  - Current user input
```

#### JSON Response Formats

**1. Final Answer**:
```json
{
  "type": "final",
  "message": "Hier ist die Antwort..."
}
```

**2. Tool Call**:
```json
{
  "type": "tool",
  "name": "create_task",
  "args": {
    "title": "Besichtigung vorbereiten",
    "due_date": "2025-12-20",
    "priority": "high"
  }
}
```

#### Error Handling

**JSON Parsing**:
1. Direct parse
2. Extract from ```json block
3. Regex for first { ... }
4. Fallback: Treat as final message

**Retry Logic**:
- Max 2 retries bei Parse-Errors
- Bei Tool-Fehlern: LLM informieren, finale Antwort

---

## API Endpoints

### Chat

**`POST /api/v1/ai/chat`**

Request:
```json
{
  "message": "Erstelle einen Task für die Objektbesichtigung",
  "history": [
    {"role": "user", "content": "...", "timestamp": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "context": {
    "context_type": "properties",
    "context_data": {"property_id": "123"}
  },
  "skip_rag": false
}
```

Response:
```json
{
  "message": "Task 'Objektbesichtigung' wurde erstellt",
  "sources": [
    {
      "id": "uuid",
      "title": "VISION.md - Tasks",
      "snippet": "...",
      "score": 0.87,
      "source_type": "docs"
    }
  ],
  "tool_call": {
    "name": "create_task",
    "args": {...},
    "result": {
      "task_id": "uuid",
      "title": "...",
      "message": "..."
    }
  },
  "ui_commands": [
    {
      "type": "NAVIGATE",
      "payload": {"route": "/tasks/uuid"}
    }
  ],
  "requires_confirmation": false,
  "metadata": {
    "duration_seconds": 2.34,
    "chunks_used": 3,
    "tool_executed": true
  }
}
```

### Ingestion

**`POST /api/v1/ai/ingest`**

Request:
```json
{
  "source": "docs/ARCHITECTURE.md",
  "content": "# Architecture...",
  "source_type": "docs",
  "metadata": {}
}
```

Response:
```json
{
  "source": "docs/ARCHITECTURE.md",
  "chunks_created": 15,
  "tenant_id": "uuid",
  "duration_seconds": 3.21,
  "success": true
}
```

### Health Check

**`GET /api/v1/ai/health`**

Response:
```json
{
  "status": "healthy",
  "ollama": true,
  "qdrant": true,
  "collection_exists": true,
  "tenant_chunk_count": 245,
  "models": [
    "deepseek-r1:8b",
    "nomic-embed-text"
  ]
}
```

### Tools

**`GET /api/v1/ai/tools?category=task`**

Response:
```json
{
  "tools": [
    {
      "name": "create_task",
      "description": "...",
      "category": "task",
      "parameters": [...],
      "requires_confirmation": false,
      "required_scopes": ["write"]
    }
  ],
  "count": 3
}
```

---

## Sicherheit & Multi-Tenancy

### Tenant-Isolation

**Ebene 1: JWT Token**
- Jeder Request enthält `tenant_id` im Token
- Extrahiert via `get_current_user()` Dependency

**Ebene 2: Service-Initialisierung**
```python
rag_service = RagService(tenant_id)
orchestrator = AiOrchestrator(tenant_id, user_id, scopes)
```

**Ebene 3: Daten-Filter**
```python
# RAG Retrieval
Filter(must=[
    FieldCondition(key="tenant_id", match=tenant_id)
])

# Tool Execution
Task.objects.filter(tenant_id=tenant_id)
```

### RBAC (Role-Based Access Control)

**Scopes**:
- `read` - Read-only Operationen
- `write` - Create/Update Operationen
- `delete` - Delete Operationen
- `admin` - Administrative Tasks

**Tool-Scopes**:
```python
create_task: ["write"]
list_tasks: ["read"]
delete_all_tasks: ["admin"]
```

**Check-Mechanismus**:
```python
if not all(scope in user_scopes for scope in tool.required_scopes):
    raise ForbiddenError()
```

### Audit Logging

**Alle AI-Aktionen werden geloggt**:
```python
AuditLog.objects.create(
    tenant_id=tenant_id,
    user_id=user_id,
    action="ai_chat" | "tool_call:create_task",
    details={
        "message": "...",
        "tool_args": {...},
        "duration_seconds": 2.3,
    },
    success=True,
)
```

---

## Performance-Optimierung

### Embedding-Caching

**Problem**: Embeddings für identische Queries wiederholen
**Lösung**: Redis-Cache mit TTL

```python
cache_key = f"embedding:{hash(text)}"
cached = redis.get(cache_key)
if not cached:
    embedding = await ollama.generate_embeddings([text])
    redis.setex(cache_key, 3600, json.dumps(embedding))
```

### Chunk Size Tuning

**Optimal**: 600 Tokens (ca. 2400 Zeichen)
- Zu klein: Zu viele Chunks, langsam
- Zu groß: Weniger präzise Matches

### Top-K Selection

**Default**: K=5
- Mehr: Besserer Kontext, aber längere Prompts
- Weniger: Schneller, aber weniger Kontext

### Context Window Management

**DeepSeek R1 8B**: 8192 Tokens
- System Prompt: ~1000 Tokens
- RAG Context (5 chunks): ~1500 Tokens
- Chat History (10 msgs): ~2000 Tokens
- User Message: ~500 Tokens
- **Remaining for Response**: ~3000 Tokens

---

## Troubleshooting

### Ollama nicht erreichbar

**Symptom**: `ConnectionError: Ollama is not reachable`

**Lösung**:
```bash
# Check if running
docker ps | grep ollama

# Restart
docker-compose -f deployment/docker-compose.ai.yml restart ollama

# Check logs
docker logs immonow_ollama
```

### Qdrant Collection nicht gefunden

**Symptom**: `Collection 'immonow_docs' does not exist`

**Lösung**:
```bash
# Auto-create via API
POST /api/v1/ai/ingest  # Erstes Dokument erstellt Collection

# Manuell
POST /api/v1/ai/reindex
```

### JSON Parsing Errors

**Symptom**: `Failed to extract JSON from LLM response`

**Ursache**: DeepSeek R1 8B hat schwächeres Structured Output als GPT-4

**Lösungen**:
1. **Few-Shot Prompting**: Beispiele im System-Prompt
2. **Retry-Logic**: Max 2 Versuche
3. **Fallback**: Behandle als finale Antwort

### Langsame Responses (>10s)

**Ursachen**:
1. **CPU-Inference**: Nutze GPU (siehe [LOCAL_SETUP.md](LOCAL_SETUP.md))
2. **Große Prompts**: Reduziere Top-K oder History
3. **Model Loading**: Erstes Request nach Neustart langsam

---

## Metriken & Monitoring

### Key Performance Indicators

**Latenz**:
- RAG Retrieval: <500ms
- LLM Inference (GPU): ~1-2s
- LLM Inference (CPU): ~10-15s
- Tool Execution: <1s

**Durchsatz**:
- Ollama (GPU): ~20 req/min
- Ollama (CPU): ~5 req/min
- Qdrant: ~1000 searches/sec

### Logging

**Structured Logs** (JSON):
```json
{
  "timestamp": "2025-12-13T10:30:00Z",
  "level": "INFO",
  "service": "ai_orchestrator",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "chat",
  "duration_seconds": 2.3,
  "chunks_used": 3,
  "tool_executed": "create_task"
}
```

**Log Levels**:
- `DEBUG`: Detailed traces (off in production)
- `INFO`: Normal operations
- `WARNING`: Recoverable errors
- `ERROR`: Unrecoverable errors

---

## Erweiterbarkeit

### Neue Tools hinzufügen

1. **Tool-Handler erstellen**:
```python
async def my_tool_handler(
    tenant_id: str,
    user_id: str,
    arg1: str,
    arg2: int,
) -> ToolResult:
    # Implementation
    return ToolResult(success=True, data={...})
```

2. **Tool registrieren**:
```python
ToolRegistry.register(
    name="my_tool",
    description="...",
    parameters=[...],
    handler=my_tool_handler,
    requires_confirmation=False,
    required_scopes=["write"],
    category="custom",
)
```

3. **In `tools/__init__.py` aufrufen**:
```python
def register_all_tools():
    register_task_tools()
    register_my_tools()  # NEU
```

### Neue RAG-Quellen

**Statische Docs**:
```python
await rag_service.ingest_document(
    source="docs/NEW_DOC.md",
    content=open("docs/NEW_DOC.md").read(),
    source_type="docs",
)
```

**Dynamische Daten** (z.B. DB-Schema):
```python
schema = extract_db_schema()
await rag_service.ingest_document(
    source="schema/properties",
    content=schema_to_text(schema),
    source_type="schema",
)
```

### Alternative Modelle

**Phi-3 Mini** (3.8B, schneller auf CPU):
```env
OLLAMA_CHAT_MODEL=phi3:mini
```

**Llama 3.1** (8B, bessere Qualität):
```env
OLLAMA_CHAT_MODEL=llama3.1:8b
```

---

**Nächste Schritte**: [LOCAL_SETUP.md](LOCAL_SETUP.md) für Installation & Deployment
