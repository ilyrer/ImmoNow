# ImmoNow - AI System Status Analyse (Stand: 13.12.2025)

## IST-Zustand: Bestehende LLM-Integration

### Aktueller Provider: OpenRouter (Cloud)
- **API**: OpenRouter REST API (OpenAI-kompatibel)
- **Model**: `qwen3-235b-a22b:free` (konfigurierbar via `OPENROUTER_MODEL`)
- **Client**: `openai.AsyncOpenAI` mit Base-URL: `https://openrouter.ai/api/v1`
- **Implementierung**: `backend/app/services/llm_service.py` (1134 Zeilen)
- **API-Key**: In Umgebungsvariable `OPENROUTER_API_KEY`

### Features der bestehenden LLM-Integration (17+)

#### 1. Kontakt-Management
- **Contact Summary**: 3-5 Sätze Zusammenfassung aus Historie
- **Lead Scoring Explanation**: Begründung für Lead-Score
- **Action Recommendations**: Nächste Schritte mit Priorisierung
- **Email Drafting**: Personalisierte E-Mails basierend auf Kontext

#### 2. Kommunikation
- **Auto-Reply Generation**: Automatische Antworten auf Nachrichten
- **Communication Analysis**: Action-Items, Entscheidungen, Sentiment extrahieren
- **Sentiment Analysis**: Emotion & Tonalität erkennen

#### 3. Allgemeine Funktionen
- **General Q&A**: `/api/v1/llm/ask` - Beliebige Fragen
- **Dashboard Q&A**: `/api/v1/llm/dashboard_qa` - Dashboard-spezifische Fragen mit KPI-Kontext
- **Requirements Extraction**: Aus Gesprächen Anforderungen extrahieren
- **Translation**: Multi-Language-Übersetzungen

### API Endpoints (bestehend)
- `POST /api/v1/llm/ask` - General Q&A (Auth required)
- `POST /api/v1/llm/dashboard_qa` - Dashboard Q&A (Auth required)
- `GET /api/v1/llm/health` - Health Check
- `POST /api/v1/llm/test` - Test Endpoint (NO AUTH, dev only)
- `POST /api/v1/llm/test_dashboard` - Dashboard Test (NO AUTH)

### Rate Limiting
- **Service-Level**: 10 Requests/Minute pro User
- **Storage**: In-Memory (sollte zu Redis migriert werden)
- **Implementierung**: `_check_rate_limit()` in `LLMService`

### Audit Trail
- **Service**: `AuditService` aus `backend/app/services/audit_service.py`
- **Logged Data**: `user_id`, `tenant_id`, `action`, `details`, `ip_address`, `timestamp`, `success`
- **Alle LLM-Requests werden geloggt**

---

## Tech-Stack

### Backend
- **Framework**: FastAPI 0.104.1 (API-Layer) + Django ORM (Data Persistence)
- **Python**: 3.11+
- **Database**: PostgreSQL 15 (prod) / SQLite (dev)
- **Cache**: Redis 7
- **Entry Point**: `backend/app/main.py` (Django config BEFORE imports!)
- **Pattern**: Route → Service (mit `tenant_id`) → Django ORM (mit `sync_to_async`) → Pydantic Response

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 4.9.5
- **State Management**: TanStack Query (React Query) v5 - **NO Redux**
- **Styling**: Tailwind CSS 3.4.0
- **Icons**: Lucide React
- **Router**: React Router DOM 6.30.1
- **API Client**: Axios 1.12.2
- **Charts**: Recharts 2.15.4

### Infrastructure
- **Container**: Docker Compose
- **Services**: Postgres, Redis, Backend (FastAPI), Django Admin, Frontend (React), Nginx
- **Volumes**: `postgres_data`, `redis_data`, `backend_media`, `backend_static`
- **Network**: Bridge `immonow_network`

---

## Entities (Django Models)

### Core Business Entities (50+)
1. **User & Tenancy**: `Tenant`, `User`, `Role`, `UserProfile`
2. **Tasks**: `Task`, `Project`, `KanbanBoard`, `Status`, `Tag`, `Checklist`, `Comment`, `Attachment`
3. **Properties**: `Property`, `PropertyAddress`, `PropertyFeature`, `PropertyImage`, `PropertyDocument`, `Expose`, `ExposeVersion`
4. **Contacts & CRM**: `Contact`, `ContactPerson`, `Appointment`, `AppointmentParticipant`
5. **Documents**: `Document`, `Folder`, `DocumentVersion`, `DocumentActivity`, `DocumentComment`
6. **Investor Portal**: `InvestorProfile`, `Investment`, `InvestmentProperty`, `InvestmentDocument`, `Report`, `KPIData`
7. **Communications**: `Mailbox`, `Email`, `EmailAttachment`, `Message`, `Notification`, `NotificationSettings`, `Communication`
8. **Social Media**: `SocialAccount`, `SocialPost`
9. **Billing**: `BillingInfo`, `StripeWebhookLog`
10. **System**: `AuditLog`, `FeatureFlag`, `SystemSetting`, `Location`, `MarketData`

### Wichtige Metadaten
- Alle Entities haben: `tenant_id` (Multi-Tenancy), `created_at`, `updated_at`
- Soft-Delete Pattern: Viele Modelle haben `is_deleted` Flag

---

## Services Layer (35+)

### Bestehende Services in `backend/app/services/`
1. `admin_service.py` - Admin-Operationen
2. **`ai_manager.py`** - AI-Abstraktionsschicht (unterstützt OpenRouter, OpenAI, Azure)
3. `analytics_service.py` - Analytics & Reporting
4. `appointments_service.py` - Kalender & Termine
5. `audit_service.py` - Audit Logging
6. `auth_service.py` - Authentifizierung
7. `avm_pdf_service.py` - AVM PDF-Generierung
8. `avm_service.py` - Automated Valuation Model (Premium)
9. `billing_service.py` - Subscription & Billing
10. `cim_service.py` - Central Information Model
11. `communications_service.py` - Interne Kommunikation
12. `contacts_service.py` - Kontakt-Management
13. `documents_service.py` - Dokumenten-Management
14. `email_service.py` - E-Mail-Operationen
15. `employees_service.py` - Mitarbeiter-Management
16. `expose_service.py` - Exposé-Generierung
17. `finance_service.py` - Finanz-Operationen
18. `geocoding_service.py` - Adress-Geocoding
19. `immoscout_service.py` - ImmoScout24-Integration
20. `immowelt_service.py` - Immowelt-Integration
21. `instagram_service.py` - Instagram-Integration
22. `investor_service.py` - Investor Portal
23. `kpi_service.py` - KPI-Berechnungen
24. `lead_scoring.py` - Lead-Scoring-Algorithmen
25. **`llm_service.py`** - LLM-Integration (1134 Zeilen, OpenRouter)
26. `market_data_service.py` - Marktdaten
27. `notification_service.py` - Benachrichtigungen
28. `oauth_service.py` - OAuth-Flows
29. `pdf_generator_service.py` - PDF-Generierung
30. `properties_service.py` - Immobilien-Operationen
31. `rate_limit_manager.py` - Rate Limiting
32. `social_service.py` - Social Media Management
33. `storage_s3.py` - S3 Storage
34. `tasks_service.py` - Task-Operationen
35. `tenant_service.py` - Tenant-Management
36. `usage_service.py` - Usage Tracking

### Service Pattern
```python
class TasksService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_tasks(self, filters):
        tasks = await sync_to_async(list)(
            Task.objects.filter(tenant_id=self.tenant_id, **filters)
        )
        return [TaskResponse.model_validate(t) for t in tasks]
```

---

## Multi-Tenancy & Security

### Authentication Flow
1. **JWT Token** mit Payload: `user_id`, `email`, `role`, `tenant_id`, `scopes` (list)
2. **Token Creation**: `SecurityManager.create_access_token()` in `backend/app/core/security.py`
3. **Token Verification**: `get_current_user` Dependency in `backend/app/api/deps.py`
4. **Scopes**: `read`, `write`, `delete`, `admin`
5. **Roles**: `admin`, `employee`, `customer`

### Scope Guards
- `require_read_scope = Depends(get_current_user)` + Custom logic
- `require_write_scope` - Write operations
- `require_admin_scope` - Admin-only operations
- Applied als Dependency: `def route(..., current_user: TokenData = Depends(require_write_scope))`

### Tenant Isolation
- **JEDE Query muss** `tenant_id` filtern: `Model.objects.filter(tenant_id=tenant_id)`
- Services werden mit `tenant_id` initialisiert
- Middleware: `backend/app/core/tenant_middleware.py`

---

## Frontend Chat-UI

### Bestehende Chat-Komponenten
1. **`frontend/src/components/chatbot/ChatbotPanel.tsx`** (643 Zeilen)
   - Context-aware Chatbot
   - Contexts: `properties`, `contacts`, `kanban`, `investor`, `social`, `comms`, `finance`, `documents`, `general`
   - Jeder Context hat Icon, Beschreibung, Farbe
   - Suggestions & Actions Support
   - Framer Motion Animations

2. **`frontend/src/components/Chat/SidebarChat.tsx`**
   - Sidebar Chat-Komponente

### LLM Service (Frontend)
**`frontend/src/services/llmService.ts`**:
```typescript
export class LLMService {
  private static BASE_URL = '/api/v1/llm';
  
  static async askQuestion(options: LLMRequestOptions): Promise<LLMResponse>
  static async askDashboardQuestion(request: DashboardQARequest): Promise<DashboardQAResponse>
  static async chat(message, context): Promise<LLMResponse>
  static async analyzeTask(taskDescription): Promise<{...}>
  static async generatePropertyDescription(propertyDetails): Promise<{...}>
}
```

---

## Integrationspunkte für Lokales AI-System

### 1. Service Layer Refactoring
**Datei**: `backend/app/services/llm_service.py`
- **ERSETZEN**: OpenRouter AsyncOpenAI Client → Ollama REST API Client
- **BEHALTEN**: Service-Struktur (`LLMService(tenant_id)`), Rate Limiting, Audit Trail
- **HINZUFÜGEN**: RAG-Retrieval vor LLM-Call, Tool-Calling-Logik

### 2. Neue Services
1. **`backend/app/services/ai/ollama_client.py`**
   - REST API Wrapper für Ollama
   - Methoden: `generate_completion()`, `generate_embeddings()`
   - DeepSeek R1 8B Chat, nomic-embed-text Embeddings

2. **`backend/app/services/rag_service.py`**
   - Ingestion: Chunking, Embedding, Store in Qdrant
   - Retrieval: Query → Embedding → Top-K Similarity Search
   - Collections: `documents_{tenant_id}`, `schemas_{tenant_id}`

3. **`backend/app/services/ai_orchestrator_service.py`**
   - Zentrale Chat-Logik: RAG → Prompt → LLM → Tool-Call → Response
   - JSON Parsing & Validation
   - Tool Execution mit Confirmation

### 3. Tool Registry
**Neue Struktur**: `backend/app/tools/`
- `registry.py` - ToolRegistry mit `execute()`
- `task_tools.py` - `create_task`, `list_tasks`, `update_task`, `delete_task`
- `entity_tools.py` - `create_contact`, `create_property`, `update_contact`
- `navigation_tools.py` - `navigate(route)` → UI Command
- **Validierung**: Pydantic Schemas pro Tool
- **Security**: Permission Checks, Idempotency Keys

### 4. API Endpoints
**Datei**: `backend/app/api/v1/ai.py` (NEU oder Erweiterung von `llm.py`)
- `POST /api/v1/ai/chat` - Chat mit RAG + Tool-Calling
- `POST /api/v1/ai/ingest` - Dokumente ingestieren
- `GET /api/v1/ai/health` - Ollama + Qdrant + DB Health
- `POST /api/v1/ai/reindex` - RAG Collections neu indexieren
- `GET /api/v1/ai/sources` - Liste aller RAG-Quellen

### 5. Frontend Integration
**Minimal Changes**:
- **`frontend/src/hooks/useAiChat.ts`** (NEU) - Custom Hook für `/api/v1/ai/chat`
- **`frontend/src/components/chatbot/ChatbotPanel.tsx`** - Erweitere für:
  - RAG-Quellen anzeigen (`sources: [{id, title, snippet}]`)
  - Action-Review-Modal (Tool-Call Bestätigung)
  - UI-Commands verarbeiten (`NAVIGATE`, `TOAST`, `OPEN_MODAL`)

### 6. Infrastructure
**Datei**: `deployment/docker-compose.ai.yml` (NEU)
- **Ollama Service**: Port 11434, Volume `ollama_models`, GPU-Passthrough
- **Qdrant Service**: Port 6333, Volume `qdrant_storage`
- **Backend**: Extended mit GPU-Support, neue Env-Vars

---

## Risiken & Tech Debt

### 1. Performance (lokal vs. Cloud)
- **DeepSeek R1 8B**: ~8GB RAM, CPU-Inference ~10-15s/Response
- **Mit GPU**: ~1-2s/Response (RTX 3060+ empfohlen)
- **Ohne GPU**: Nutzung nur für Nicht-Echtzeit-Features (Background-Jobs)
- **Mitigation**: Kleinere Modelle (Phi-3 Mini 3.8B) oder Quantized GGUF

### 2. Tool-Calling JSON-Robustheit
- **DeepSeek R1 8B**: Schwächer in Structured Output als GPT-4
- **Strategie**: Few-Shot Prompting, JSON Recovery Parser, Retry-Logic (max 2x)
- **Fallback**: `{"type":"final","message":"..."}` bei Parse-Error

### 3. RAG Latenz
- **Embedding**: ~100-200ms pro Query (lokal)
- **Vector Search**: ~50ms (Qdrant, 10K Chunks)
- **Total Overhead**: ~250ms zusätzlich zu LLM-Inference
- **Mitigation**: Aggressive Caching (Redis), Async Processing

### 4. Multi-Tenancy in RAG
- **Challenge**: Tenant-Isolation in Vector Store
- **Lösung**: Metadaten-Filter (`tenant_id` in jedem Chunk)
- **Qdrant**: Native Filter-Support, aber Overhead bei großen Collections
- **Alternative**: Separate Collections pro Tenant (`docs_{tenant_id}`)

### 5. Token Context Limits
- **DeepSeek R1 8B**: Context Window ~8K Tokens
- **Problem**: Lange RAG-Kontexte + Chat-Historie überschreiten Limit
- **Mitigation**: 
  - Top-K = 3-5 (nicht mehr)
  - Chunk Size = 400-600 Tokens
  - Sliding Window für Chat-Historie (letzten 10 Messages)

### 6. Keine Cloud-Fallbacks
- **Kritisch**: Bei Ollama-Ausfall ist AI-System komplett down
- **Mitigation**:
  - Robuste Health-Checks
  - Graceful Degradation (UI zeigt "AI temporarily unavailable")
  - Retry-Logik mit Exponential Backoff
  - Alternative: Kleineres Backup-Model (Phi-3 Mini) für Fallback

---

## Nächste Schritte (Implementierung)

### Phase 1: Lokale AI-Plattform (Core)
1. ✅ Status-Analyse dokumentiert
2. ⏳ Docker Compose mit Ollama + Qdrant erweitern
3. ⏳ Ollama Setup-Scripts (deepseek-r1:8b, nomic-embed-text)
4. ⏳ Ollama Client implementieren
5. ⏳ RAG Service implementieren

### Phase 2: Agent & Tool-Calling
6. ⏳ Tool Registry mit Pydantic erstellen
7. ⏳ AI Orchestrator Service implementieren
8. ⏳ Backend API Endpoints erweitern

### Phase 3: Frontend Integration
9. ⏳ Chat-UI erweitern
10. ⏳ AI Hook erstellen

### Phase 4: DevOps & Tests
11. ⏳ Konfiguration & Env-Vars
12. ⏳ Tests schreiben
13. ⏳ One-Command Dev-Setup
14. ⏳ Dokumentation fertigstellen

---

## Hardware-Anforderungen

### Minimum (CPU-only)
- **RAM**: 16GB+ (8GB für Model, 4GB für Qdrant, 4GB für App)
- **CPU**: 8 Cores+
- **Disk**: 20GB+ (Models ~5GB, Qdrant Vectors ~5GB)
- **Performance**: ~10-15s Response-Zeit

### Empfohlen (GPU)
- **GPU**: NVIDIA RTX 3060+ (8GB VRAM)
- **RAM**: 16GB+
- **CUDA**: 11.8+
- **Performance**: ~1-2s Response-Zeit

### Optimal (Production)
- **GPU**: NVIDIA RTX 4090 (24GB VRAM)
- **RAM**: 32GB+
- **CPU**: 16 Cores+
- **Disk**: NVMe SSD 100GB+
- **Performance**: <1s Response-Zeit

---

**Erstellt**: 13.12.2025  
**Status**: ✅ IST-Zustand dokumentiert  
**Nächster Schritt**: Docker Compose AI-Stack erweitern
