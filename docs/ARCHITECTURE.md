# ImmoNow Architecture Documentation

**Version**: 1.0  
**Datum**: 2025-01-27  
**Autor**: Chief Architect & Lead Auditor  

---

## Executive Summary

ImmoNow ist eine **Multi-Tenant Real-Estate SaaS-Plattform** mit Enterprise-Sicherheitsstandards. Das System implementiert harte Datenisolation zwischen Mandanten, technische Durchsetzung von Abo-Limits und umfassende Sicherheitsmaßnahmen.

### Kern-Architektur-Prinzipien

1. **Multi-Tenant-Isolation**: Harte Datenisolation auf Datenbank- und Dateisystem-Ebene
2. **Security-First**: JWT-basierte Authentifizierung mit Rollen-basierter Autorisierung
3. **Limit-Enforcement**: Technische Durchsetzung von Seat- und Storage-Limits
4. **Event-Driven**: WebSocket-basierte Echtzeit-Kommunikation
5. **Scalable**: Horizontale Skalierung durch Tenant-Isolation

---

## 1. High-Level Architecture

### 1.1 System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Frontend<br/>React + TypeScript]
        MOBILE[Mobile App<br/>React Native]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx<br/>Load Balancer + SSL]
    end
    
    subgraph "Application Layer"
        FASTAPI[FastAPI Backend<br/>Python 3.11]
        DJANGO[Django Admin<br/>Management Interface]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache + Sessions)]
        FILES[File Storage<br/>Tenant-Isolated]
    end
    
    subgraph "External Services"
        STRIPE[Stripe<br/>Payment Processing]
        EMAIL[Email Service<br/>SMTP/SendGrid]
        S3[AWS S3<br/>File Storage]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> FASTAPI
    NGINX --> DJANGO
    FASTAPI --> POSTGRES
    FASTAPI --> REDIS
    FASTAPI --> FILES
    FASTAPI --> STRIPE
    FASTAPI --> EMAIL
    DJANGO --> POSTGRES
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.2 | SPA Framework |
| **Frontend** | TypeScript | 4.9+ | Type Safety |
| **Frontend** | TailwindCSS | 3.3+ | Styling |
| **Frontend** | React Query | 4.29+ | State Management |
| **Backend** | Python | 3.11 | Runtime |
| **Backend** | FastAPI | 0.104.1 | API Framework |
| **Backend** | Django | 4.2.7 | ORM + Admin |
| **Database** | PostgreSQL | 14+ | Primary Database |
| **Cache** | Redis | 7.0+ | Caching + Sessions |
| **WebSocket** | Channels | 4.0+ | Real-time Communication |
| **Deployment** | Docker | 20.10+ | Containerization |
| **Proxy** | Nginx | 1.21+ | Load Balancer |

---

## 2. Multi-Tenant Architecture

### 2.1 Tenant Isolation Strategy

ImmoNow implementiert **harte Datenisolation** auf mehreren Ebenen:

#### Database Level
- **Tenant-ID Foreign Key**: Alle Entitäten haben `tenant_id` FK
- **Query Filtering**: Service-Layer filtert automatisch nach `tenant_id`
- **Row-Level Security**: PostgreSQL RLS für zusätzliche Sicherheit

#### File System Level
- **Tenant-Isolated Paths**: `tenants/{tenant_id}/properties/{property_id}/images/`
- **Access Control**: Dateien sind physisch getrennt
- **Storage Tracking**: Automatische Größenberechnung pro Tenant

#### Application Level
- **JWT Tenant Context**: Token enthält `tenant_id`, `tenant_slug`, `role`
- **Service Layer**: Alle Services erhalten `tenant_id` im Konstruktor
- **Middleware**: Tenant-Middleware setzt `request.current_tenant`

### 2.2 Tenant Data Model

```mermaid
erDiagram
    Tenant ||--o{ TenantUser : has
    Tenant ||--o{ Property : owns
    Tenant ||--o{ Document : owns
    Tenant ||--o{ Contact : owns
    Tenant ||--o{ Task : owns
    Tenant ||--|| BillingAccount : has
    
    Tenant {
        uuid id PK
        string name
        string slug UK
        string company_email
        string plan
        int max_users
        int max_properties
        int storage_limit_gb
        bigint storage_bytes_used
        boolean is_active
        datetime created_at
    }
    
    TenantUser {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        string role
        json scopes
        boolean can_manage_properties
        boolean can_manage_documents
        boolean can_manage_users
        boolean can_view_analytics
        boolean can_export_data
        boolean is_active
        datetime joined_at
    }
    
    Property {
        uuid id PK
        uuid tenant_id FK
        string title
        string property_type
        string status
        decimal price
        int area
        int rooms
        uuid created_by FK
        datetime created_at
    }
    
    BillingAccount {
        uuid id PK
        uuid tenant_id FK
        string stripe_customer_id
        string stripe_subscription_id
        string plan_key
        string status
        datetime trial_end
        datetime current_period_end
        boolean cancel_at_period_end
    }
```

### 2.3 Tenant Isolation Implementation

#### Service Layer Pattern
```python
class PropertiesService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_properties(self):
        # Automatische Tenant-Filterung
        return Property.objects.filter(tenant_id=self.tenant_id)
    
    async def create_property(self, data: dict):
        # Tenant-ID wird automatisch gesetzt
        data['tenant_id'] = self.tenant_id
        return Property.objects.create(**data)
```

#### FastAPI Dependency Injection
```python
@router.get("/properties")
async def get_properties(
    tenant_id: str = Depends(get_tenant_id),
    current_user: TokenData = Depends(require_read_scope)
):
    service = PropertiesService(tenant_id)
    return await service.get_properties()
```

#### Django Middleware
```python
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Tenant aus JWT oder Session extrahieren
        request.current_tenant = self.get_tenant(request)
        return self.get_response(request)
```

---

## 3. Authentication & Authorization

### 3.1 JWT-Based Authentication

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant D as Database
    participant R as Redis
    
    C->>A: POST /auth/login
    Note over C,A: email, password
    
    A->>D: Validate credentials
    D-->>A: User + TenantUser data
    
    A->>A: Generate JWT tokens
    Note over A: Access Token (30min)<br/>Refresh Token (30d)
    
    A->>R: Store refresh token
    A-->>C: Access + Refresh tokens
    
    Note over C: Subsequent requests
    C->>A: GET /api/v1/properties
    Note over C,A: Authorization: Bearer {access_token}
    
    A->>A: Validate JWT
    Note over A: Extract tenant_id, role, scopes
    
    A->>D: Query with tenant filter
    D-->>A: Tenant-specific data
    A-->>C: Response
```

### 3.2 JWT Token Structure

#### Access Token Payload
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "tenant_id": "uuid",
  "tenant_slug": "company-name",
  "role": "admin",
  "scopes": ["read", "write", "delete", "admin"],
  "iat": 1640995200,
  "exp": 1640997000,
  "type": "access"
}
```

#### Refresh Token Payload
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "iat": 1640995200,
  "exp": 1643673600,
  "type": "refresh"
}
```

### 3.3 Role-Based Access Control (RBAC)

| Role | Permissions | Scopes |
|------|-------------|--------|
| **Owner** | Full access to tenant | `read`, `write`, `delete`, `admin` |
| **Admin** | Manage users, properties, documents | `read`, `write`, `delete`, `admin` |
| **Manager** | Manage properties, documents | `read`, `write` |
| **Agent** | Manage assigned properties | `read`, `write` |
| **Viewer** | Read-only access | `read` |

### 3.4 Scope-Based Authorization

```python
# Scope-based endpoint protection
@router.post("/properties")
async def create_property(
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    # Only users with 'write' scope can access
    pass

@router.delete("/properties/{id}")
async def delete_property(
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    # Only users with 'delete' scope can access
    pass
```

---

## 4. Subscription & Limits Architecture

### 4.1 Plan Structure

```mermaid
graph LR
    subgraph "Subscription Plans"
        FREE[Free<br/>2 Users<br/>5 Properties<br/>1 GB Storage]
        STARTER[Starter<br/>5 Users<br/>25 Properties<br/>10 GB Storage]
        PRO[Pro<br/>20 Users<br/>100 Properties<br/>50 GB Storage]
        ENTERPRISE[Enterprise<br/>∞ Users<br/>∞ Properties<br/>500 GB Storage]
    end
    
    FREE --> STARTER
    STARTER --> PRO
    PRO --> ENTERPRISE
```

### 4.2 Limits Enforcement Architecture

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Endpoint
    participant B as BillingGuard
    participant U as UsageService
    participant D as Database
    
    C->>A: POST /users/invite
    Note over C,A: Invite new user
    
    A->>B: check_limit(tenant_id, 'users', 1)
    B->>U: get_current_usage(tenant_id)
    U->>D: SELECT COUNT(*) FROM tenant_users
    D-->>U: Current user count
    U-->>B: Usage data
    
    B->>B: Check if current + additional > limit
    
    alt Limit exceeded
        B-->>A: HTTP 403 - PLAN_LIMIT_REACHED
        A-->>C: Error response
    else Limit OK
        B-->>A: Success
        A->>D: Create new user
        A-->>C: Success response
    end
```

### 4.3 BillingGuard Implementation

```python
class BillingGuard:
    @staticmethod
    async def check_limit(
        tenant_id: str,
        resource: str,
        action: str = 'create',
        additional_count: int = 1
    ) -> None:
        # 1. Check subscription status
        billing = await BillingGuard.check_subscription_status(tenant_id)
        
        # 2. Get current usage
        usage = await UsageService.get_current_usage(tenant_id)
        
        # 3. Get plan limits
        limits = PLAN_LIMITS[billing.plan_key]
        
        # 4. Check specific resource limits
        if resource == 'users':
            await BillingGuard._check_user_limit(tenant_id, limits, additional_count)
        elif resource == 'storage_gb':
            await BillingGuard._check_storage_limit(tenant_id, limits, additional_count)
        # ... other resources
```

### 4.4 Storage Tracking Architecture

```mermaid
graph TB
    subgraph "Upload Flow"
        UPLOAD[File Upload]
        GUARD[Storage Limit Check]
        SAVE[Save to Database]
        SIGNAL[Django Signal]
        UPDATE[Update Usage]
    end
    
    subgraph "Reconcile Job"
        CRON[Cron Job<br/>Daily]
        SCAN[Scan Filesystem]
        CALC[Calculate Usage]
        SYNC[Sync with Database]
    end
    
    subgraph "Usage Monitoring"
        API[Usage API]
        BANNER[Limit Banner]
        WEBHOOK[Webhook Alerts]
    end
    
    UPLOAD --> GUARD
    GUARD --> SAVE
    SAVE --> SIGNAL
    SIGNAL --> UPDATE
    
    CRON --> SCAN
    SCAN --> CALC
    CALC --> SYNC
    
    UPDATE --> API
    API --> BANNER
    API --> WEBHOOK
```

---

## 5. File Storage Architecture

### 5.1 Tenant-Isolated File Structure

```
MEDIA_ROOT/
├── tenants/
│   ├── tenant-123/
│   │   ├── properties/
│   │   │   ├── property-456/
│   │   │   │   ├── images/
│   │   │   │   │   ├── image1.jpg
│   │   │   │   │   └── image2.jpg
│   │   │   │   └── documents/
│   │   │   │       ├── expose.pdf
│   │   │   │       └── contract.pdf
│   │   │   └── property-789/
│   │   │       ├── images/
│   │   │       └── documents/
│   │   ├── documents/
│   │   │   ├── general-doc1.pdf
│   │   │   └── general-doc2.pdf
│   │   └── messages/
│   │       ├── message-001/
│   │       │   └── attachment.pdf
│   │       └── message-002/
│   │           └── image.jpg
│   └── tenant-456/
│       └── properties/
│           └── property-101/
│               ├── images/
│               └── documents/
```

### 5.2 Upload Path Functions

```python
def property_image_upload_path(instance, filename):
    """Generate tenant-isolated upload path for property images"""
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    safe_filename = os.path.basename(filename)
    return f"tenants/{tenant_id}/properties/{property_id}/images/{safe_filename}"

def property_document_upload_path(instance, filename):
    """Generate tenant-isolated upload path for property documents"""
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    safe_filename = os.path.basename(filename)
    return f"tenants/{tenant_id}/properties/{property_id}/documents/{safe_filename}"
```

### 5.3 Storage Tracking with Signals

```python
@receiver(post_save, sender=PropertyImage)
def update_storage_on_image_save(sender, instance, created, **kwargs):
    """Update storage usage when property image is saved"""
    if created and instance.size:
        tenant = instance.property.tenant
        tenant.storage_bytes_used = (tenant.storage_bytes_used or 0) + instance.size
        tenant.save(update_fields=['storage_bytes_used'])

@receiver(post_delete, sender=PropertyImage)
def update_storage_on_image_delete(sender, instance, **kwargs):
    """Update storage usage when property image is deleted"""
    if instance.size:
        tenant = instance.property.tenant
        tenant.storage_bytes_used = max(0, (tenant.storage_bytes_used or 0) - instance.size)
        tenant.save(update_fields=['storage_bytes_used'])
```

---

## 6. WebSocket Architecture

### 6.1 Real-Time Communication

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Client]
        MOBILE[Mobile Client]
    end
    
    subgraph "WebSocket Layer"
        WS[WebSocket Server<br/>Django Channels]
        CONSUMER[Consumer Layer]
    end
    
    subgraph "Message Types"
        KANBAN[Kanban Updates]
        TEAM[Team Notifications]
        PROPERTY[Property Updates]
        CHAT[Chat Messages]
    end
    
    subgraph "Backend Services"
        API[FastAPI Services]
        TASKS[Celery Tasks]
        EVENTS[Event Handlers]
    end
    
    WEB --> WS
    MOBILE --> WS
    WS --> CONSUMER
    CONSUMER --> KANBAN
    CONSUMER --> TEAM
    CONSUMER --> PROPERTY
    CONSUMER --> CHAT
    
    API --> EVENTS
    TASKS --> EVENTS
    EVENTS --> CONSUMER
```

### 6.2 WebSocket Routing

```python
# backend/app/routing.py
websocket_urlpatterns = [
    re_path(r'ws/kanban/(?P<tenant_id>[^/]+)/$', KanbanConsumer.as_asgi()),
    re_path(r'ws/team/(?P<tenant_id>[^/]+)/$', TeamConsumer.as_asgi()),
    re_path(r'ws/properties/(?P<tenant_id>[^/]+)/$', PropertyConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<tenant_id>[^/]+)/$', ChatConsumer.as_asgi()),
]
```

### 6.3 Consumer Implementation

```python
class KanbanConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tenant_id = self.scope['url_route']['kwargs']['tenant_id']
        self.room_group_name = f'kanban_{self.tenant_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # Process message and broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'kanban_update',
                'data': data
            }
        )
```

---

## 7. API Architecture

### 7.1 API Structure Overview

```mermaid
graph TB
    subgraph "API Layer"
        ROUTER[Main Router<br/>33 Endpoints]
        DEPS[Dependencies<br/>Auth, Tenant, Rate Limit]
        MIDDLEWARE[Middleware<br/>CORS, Security, Logging]
    end
    
    subgraph "Domain Services"
        AUTH[Auth Service]
        PROP[Properties Service]
        DOC[Documents Service]
        USER[User Service]
        BILL[Billing Service]
        NOTIF[Notification Service]
    end
    
    subgraph "Core Services"
        SEC[Security Service]
        EMAIL[Email Service]
        STORAGE[Storage Service]
        USAGE[Usage Service]
    end
    
    ROUTER --> DEPS
    DEPS --> MIDDLEWARE
    ROUTER --> AUTH
    ROUTER --> PROP
    ROUTER --> DOC
    ROUTER --> USER
    ROUTER --> BILL
    ROUTER --> NOTIF
    
    AUTH --> SEC
    PROP --> STORAGE
    DOC --> STORAGE
    USER --> EMAIL
    BILL --> USAGE
```

### 7.2 API Endpoint Categories

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| **Authentication** | `/auth/*` | Login, register, token refresh |
| **Properties** | `/properties/*` | CRUD operations, media uploads |
| **Documents** | `/documents/*` | Document management, uploads |
| **Users** | `/users/*` | User management, invitations |
| **Tenant** | `/tenant/*` | Tenant settings, usage |
| **Billing** | `/billing/*` | Subscription management |
| **Analytics** | `/analytics/*` | Reports, dashboards |
| **Communications** | `/communications/*` | Messages, notifications |

### 7.3 Rate Limiting Architecture

```python
# Rate limiting configuration
RATE_LIMITS = {
    'global': {
        'requests': 100,
        'window': 60,  # seconds
    },
    'tenant': {
        'requests': 200,
        'window': 60,  # seconds
    },
    'endpoints': {
        '/auth/login': {'requests': 5, 'window': 60},
        '/documents/upload': {'requests': 10, 'window': 60},
        '/communications/send': {'requests': 60, 'window': 60},
    }
}
```

---

## 8. Database Architecture

### 8.1 Database Schema Overview

```mermaid
erDiagram
    Tenant ||--o{ TenantUser : has
    Tenant ||--o{ Property : owns
    Tenant ||--o{ Document : owns
    Tenant ||--o{ Contact : owns
    Tenant ||--o{ Task : owns
    Tenant ||--|| BillingAccount : has
    Tenant ||--o{ SocialPost : owns
    Tenant ||--o{ InvestorProperty : owns
    
    User ||--o{ TenantUser : belongs_to
    User ||--o{ Property : created_by
    User ||--o{ Document : uploaded_by
    User ||--o{ Task : assigned_to
    
    Property ||--o{ PropertyImage : has
    Property ||--o{ PropertyDocument : has
    Property ||--o{ ExposeVersion : has
    Property ||--o{ PublishJob : has
    Property ||--o{ PropertyFeature : has
    Property ||--|| Address : has
    
    Document ||--o{ DocumentVersion : has
    
    Task ||--o{ TaskComment : has
    Task ||--o{ TaskAttachment : has
    
    Contact ||--o{ ContactNote : has
    Contact ||--o{ ContactTask : has
    
    BillingAccount ||--o{ UsageSnapshot : has
```

### 8.2 Key Database Indexes

```sql
-- Tenant isolation indexes
CREATE INDEX idx_property_tenant_id ON properties(tenant_id);
CREATE INDEX idx_document_tenant_id ON documents(tenant_id);
CREATE INDEX idx_contact_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_task_tenant_id ON tasks(tenant_id);

-- Performance indexes
CREATE INDEX idx_property_status ON properties(status);
CREATE INDEX idx_property_type ON properties(property_type);
CREATE INDEX idx_property_price ON properties(price);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_tenant_user_active ON tenant_users(tenant_id, is_active);

-- Composite indexes
CREATE INDEX idx_property_tenant_status ON properties(tenant_id, status);
CREATE INDEX idx_task_tenant_assigned ON tasks(tenant_id, assigned_to_id);
CREATE INDEX idx_document_tenant_uploaded ON documents(tenant_id, uploaded_at);
```

### 8.3 Database Connection Management

```python
# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
            'CONN_MAX_AGE': 300,  # 5 minutes
        }
    }
}
```

---

## 9. Security Architecture

### 9.1 Security Layers

```mermaid
graph TB
    subgraph "Network Security"
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
        SSL[SSL/TLS Termination]
    end
    
    subgraph "Application Security"
        AUTH[Authentication]
        AUTHZ[Authorization]
        RATE[Rate Limiting]
        CORS[CORS Policy]
    end
    
    subgraph "Data Security"
        ENCRYPT[Encryption at Rest]
        TRANSIT[Encryption in Transit]
        BACKUP[Encrypted Backups]
    end
    
    subgraph "Infrastructure Security"
        CONTAINER[Container Security]
        SECRETS[Secrets Management]
        MONITOR[Security Monitoring]
    end
    
    WAF --> AUTH
    DDoS --> AUTHZ
    SSL --> RATE
    AUTH --> ENCRYPT
    AUTHZ --> TRANSIT
    RATE --> BACKUP
    CORS --> CONTAINER
    ENCRYPT --> SECRETS
    TRANSIT --> MONITOR
```

### 9.2 Security Headers

```python
# Security headers configuration
SECURE_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}
```

### 9.3 Input Validation

```python
# Pydantic schema example
class PropertyCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    property_type: str = Field(..., regex=r'^(apartment|house|commercial|land)$')
    price: Decimal = Field(..., gt=0, decimal_places=2)
    area: int = Field(..., gt=0, le=10000)
    rooms: int = Field(..., ge=0, le=20)
    
    @validator('title')
    def validate_title(cls, v):
        # Custom validation logic
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
```

---

## 10. Deployment Architecture

### 10.1 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: immonow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/immonow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "8000:8000"
  
  frontend:
    build: ./real-estate-dashboard
    ports:
      - "3000:3000"
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

### 10.2 Nginx Configuration

```nginx
# nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name immonow.com;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket routes
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 11. Monitoring & Observability

### 11.1 Logging Architecture

```mermaid
graph TB
    subgraph "Application Logs"
        APP[Application]
        REQUEST[Request Logs]
        ERROR[Error Logs]
        AUDIT[Audit Logs]
    end
    
    subgraph "Infrastructure Logs"
        NGINX[Nginx Logs]
        POSTGRES[PostgreSQL Logs]
        REDIS[Redis Logs]
        DOCKER[Docker Logs]
    end
    
    subgraph "Log Aggregation"
        FLUENTD[Fluentd]
        ELASTIC[Elasticsearch]
        KIBANA[Kibana]
    end
    
    APP --> REQUEST
    APP --> ERROR
    APP --> AUDIT
    NGINX --> FLUENTD
    POSTGRES --> FLUENTD
    REDIS --> FLUENTD
    DOCKER --> FLUENTD
    
    REQUEST --> FLUENTD
    ERROR --> FLUENTD
    AUDIT --> FLUENTD
    
    FLUENTD --> ELASTIC
    ELASTIC --> KIBANA
```

### 11.2 Structured Logging

```python
# Structured logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'structured': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "tenant_id": "%(tenant_id)s", "user_id": "%(user_id)s", "request_id": "%(request_id)s"}',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'structured',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/immonow/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'structured',
        },
    },
    'loggers': {
        'app': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 11.3 Metrics Collection

```python
# Metrics configuration
METRICS = {
    'requests_total': 'Counter of HTTP requests',
    'request_duration_seconds': 'Histogram of request duration',
    'active_users': 'Gauge of active users per tenant',
    'storage_usage_bytes': 'Gauge of storage usage per tenant',
    'api_errors_total': 'Counter of API errors by endpoint',
    'rate_limit_hits_total': 'Counter of rate limit hits',
}
```

---

## 12. Performance Architecture

### 12.1 Caching Strategy

```mermaid
graph TB
    subgraph "Cache Layers"
        BROWSER[Browser Cache]
        CDN[CDN Cache]
        NGINX[Nginx Cache]
        REDIS[Redis Cache]
        DB[Database Cache]
    end
    
    subgraph "Cache Types"
        STATIC[Static Assets]
        API[API Responses]
        SESSION[Session Data]
        QUERY[Query Results]
    end
    
    BROWSER --> STATIC
    CDN --> STATIC
    NGINX --> API
    REDIS --> SESSION
    REDIS --> QUERY
    DB --> QUERY
```

### 12.2 Database Optimization

```python
# Query optimization patterns
class PropertiesService:
    async def get_properties_with_images(self, tenant_id: str):
        """Optimized query with prefetch_related"""
        return Property.objects.filter(
            tenant_id=tenant_id
        ).prefetch_related(
            'images',
            'documents',
            'address'
        ).select_related(
            'created_by'
        )
    
    async def get_property_analytics(self, tenant_id: str):
        """Aggregated query for analytics"""
        return Property.objects.filter(
            tenant_id=tenant_id
        ).aggregate(
            total_count=Count('id'),
            avg_price=Avg('price'),
            total_area=Sum('area'),
            by_status=Count('id', filter=Q(status='available'))
        )
```

### 12.3 API Performance

```python
# API performance optimizations
@router.get("/properties")
async def get_properties(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None),
    tenant_id: str = Depends(get_tenant_id),
    current_user: TokenData = Depends(require_read_scope)
):
    # 1. Input validation
    if pagination.size > 100:
        raise HTTPException(status_code=400, detail="Page size too large")
    
    # 2. Database query with limits
    offset = pagination.page * pagination.size
    properties = Property.objects.filter(
        tenant_id=tenant_id
    ).select_related('address').prefetch_related('images')[
        offset:offset + pagination.size
    ]
    
    # 3. Serialization
    return [PropertyResponse.from_orm(p) for p in properties]
```

---

## 13. Backup & Recovery

### 13.1 Backup Strategy

```mermaid
graph TB
    subgraph "Backup Types"
        DB[Database Backup]
        FILES[File Backup]
        CONFIG[Config Backup]
        CODE[Code Backup]
    end
    
    subgraph "Backup Frequency"
        DAILY[Daily DB Backup]
        WEEKLY[Weekly File Backup]
        MONTHLY[Monthly Full Backup]
    end
    
    subgraph "Storage Locations"
        LOCAL[Local Storage]
        S3[AWS S3]
        GCS[Google Cloud Storage]
    end
    
    DB --> DAILY
    FILES --> WEEKLY
    CONFIG --> MONTHLY
    CODE --> MONTHLY
    
    DAILY --> LOCAL
    WEEKLY --> S3
    MONTHLY --> GCS
```

### 13.2 Recovery Procedures

```bash
#!/bin/bash
# Recovery script

# 1. Database recovery
pg_restore -h localhost -U postgres -d immonow /backups/db_backup_$(date +%Y%m%d).sql

# 2. File recovery
aws s3 sync s3://immonow-backups/files/ /media/

# 3. Configuration recovery
cp /backups/config/nginx.conf /etc/nginx/
cp /backups/config/docker-compose.yml /opt/immonow/

# 4. Service restart
docker-compose down
docker-compose up -d
```

---

## 14. Scalability Considerations

### 14.1 Horizontal Scaling

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Load Balancer]
    end
    
    subgraph "Application Tier"
        APP1[Backend Instance 1]
        APP2[Backend Instance 2]
        APP3[Backend Instance 3]
    end
    
    subgraph "Database Tier"
        MASTER[Master DB]
        REPLICA1[Read Replica 1]
        REPLICA2[Read Replica 2]
    end
    
    subgraph "Cache Tier"
        REDIS1[Redis Instance 1]
        REDIS2[Redis Instance 2]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> MASTER
    APP2 --> MASTER
    APP3 --> MASTER
    
    APP1 --> REPLICA1
    APP2 --> REPLICA2
    APP3 --> REPLICA1
    
    APP1 --> REDIS1
    APP2 --> REDIS2
    APP3 --> REDIS1
```

### 14.2 Tenant-Based Sharding

```python
# Tenant-based sharding strategy
class TenantShardingService:
    def get_database_for_tenant(self, tenant_id: str) -> str:
        """Route tenant to specific database"""
        # Simple hash-based sharding
        shard_id = hash(tenant_id) % 4
        return f"immonow_shard_{shard_id}"
    
    def get_redis_for_tenant(self, tenant_id: str) -> str:
        """Route tenant to specific Redis instance"""
        shard_id = hash(tenant_id) % 2
        return f"redis_shard_{shard_id}"
```

---

## 15. Development Workflow

### 15.1 Development Environment

```bash
# Development setup
git clone https://github.com/company/immonow.git
cd immonow

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend setup
cd ../real-estate-dashboard
npm install
npm start

# Docker setup
docker-compose -f docker-compose.dev.yml up -d
```

### 15.2 Testing Workflow

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd ../real-estate-dashboard
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 16. Security Considerations

### 16.1 Data Protection

- **Encryption at Rest**: All sensitive data encrypted with AES-256
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Management**: AWS KMS for encryption key management
- **Data Anonymization**: PII anonymization for analytics

### 16.2 Access Control

- **Multi-Factor Authentication**: Required for admin accounts
- **Role-Based Access**: Granular permissions per role
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete audit trail for all actions

### 16.3 Compliance

- **DSGVO Compliance**: Data protection and privacy by design
- **SOC 2 Type II**: Security controls and procedures
- **ISO 27001**: Information security management
- **Regular Security Audits**: Quarterly security assessments

---

## Conclusion

Die ImmoNow-Architektur implementiert eine robuste, skalierbare Multi-Tenant-SaaS-Plattform mit Enterprise-Sicherheitsstandards. Die harte Datenisolation, technische Durchsetzung von Abo-Limits und umfassende Sicherheitsmaßnahmen gewährleisten eine sichere und zuverlässige Plattform für Immobilienverwaltung.

### Key Architectural Decisions

1. **Multi-Tenant-Isolation**: Harte Trennung auf Datenbank- und Dateisystem-Ebene
2. **JWT-basierte Authentifizierung**: Skalierbare, stateless Authentifizierung
3. **Event-Driven Architecture**: WebSocket-basierte Echtzeit-Kommunikation
4. **Microservice-Ready**: Modulare Architektur für zukünftige Skalierung
5. **Security-First**: Umfassende Sicherheitsmaßnahmen auf allen Ebenen

### Future Enhancements

- **Kubernetes Deployment**: Container-Orchestrierung für bessere Skalierung
- **Event Sourcing**: Vollständige Audit-Trails und Event-History
- **GraphQL API**: Flexible API für komplexe Datenabfragen
- **Machine Learning**: KI-basierte Immobilienbewertung und Empfehlungen
