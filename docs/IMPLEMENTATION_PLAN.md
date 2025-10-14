# Production Readiness Implementation Plan

## Executive Summary

This document provides a comprehensive analysis and implementation roadmap for making the CIM Immobilien application production-ready with live backend data. The analysis revealed:

- **Backend Coverage**: 95% - Most endpoints exist, missing LLM proxy and some DMS enhancements
- **Mock Data Usage**: ~35 frontend components use mock data (130 occurrences)
- **API Integration Status**: Partial - Some modules fully integrated, others using deprecated hooks

---

## Phase A - Analysis Complete

### 1. Module Inventory & Status

| Module | Page/Component | API Status | Mock Usage | Priority |
|--------|----------------|------------|------------|----------|
| **Authentication** | LoginPage, AuthPage | ✅ LIVE | None | ✅ Done |
| **Dashboard** | Dashboard.tsx | ⚠️ PARTIAL | Low | P1 |
| **Kanban Board** | TasksBoard.tsx | ⚠️ PARTIAL | Low | P1 |
| **CIM Analytics** | CIMDashboard.tsx + modules | ✅ LIVE | None | ✅ Done |
| **Team Status** | TeamStatusBoard.tsx | ❌ MOCK | High | P1 |
| **Communications** | CommunicationsHub.tsx | ✅ LIVE | None | ✅ Done |
| **Documents (DMS)** | ModernDocumentDashboard.tsx | ⚠️ PARTIAL | Medium | P2 |
| **AVM & Market** | AvmPage.tsx | ✅ LIVE | None | ✅ Done |
| **AI Matching** | MatchingPage.tsx | ❌ MOCK | High | P2 |
| **Investors** | InvestorDashboard.tsx | ❌ MOCK | High | P3 |
| **Social Hub** | SocialHub/index.tsx | ❌ MOCK | High | P3 |
| **Admin Console** | AdminPage.tsx | ⚠️ PARTIAL | Medium | P3 |
| **Properties** | PropertiesPage.tsx | ✅ LIVE | Low | ✅ Done |
| **Contacts** | ContactsPage.tsx | ✅ LIVE | Low | ✅ Done |
| **Calendar** | CalendarPage.tsx | ⚠️ PARTIAL | Medium | P2 |

### 2. Backend Endpoints Status

#### ✅ Existing & Complete
- `/api/v1/auth/*` - Authentication (login, register, refresh)
- `/api/v1/properties/*` - Properties CRUD with filters
- `/api/v1/contacts/*` - Contacts CRUD with budget support
- `/api/v1/cim/*` - CIM analytics & matching
- `/api/v1/avm/*` - Property valuation
- `/api/v1/communications/*` - Messages, conversations
- `/api/v1/tasks/*` - Tasks CRUD
- `/api/v1/appointments/*` - Calendar appointments
- `/api/v1/notifications/*` - Notification system
- `/api/v1/analytics/*` - Dashboard KPIs
- `/api/v1/finance/*` - Financing calculations

#### ⚠️ Partial Implementation
- `/api/v1/documents/*` - Missing visibility toggle, favorites
- `/api/v1/employees/*` - Basic CRUD exists, missing payroll/audit
- `/api/v1/social/*` - Missing OAuth flows, post scheduling
- `/api/v1/tenant/*` - Missing admin controls

#### ❌ Missing Endpoints
- `/api/v1/llm/ask` - LLM proxy (Qwen via OpenRouter)
- `/api/v1/llm/dashboard_qa` - Dashboard Q&A chatbot
- `/api/v1/matching/re-score` - Re-compute matches
- `/api/v1/investor/*` - Portfolio, positions, performance
- `/api/v1/documents/visibility/{id}` - Toggle document visibility
- `/api/v1/documents/favorite/{id}` - Toggle favorites (exists as PUT /{id}/favorite)
- `/api/v1/social/oauth/*` - Social media OAuth callbacks
- `/api/v1/social/schedule/*` - Post scheduling

### 3. Frontend API Layer Analysis

#### Current Structure
```
src/
├── api/
│   ├── config.ts          ✅ Axios client with auth interceptor
│   ├── hooks.ts           ⚠️ React Query hooks (some legacy)
│   ├── services.ts        ⚠️ Generated OpenAPI types
│   └── */api.ts          ❌ Legacy mock implementations
├── hooks/
│   ├── useApi.ts          ❌ DEPRECATED - Mock fallbacks
│   ├── useProperties.ts   ✅ Live backend integration
│   ├── useTasks.ts        ✅ Live backend integration
│   ├── useNotifications.ts ✅ Live backend integration
│   ├── useCIM.ts          ✅ Live backend integration
│   └── useInvestor.ts     ❌ Mock only
└── services/
    ├── api.service.ts     ✅ Main API service
    ├── properties.ts      ✅ Live service
    ├── kpi.service.ts     ⚠️ Partial live data
    └── ai.service.ts      ❌ No backend integration
```

#### Mock Data Locations (130 occurrences across 35 files)

**High Priority (P1)**
- `components/dashboard/Dashboard.tsx` - Stats, charts data
- `components/dashboard/TeamStatusComponents/*.tsx` - Team metrics
- `components/admin/tabs/EmployeesTab.tsx` - Employee list
- `components/admin/tabs/AuditTab.tsx` - Audit logs

**Medium Priority (P2)**
- `components/documents/ModernDocumentDashboard.tsx` - Folder tree
- `components/investor/MarketplaceView.tsx` - Investment listings
- `components/properties/MediaPicker.tsx` - Media library
- `components/Calendar/CalendarDashboard.tsx` - Events

**Low Priority (P3)**
- `components/profile/tabs/*.tsx` - Profile settings (mostly UI)
- `components/SocialHub/*.tsx` - Social media previews

---

## Phase B - Backend Enhancements

### Module 1: LLM Proxy (P1)

#### Endpoints to Create

**File**: `backend/app/api/v1/llm.py` (NEW)

```python
"""
LLM Proxy API Endpoints
Provides secure access to Qwen via OpenRouter
"""

@router.post("/ask")
async def ask_llm(request: LLMRequest, current_user: TokenData = Depends(require_read_scope))
    """General LLM query with optional tools"""

@router.post("/dashboard_qa")
async def dashboard_qa(request: DashboardQARequest, current_user: TokenData = Depends(require_read_scope))
    """Answer questions about dashboard KPIs with context injection"""
```

#### Schema Definitions

**File**: `backend/app/schemas/llm.py` (NEW)

```python
class LLMMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class LLMRequest(BaseModel):
    messages: List[LLMMessage]
    tools: Optional[List[Dict]] = None
    temperature: float = 0.7
    max_tokens: int = 1000

class DashboardQARequest(BaseModel):
    question: str
    context: Optional[Dict] = None  # KPIs, filters, etc.
```

#### Service Implementation

**File**: `backend/app/services/llm_service.py` (NEW)

- `async def call_openrouter()` - HTTP client with retries
- `async def dashboard_qa_with_context()` - Inject KPI definitions
- Error handling: 429 rate limits, 5xx retries (exponential backoff)
- Audit logging to `llm_requests` table

#### Environment Variables Required

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=qwen/qwen-2.5-72b-instruct
```

#### Database Migration

**File**: `backend/app/migrations/0010_llm_audit.py` (NEW)

```sql
CREATE TABLE llm_requests (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    endpoint VARCHAR(100),
    prompt TEXT,
    response TEXT,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    status VARCHAR(20),
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Module 2: DMS Enhancements (P2)

#### Missing Endpoints

**File**: `backend/app/api/v1/documents.py` (EXTEND)

```python
@router.put("/{document_id}/visibility")
async def update_visibility(document_id: str, request: VisibilityRequest)
    """Change document visibility (private/team/public)"""

# Note: /favorite already exists as PUT /{document_id}/favorite
```

#### Additional Schemas

**File**: `backend/app/schemas/documents.py` (EXTEND)

```python
class VisibilityRequest(BaseModel):
    visibility: Literal["private", "team", "public"]
```

#### Service Updates

**File**: `backend/app/services/documents_service.py` (EXTEND)

- `async def update_visibility()` - Check ownership, update field, audit log
- Validate MIME types on upload (PDF, DOCX, XLSX, images)
- Compute checksums (SHA256) for duplicate detection

---

### Module 3: AI Matching Enhancements (P2)

#### Endpoints to Create

**File**: `backend/app/api/v1/cim.py` (EXTEND)

```python
@router.post("/matching/re-score")
async def re_score_matches(property_id: Optional[str], contact_id: Optional[str])
    """Re-compute match scores for specific property/contact or all"""
```

#### Service Implementation

**File**: `backend/app/services/cim_service.py` (EXTEND)

- `async def compute_match_score()` - Scoring algorithm
- `async def bulk_re_score()` - Background task for re-computing all matches

---

### Module 4: Investor Module (P3)

#### Endpoints to Create

**File**: `backend/app/api/v1/investor.py` (EXTEND)

```python
@router.get("/portfolio")
async def get_portfolio(current_user: TokenData)
    """Get user's investment portfolio"""

@router.get("/positions")
async def get_positions(current_user: TokenData)
    """Get active investment positions"""

@router.get("/performance")
async def get_performance(timeframe: str = "1y")
    """Get portfolio performance metrics"""
```

---

### Module 5: Social Hub (P3)

#### Endpoints to Create

**File**: `backend/app/api/v1/social.py` (EXTEND)

```python
@router.get("/oauth/connect/{platform}")
async def oauth_connect(platform: str)
    """Initiate OAuth flow for social platform"""

@router.get("/oauth/callback/{platform}")
async def oauth_callback(platform: str, code: str, state: str)
    """Handle OAuth callback"""

@router.post("/schedule")
async def schedule_post(request: SchedulePostRequest)
    """Schedule a post for future publication"""

@router.get("/metrics")
async def get_metrics(platform: Optional[str], days: int = 30)
    """Get social media metrics"""
```

---

## Phase C - Frontend Live Data Integration

### Implementation Order

1. **LLM Proxy** → Dashboard Chatbot → Test Q&A flow
2. **DMS** → Document visibility toggles → Upload testing
3. **Kanban** → Live task updates → DnD persistence
4. **CIM Analytics** → Already live, verify all submodules
5. **AVM/Market** → Already live, add error boundaries
6. **Team Status** → Replace all mock data → Wire KPI hooks
7. **Communications** → Already live, add real-time updates
8. **Investors** → Create hooks → Wire portfolio views
9. **Social Hub** → OAuth integration → Post scheduling
10. **Admin Console** → User management → Audit logs

---

### Module 1: Dashboard Live Data (P1)

**Files to Modify**:
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/DashboardNew.tsx`
- `src/services/kpi.service.ts`

**Changes**:
1. Remove mock `emptyPerf`, `emptyDist`, `emptyStatus` arrays
2. Use `useDashboardAnalytics()` hook consistently
3. Map API response to chart data format
4. Add loading skeletons
5. Add error boundaries

**API Calls**:
```typescript
const { data: analytics, isLoading } = useQuery({
  queryKey: ['dashboard-analytics', filters],
  queryFn: () => apiClient.get('/api/v1/analytics/dashboard', { params: filters })
});
```

---

### Module 2: Kanban Live Updates (P1)

**Files to Modify**:
- `src/components/dashboard/Kanban/TasksBoard.tsx`
- `src/components/dashboard/Kanban/ModernKanbanBoard.tsx`

**Changes**:
1. Remove hardcoded `mockTasks` arrays
2. Wire `useTasks()`, `useCreateTask()`, `useUpdateTask()` hooks
3. Implement DnD persistence:
   ```typescript
   const onDragEnd = async (result: DropResult) => {
     if (!result.destination) return;

     await updateTaskMutation.mutateAsync({
       id: result.draggableId,
       status: result.destination.droppableId,
       position: result.destination.index
     });
   };
   ```
4. Optimistic updates for smooth UX
5. Auto-refresh on WebSocket events (optional)

---

### Module 3: Team Status Board (P1)

**Files to Modify**:
- `src/components/dashboard/TeamStatusComponents/*.tsx`
- `src/api/teamPerformance/api.ts`
- `src/api/teamActivities/api.ts`

**Changes**:
1. Replace all mock implementations:
   - `mockActivities` → `GET /api/v1/analytics/team-activities`
   - `mockPerformance` → `GET /api/v1/analytics/team-performance`
   - `mockProjects` → `GET /api/v1/properties?assigned_to_me=true`
   - `mockDeadlines` → `GET /api/v1/tasks?due_soon=true`

2. Create new hooks:
   ```typescript
   // src/hooks/useTeamAnalytics.ts
   export const useTeamActivities = (timeRange: string) => {
     return useQuery({
       queryKey: ['team-activities', timeRange],
       queryFn: () => apiClient.get('/api/v1/analytics/team-activities', {
         params: { timeRange }
       })
     });
   };
   ```

---

### Module 4: Documents (DMS) (P2)

**Files to Modify**:
- `src/components/documents/ModernDocumentDashboard.tsx`
- `src/components/documents/DocumentFolderTree.tsx`
- `src/hooks/useDocuments.ts`

**Changes**:
1. Wire folder operations:
   ```typescript
   const { data: folders } = useQuery({
     queryKey: ['document-folders'],
     queryFn: () => apiClient.get('/api/v1/documents/folders')
   });

   const createFolderMutation = useMutation({
     mutationFn: (data) => apiClient.post('/api/v1/documents/folders', data),
     onSuccess: () => queryClient.invalidateQueries(['document-folders'])
   });
   ```

2. Implement visibility toggle:
   ```typescript
   const toggleVisibility = useMutation({
     mutationFn: ({ id, visibility }) =>
       apiClient.put(`/api/v1/documents/${id}/visibility`, { visibility })
   });
   ```

3. Add favorite toggle (already exists):
   ```typescript
   const toggleFavorite = useMutation({
     mutationFn: (id) => apiClient.put(`/api/v1/documents/${id}/favorite`)
   });
   ```

---

### Module 5: AI Matching (P2)

**Files to Modify**:
- `src/pages/MatchingPage.tsx`
- `src/components/matching/MatchingView.tsx`
- `src/hooks/useCIM.ts`

**Changes**:
1. Use existing `/api/v1/cim/matching` endpoint
2. Add re-score action:
   ```typescript
   const reScoreMutation = useMutation({
     mutationFn: ({ propertyId, contactId }) =>
       apiClient.post('/api/v1/cim/matching/re-score', { propertyId, contactId })
   });
   ```

3. Add filters: score threshold, property type, budget range
4. Display match explanation (attributes used in scoring)

---

### Module 6: Investor Dashboard (P3)

**Files to Modify**:
- `src/pages/InvestorDashboard.tsx`
- `src/components/investor/*.tsx`
- `src/hooks/useInvestor.ts` (currently mock)

**Changes**:
1. Create real hooks:
   ```typescript
   export const usePortfolio = () => {
     return useQuery({
       queryKey: ['investor-portfolio'],
       queryFn: () => apiClient.get('/api/v1/investor/portfolio')
     });
   };

   export const usePerformance = (timeframe: string) => {
     return useQuery({
       queryKey: ['investor-performance', timeframe],
       queryFn: () => apiClient.get('/api/v1/investor/performance', {
         params: { timeframe }
       })
     });
   };
   ```

2. Wire all subviews:
   - `PortfolioView.tsx` → `/portfolio`
   - `MarketplaceView.tsx` → `/properties?investment_ready=true`
   - `AnalyticsView.tsx` → `/performance`
   - `SimulationsView.tsx` → `/simulations` (if backend implemented)

---

### Module 7: Social Hub (P3)

**Files to Modify**:
- `src/components/SocialHub/index.tsx`
- `src/components/SocialHub/Accounts/AccountsView.tsx`
- `src/components/SocialHub/Composer/ComposerView.tsx`
- `src/components/SocialHub/Scheduler/SchedulerView.tsx`

**Changes**:
1. OAuth flow:
   ```typescript
   const connectAccount = (platform: string) => {
     window.location.href =
       `${API_BASE}/api/v1/social/oauth/connect/${platform}`;
   };
   ```

2. Post scheduling:
   ```typescript
   const schedulePost = useMutation({
     mutationFn: (data) => apiClient.post('/api/v1/social/schedule', data)
   });
   ```

3. Metrics dashboard:
   ```typescript
   const { data: metrics } = useQuery({
     queryKey: ['social-metrics', platform, days],
     queryFn: () => apiClient.get('/api/v1/social/metrics', {
       params: { platform, days }
     })
   });
   ```

---

### Module 8: Admin Console (P3)

**Files to Modify**:
- `src/components/admin/AdminPage.tsx`
- `src/components/admin/tabs/*.tsx`

**Changes**:
1. Wire employee management (already exists in backend)
2. Add audit log view:
   ```typescript
   const { data: auditLogs } = useQuery({
     queryKey: ['audit-logs', filters],
     queryFn: () => apiClient.get('/api/v1/tenant/audit-logs', {
       params: filters
     })
   });
   ```

3. User roles/permissions (if backend implemented)
4. System flags/feature toggles

---

## Phase D - Quality Assurance

### 1. Error Handling

**Standardized Error Boundaries**:
```typescript
// src/components/common/ErrorBoundary.tsx
export const ApiErrorBoundary: React.FC = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="error-state">
          <AlertCircle />
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

**Axios Interceptor Enhancements**:
```typescript
// src/api/config.ts
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 429) {
      // Rate limit - retry after delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      return apiClient.request(error.config);
    }

    if (error.response?.status === 401) {
      // Token expired - refresh
      const refreshed = await refreshToken();
      if (refreshed) return apiClient.request(error.config);

      // Failed - redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

---

### 2. Testing Strategy

#### Backend Tests

**File**: `backend/tests/test_llm.py` (NEW)

```python
def test_llm_ask_endpoint():
    """Test basic LLM query"""

def test_llm_rate_limit_handling():
    """Test 429 retry logic"""

def test_llm_audit_logging():
    """Verify requests are logged"""
```

**File**: `backend/tests/test_documents.py` (EXTEND)

```python
def test_document_visibility_toggle():
    """Test changing document visibility"""

def test_favorite_toggle():
    """Test favorite/unfavorite"""
```

#### Frontend E2E Tests

**File**: `e2e/tests/critical-flows.spec.ts` (NEW)

```typescript
test('Dashboard loads with live data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="kpi-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
});

test('Kanban drag-and-drop persists', async ({ page }) => {
  await page.goto('/kanban');
  await page.dragAndDrop('[data-task-id="1"]', '[data-column="done"]');
  await page.reload();
  await expect(page.locator('[data-column="done"] [data-task-id="1"]')).toBeVisible();
});

test('Document upload and visibility', async ({ page }) => {
  await page.goto('/documents');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  await page.click('[data-testid="upload-button"]');
  await expect(page.locator('[data-document-name="test.pdf"]')).toBeVisible();

  await page.click('[data-testid="visibility-toggle"]');
  await expect(page.locator('[data-visibility="team"]')).toBeVisible();
});
```

---

### 3. Performance Optimization

#### React Query Configuration

```typescript
// src/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Lazy Loading

```typescript
// src/App.tsx
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const CIMDashboard = lazy(() => import('./pages/CIMPage'));
// ... etc
```

#### Memoization

```typescript
// Heavy computations
const chartData = useMemo(() =>
  transformToChartFormat(rawData),
  [rawData]
);
```

---

## Acceptance Criteria

### Must-Have (MVP)

- [ ] Zero mock data in production build
- [ ] All API calls use `apiClient` with proper auth
- [ ] LLM proxy operational with rate limiting
- [ ] DMS fully functional (upload, folders, visibility, favorites)
- [ ] Kanban DnD persists to backend
- [ ] Dashboard loads real KPIs within 2 seconds
- [ ] Error boundaries on all pages
- [ ] 401 → login redirect working
- [ ] No console errors/warnings
- [ ] TypeScript strict mode passing

### Should-Have (Post-MVP)

- [ ] Real-time updates via WebSockets
- [ ] Offline mode with service worker
- [ ] Advanced search with filters
- [ ] Export features (PDF, Excel, CSV)
- [ ] Bulk operations (bulk task update, bulk delete)
- [ ] User preferences persistence

### Nice-to-Have (Future)

- [ ] AI suggestions in all forms
- [ ] Voice input for notes
- [ ] Mobile PWA version
- [ ] Multi-language support
- [ ] Advanced analytics dashboards

---

## Environment Configuration

### Backend `.env` (Production)

```bash
# Core
SECRET_KEY=<strong-random-key>
DEBUG=false
DATABASE_URL=postgresql://user:pass@host:5432/db
ALLOWED_HOSTS=app.immonow.de,api.immonow.de
CORS_ORIGINS=https://app.immonow.de

# JWT
JWT_SECRET_KEY=<strong-jwt-key>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# LLM
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=qwen/qwen-2.5-72b-instruct

# Storage
STORAGE_BACKEND=s3  # or 'local' for dev
S3_BUCKET=cim-documents
S3_REGION=eu-central-1
S3_ACCESS_KEY=<aws-access-key>
S3_SECRET_KEY=<aws-secret-key>

# Limits
MAX_UPLOAD_MB=50
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=WARNING
SENTRY_DSN=https://...  # optional
```

### Frontend `.env` (Production)

```bash
# API
REACT_APP_API_URL=https://api.immonow.de
REACT_APP_WS_URL=wss://api.immonow.de

# Optional
REACT_APP_SENTRY_DSN=https://...
REACT_APP_ENV=production
```

---

## Timeline Estimate

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **P1 - Critical** | LLM Proxy + DMS + Kanban + Dashboard | 5 days | None |
| **P2 - Important** | Team Status + Matching + Calendar | 4 days | P1 complete |
| **P3 - Enhanced** | Investors + Social + Admin | 5 days | P2 complete |
| **Testing & QA** | E2E tests + Bug fixes | 3 days | P3 complete |
| **Deployment** | Staging + Production rollout | 2 days | QA passed |

**Total**: ~19 working days (4 weeks)

---

## Next Steps

1. ✅ **Review this plan** with team/stakeholders
2. **Set up environment variables** (backend + frontend)
3. **Begin Phase B, Module 1**: Implement LLM proxy
4. **Test LLM endpoint** with Postman/curl
5. **Begin Phase C, Module 1**: Wire dashboard to live data
6. **Iterate**: One module at a time, test as you go

---

## Appendices

### A. API Endpoint Matrix

| Frontend Component | Backend Endpoint | Status |
|--------------------|------------------|--------|
| Dashboard.tsx | `/api/v1/analytics/dashboard` | ✅ Exists |
| TasksBoard.tsx | `/api/v1/tasks` | ✅ Exists |
| CIMDashboard.tsx | `/api/v1/cim/overview` | ✅ Exists |
| DocumentDashboard.tsx | `/api/v1/documents` | ✅ Exists |
| DocumentDashboard.tsx | `/api/v1/documents/folders` | ✅ Exists |
| AvmPage.tsx | `/api/v1/avm/valuate` | ✅ Exists |
| MatchingPage.tsx | `/api/v1/cim/matching` | ✅ Exists |
| MatchingPage.tsx | `/api/v1/cim/matching/re-score` | ❌ Missing |
| InvestorDashboard.tsx | `/api/v1/investor/portfolio` | ❌ Missing |
| SocialHub.tsx | `/api/v1/social/oauth/*` | ❌ Missing |
| AdminPage.tsx | `/api/v1/tenant/audit-logs` | ⚠️ Partial |
| GlobalAIChatbot.tsx | `/api/v1/llm/ask` | ❌ Missing |
| Dashboard chatbot | `/api/v1/llm/dashboard_qa` | ❌ Missing |

### B. Mock Data Removal Checklist

- [ ] `components/dashboard/Dashboard.tsx` - Remove `emptyPerf`, `emptyDist`, etc.
- [ ] `components/dashboard/TeamStatusComponents/*.tsx` - Replace all `mock*` arrays
- [ ] `components/admin/tabs/EmployeesTab.tsx` - Remove `mockEmployees`
- [ ] `components/admin/tabs/AuditTab.tsx` - Remove `mockAuditLogs`
- [ ] `components/documents/ModernDocumentDashboard.tsx` - Remove `mockFolders`
- [ ] `components/investor/MarketplaceView.tsx` - Remove `mockListings`
- [ ] `components/SocialHub/Types/index.ts` - Remove all mock types
- [ ] `api/index.ts` - Remove `mockApiService`
- [ ] `api/hooks.ts` - Remove all `*Mock` hooks

### C. Dependencies to Install

**Backend**:
```bash
pip install httpx  # For LLM API calls
pip install tenacity  # For retry logic
```

**Frontend**:
```bash
npm install @tanstack/react-query@latest  # Already installed
npm install axios@latest  # Already installed
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Author**: Implementation Planning Team
**Status**: Ready for Implementation
