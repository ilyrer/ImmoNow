# GitHub Copilot Instructions for ImmoNow

## Project Context
**ImmoNow** is a multi-tenant real estate management platform with a hybrid backend architecture:
- **Backend**: Python 3.11+ using **FastAPI** for API layer + **Django ORM** for data persistence (hybrid approach)
- **Frontend**: **React 18** with **TypeScript**, **Tailwind CSS**, and **TanStack Query** (React Query)
- **Infrastructure**: Docker Compose, PostgreSQL (or SQLite for dev), Redis for caching
- **Key Features**: Multi-tenancy, JWT auth with scopes, billing/subscription system, AI integrations (LLM, AVM)

## Critical Architecture Patterns

### Backend: FastAPI + Django Hybrid
**CRITICAL**: Django must be configured BEFORE any Django imports. `backend/app/main.py` calls `django.conf.settings.configure()` at startup. Never import `django.conf.settings` or Django models at module level in files loaded before `main.py` runs.

**Layered Structure**:
```
backend/app/
├── main.py                 # FastAPI app + Django setup
├── api/v1/                 # Route handlers (thin layer)
│   ├── router.py          # Aggregates all domain routers
│   ├── deps.py            # Shared dependencies (auth, scopes)
│   └── *.py               # Domain routers (tasks, properties, etc.)
├── services/              # Business logic (TasksService, etc.)
├── db/models/             # Django ORM models
├── schemas/               # Pydantic v2 models (API contracts)
└── core/                  # Security, tenancy, billing, errors
```

**Request Flow**: Route → Service (with tenant_id) → Django ORM → Pydantic response
- **Routes** (`api/v1/*.py`): Thin, handle HTTP concerns, delegate to services
- **Services** (`services/*.py`): Initialized with `tenant_id`, contain business logic, use Django ORM with `sync_to_async`
- **Schemas** (`schemas/*.py`): Pydantic v2 with `model_config = ConfigDict(from_attributes=True)` for ORM serialization

**Multi-Tenancy**:
- Every request requires JWT token with `tenant_id` in payload
- Services filter all queries by `tenant_id` (e.g., `Task.objects.filter(tenant_id=tenant_id)`)
- Use `get_current_user` dependency from `app.api.deps` to extract `TokenData`
- See `app.core.tenancy.py` and `app.core.tenant_middleware.py`

**Auth & Scopes**:
- JWT tokens include: `user_id`, `email`, `role`, `tenant_id`, `scopes` (list)
- Scope guards in `app.api.deps.py`: `require_read_scope`, `require_write_scope`, `require_admin_scope`
- Apply as `Depends(require_write_scope)` in route parameters
- Token creation/verification in `app.core.security.py` (SecurityManager)

**Billing/Subscription System**:
- `BillingGuard` (`app.core.billing_guard.py`) enforces plan limits and subscription status
- Check with `await BillingGuard.check_subscription_status(tenant_id)` before expensive operations
- Plan limits defined in `app.core.billing_config.py` (e.g., max properties, users, etc.)
- Raises `HTTPException(402)` if subscription inactive or limits exceeded

### Frontend: React + TypeScript

**State Management**: TanStack Query only. No Redux.
- Custom hooks in `frontend/src/hooks/` (e.g., `useTasks`, `useProperties`)
- Query keys follow pattern: `{ all, lists, list(params), detail(id) }`
- Example from `useTasks.ts`:
  ```ts
  export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (params: TaskListParams) => [...taskKeys.lists(), params] as const,
  };
  ```

**API Layer Structure**:
```
frontend/src/api/
├── config.ts              # Axios instance, base URL
├── services.ts            # Generic API utilities
├── hooks.ts               # Shared query hooks
└── [domain]/              # Per-domain modules
    ├── types.ts           # TypeScript interfaces
    └── index.ts           # API functions
```

**Type Safety**:
- Define types in `src/api/[domain]/types.ts` matching backend Pydantic schemas
- Use `src/types/` for cross-cutting types
- Backend schemas in `backend/app/schemas/` are source of truth

**Styling**: Tailwind CSS with `tailwind-merge` for conditional classes. Use `lucide-react` for icons.

## Development Workflows

### Local Development
**Backend** (from `backend/` dir):
```bash
uvicorn app.main:app --reload             # FastAPI (port 8000)
python manage.py runserver 0.0.0.0:8001   # Django Admin (port 8001)
python manage.py makemigrations && python manage.py migrate
```

**Frontend** (from `frontend/` dir):
```bash
npm start                  # Dev server (port 3000)
# On Windows with Node issues: start-app.bat
```

**Full Stack**:
```bash
cd deployment
docker-compose up          # Postgres, Redis, Backend, Frontend, Django Admin
# Or: start-dev.bat (Windows) / start-dev.sh (Linux/Mac)
```

### Database Migrations
Django manages schema:
```bash
python manage.py makemigrations
python manage.py migrate
# For specific migration scripts: migrate_*.py in backend/
```

### Testing
- **Backend**: `pytest` from `backend/` directory (config in `pytest.ini`)
- **Frontend**: `npm test` from `frontend/` directory (Jest + React Testing Library)

## Coding Conventions

### Backend Patterns
**Services Pattern**:
```python
class TasksService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_tasks(self, ...):
        tasks = await sync_to_async(list)(
            Task.objects.filter(tenant_id=self.tenant_id)
        )
        return [TaskResponse.model_validate(t) for t in tasks]
```

**Route Pattern**:
```python
@router.get("/tasks")
async def list_tasks(
    current_user: TokenData = Depends(get_current_user),
    status: Optional[str] = None,
):
    service = TasksService(current_user.tenant_id)
    return await service.get_tasks(status=status)
```

**Error Handling**: Use custom errors from `app.core.errors.py`:
- `ValidationError` (400)
- `NotFoundError` (404)
- `ForbiddenError` (403)

**Pydantic v2**: Use `model_validate()`, NOT `from_orm()` (deprecated in v2)

### Frontend Patterns
**Query Hook Pattern**:
```typescript
export const useTasks = (params: TaskListParams) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksService.listTasks(params),
    staleTime: 0,
  });
};
```

**Mutation with Optimistic Updates**:
```typescript
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => tasksService.updateTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};
```

## Common Pitfalls
1. **Django Settings Import**: Never import `django.conf.settings` or models at top-level in modules loaded before `main.py`
2. **Tenant Isolation**: Always filter by `tenant_id` in services. Missing filters = data leakage between tenants
3. **Async Django ORM**: Wrap Django ORM calls with `sync_to_async` when called from async functions
4. **Pydantic v2**: Use `model_validate()` not `from_orm()`; use `model_config = ConfigDict(from_attributes=True)`
5. **Frontend Proxy**: `package.json` proxies to `http://localhost:8000`. Use relative URLs like `/api/v1/tasks`
6. **Billing Checks**: Wrap premium features with `BillingGuard.check_feature()` to respect plan limits
7. **Scope Guards**: Don't forget scope checks (`require_write_scope`) on write operations

## AI & External Service Integrations

### LLM Integration (OpenRouter + DeepSeek)
**Service**: `app.services.llm_service.py` - Multi-tenant LLM service with OpenRouter
- **Model**: DeepSeek V3.1 (configurable via `OPENROUTER_MODEL` env var)
- **Rate Limiting**: Built-in 10 requests/minute per user (service-level)
- **Audit Trail**: All LLM requests logged via `AuditService`
- **Pattern**:
  ```python
  llm_service = LLMService(tenant_id)
  response = await llm_service.generate_completion(prompt, max_tokens=2048)
  ```
- **Environment Variables**:
  - `OPENROUTER_API_KEY` (required)
  - `OPENROUTER_MODEL` (default: `deepseek/deepseek-chat-v3.1:free`)
  - `OPENROUTER_BASE` (default: `https://openrouter.ai/api/v1`)
- **Frontend Hook**: `useLLMChat` in `frontend/src/hooks/useLLMChat.ts`

### AVM (Automated Valuation Model)
**Service**: `app.services.avm_service.py` - Premium property valuation engine
- **Features**: Geocoding, POI analysis, market comparables, LLM qualitative analysis
- **API Endpoint**: `POST /api/v1/avm/valuate`
- **Dependencies**:
  - `GeocodingService` - Address to coordinates
  - `MarketDataService` - Comparable listings and market trends
  - `AIManager` (optional) - LLM-enhanced analysis
- **Valuation Flow**:
  1. Validate input (address, size, property type)
  2. Geocode address → get coordinates
  3. Fetch comparable listings from market data
  4. Calculate base value with heuristics (size, condition, features)
  5. Optional: LLM qualitative analysis
  6. Return `AvmResponse` with confidence level, range, comparables
- **Premium Feature**: Wrapped with `BillingGuard.check_feature()` for plan enforcement
- **Frontend Hook**: `useAVM` in `frontend/src/hooks/useAVM.ts`

### Publishing to Real Estate Portals
**Service**: `app.services.immoscout_service.py`, `app.services.immowelt_service.py`
- **Supported Portals**: ImmoScout24, Immowelt, eBay Kleinanzeigen (extensible)
- **API Endpoint**: `POST /api/v1/publishing/publish`
- **Pattern**: Background jobs with status tracking (`PublishJob` model)
- **OAuth Flow**: Portals require OAuth2 authentication (handled by `OAuthService`)
- **Rate Limiting**: Portal-specific limits via `RateLimitManager`
- **Error Handling**: External service errors wrapped in `ExternalServiceError`

### Social Media Integration (Social Hub)
**Service**: `app.services.social_service.py`, `app.services.oauth_service.py`
- **Platforms**: Facebook, Instagram, LinkedIn (OAuth2-based)
- **Features**: Multi-account management, post scheduling, analytics
- **OAuth Pattern**:
  1. Frontend initiates: `POST /api/v1/social/oauth/init`
  2. User authorizes on platform
  3. Callback: `GET /api/v1/social/oauth/callback`
  4. Stores tokens in `SocialAccount` model (encrypted)
- **Post Publishing**: `POST /api/v1/social/posts` with scheduled publishing
- **Frontend Component**: `SocialHub` in `frontend/src/components/SocialHub/`

### Google Maps Integration
**Frontend**: `@react-google-maps/api` library
- **API Key Management**: Stored in tenant settings (`google_maps_api_key` field)
- **Admin Config**: `AdminIntegrationsSettings` page for tenant-level key setup
- **Usage**: Property location display, geocoding visualization
- **Hook**: `useGoogleMaps` in `frontend/src/hooks/useGoogleMaps.ts`

## Key Files
- `backend/app/main.py` - Django config + FastAPI setup
- `backend/app/api/v1/router.py` - All route registrations
- `backend/app/core/security.py` - JWT auth
- `backend/app/core/billing_guard.py` - Subscription enforcement
- `backend/app/services/llm_service.py` - LLM integration with OpenRouter
- `backend/app/services/avm_service.py` - Property valuation engine
- `frontend/src/hooks/*.ts` - TanStack Query patterns
- `deployment/docker-compose.yml` - Full stack setup
