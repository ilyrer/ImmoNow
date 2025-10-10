# Backend Contract Documentation

## 0. Globale Konventionen

### Authentifizierung & Autorisierung
- **JWT Bearer Token**: `Authorization: Bearer <token>`
- **Multi-Tenancy**: `X-Tenant-ID: <tenant_id>` Header (oder aus Auth-Token abgeleitet)
- **Rollen**: `admin`, `employee`, `customer`
- **Scopes**: `read`, `write`, `delete`, `admin`

### Pagination
```python
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    
class PaginatedResponse(BaseModel):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
```

### Sortierung & Filterung
```python
class SortParams(BaseModel):
    sort_by: Optional[str] = None
    sort_order: Literal['asc', 'desc'] = 'asc'
```

### Fehler-Envelope (Pydantic)
```python
class ErrorResponse(BaseModel):
    detail: Union[str, List[Dict[str, Any]]]
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

### Zeit/Format
- **ISO-8601 UTC**: `2024-01-15T10:30:00Z`
- **Date-Only**: `2024-01-15`

### React Query Konventionen
- **Query Keys**: `['resource', 'list', filters]`, `['resource', 'detail', id]`
- **Cache Invalidation**: Nach Mutations automatisch
- **Stale Time**: 2-5 Minuten je nach Datenart

### Standard-Response-Wrapper
```python
class PageResponse(BaseModel):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
```

## 1. Seitenübersicht

### `/pages/DocumentsPage.tsx` — Dokumentenverwaltung
**Zweck**: Moderne Dokumentenverwaltung mit Ordnerstruktur, Upload, Analytics
**UI-Funktionen**: Liste, Filter, Sortierung, Upload, Ordner-Management, Favoriten
**Daten-Abhängigkeiten**: Dokumente, Ordner, Tags, Analytics, Upload-Status
**Aktionen**: Upload, Löschen, Favorisieren, Ordner erstellen/bearbeiten/löschen

#### Erforderliche Endpunkte:

**GET /documents** — Dokumente auflisten
- **Beschreibung**: Paginierte Liste aller Dokumente mit erweiterten Filtern
- **Auth/Rollen**: `read` scope, alle Rollen
- **Header**: `Authorization`, `X-Tenant-ID`
- **Query-Params**: 
  - `page`, `size` (Pagination)
  - `search` (string)
  - `folder_id` (int)
  - `document_type` (string)
  - `status` (string)
  - `category_id` (int)
  - `property_id` (int)
  - `favorites_only` (bool)
  - `has_expiry` (bool)
  - `is_expired` (bool)
  - `sort_by` (created_at|title|file_size|updated_at)
  - `sort_order` (asc|desc)
- **Response-Schema**:
```python
class DocumentResponse(BaseModel):
    id: str
    name: str
    original_name: str
    title: str
    type: DocumentType
    category: DocumentCategory
    status: DocumentStatus
    visibility: DocumentVisibility
    size: int
    mime_type: str
    url: str
    thumbnail_url: Optional[str]
    property_id: Optional[str]
    property_title: Optional[str]
    contact_id: Optional[str]
    contact_name: Optional[str]
    uploaded_by: str
    uploaded_at: datetime
    created_at: datetime
    last_modified: datetime
    version: int
    tags: List[str]
    description: Optional[str]
    expiry_date: Optional[datetime]
    is_favorite: bool
    view_count: int
    download_count: int
    folder_id: Optional[int]
    folder_name: Optional[str]

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    size: int
    pages: int
```
- **Statuscodes**: 200 OK, 401 Unauthorized, 403 Forbidden
- **React Query**: `['documents', 'list', filters]`
- **Cache**: 2 Minuten

**POST /documents/upload** — Dokument hochladen
- **Beschreibung**: Upload mit Fortschrittsanzeige und Duplikat-Behandlung
- **Auth/Rollen**: `write` scope, employee/admin
- **Header**: `Authorization`, `X-Tenant-ID`, `Content-Type: multipart/form-data`
- **Request-Schema**: FormData mit `file`, `metadata` (JSON)
- **Response-Schema**: `DocumentResponse`
- **Statuscodes**: 201 Created, 400 Bad Request, 409 Conflict (Duplikat)
- **React Query**: Invalidate `['documents']`
- **Cache**: Keine

**PUT /documents/{id}/favorite** — Favorit togglen
- **Beschreibung**: Dokument als Favorit markieren/entfernen
- **Auth/Rollen**: `write` scope, alle Rollen
- **Path-Params**: `id` (string)
- **Response-Schema**: `{"is_favorite": bool}`
- **React Query**: Invalidate `['documents']`

**DELETE /documents/{id}** — Dokument löschen
- **Auth/Rollen**: `delete` scope, employee/admin
- **React Query**: Invalidate `['documents']`

**GET /documents/folders** — Ordner auflisten
- **Response-Schema**:
```python
class DocumentFolderResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    path: str
    color: str
    icon: str
    is_system: bool
    created_by: str
    created_at: datetime
    document_count: int
    subfolders: List['DocumentFolderResponse']
```

**POST /documents/folders** — Ordner erstellen
- **Request-Schema**:
```python
class CreateFolderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    parent_folder_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
```

**DELETE /documents/folders/{id}** — Ordner löschen
- **Statuscodes**: 403 Forbidden (Ordner hat Inhalt)
- **Business Logic**: Bestätigung erforderlich für nicht-leere Ordner

**GET /documents/analytics** — Dokument-Analytics
- **Response-Schema**:
```python
class DocumentAnalyticsResponse(BaseModel):
    total_documents: int
    total_folders: int
    total_views: int
    views_this_month: int
    favorite_documents: int
    shared_documents: int
    storage_used: int
    storage_limit: Optional[int]
    most_viewed_documents: List[Dict[str, Any]]
    counts: Dict[str, Any]
    charts: Dict[str, List[Dict[str, Any]]]
    recent_activities: List[Dict[str, Any]]
```

### `/pages/KanbanPage.tsx` — Task-Management
**Zweck**: Professionelles Kanban-Board für Aufgabenverwaltung
**UI-Funktionen**: Drag&Drop, Filter, Bulk-Actions, Statistiken, Keyboard-Shortcuts
**Daten-Abhängigkeiten**: Tasks, Employees, Board-Columns, Statistics
**Aktionen**: CRUD Tasks, Move Tasks, Bulk-Update, Create/Update/Delete

#### Erforderliche Endpunkte:

**GET /tasks** — Tasks auflisten
- **Query-Params**: Standard Pagination + Filter
- **Response-Schema**:
```python
class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee: TaskAssignee
    due_date: datetime
    start_date: Optional[datetime]
    progress: int = Field(0, ge=0, le=100)
    estimated_hours: int
    actual_hours: Optional[int]
    tags: List[str]
    labels: List[TaskLabel]
    subtasks: List[Subtask]
    comments: List[TaskComment]
    attachments: List[TaskDocument]
    property: Optional[PropertyInfo]
    financing_status: Optional[FinancingStatus]
    activity_log: List[ActivityLogEntry]
    created_at: datetime
    updated_at: datetime
    created_by: TaskAssignee
    archived: bool = False
    blocked: Optional[BlockedInfo]

class TaskAssignee(BaseModel):
    id: str
    name: str
    avatar: str
    role: Optional[str]
    email: Optional[str]

class TaskLabel(BaseModel):
    id: str
    name: str
    color: str
    description: Optional[str]
```

**POST /tasks** — Task erstellen
- **Request-Schema**:
```python
class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    priority: TaskPriority = TaskPriority.medium
    assignee_id: str
    due_date: datetime
    start_date: Optional[datetime] = None
    estimated_hours: int = Field(1, ge=1, le=1000)
    tags: List[str] = Field(default_factory=list)
    property_id: Optional[str] = None
    financing_status: Optional[FinancingStatus] = None
```

**PUT /tasks/{id}** — Task aktualisieren
- **Request-Schema**: `Partial[CreateTaskRequest]`

**PATCH /tasks/{id}/move** — Task verschieben
- **Request-Schema**:
```python
class MoveTaskRequest(BaseModel):
    column_id: Optional[int] = None
    position: Optional[int] = None
    new_status: Optional[TaskStatus] = None
```

**GET /employees** — Mitarbeiter auflisten
- **Response-Schema**:
```python
class EmployeeResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    role: str
    department: Optional[str]
    is_active: bool
```

**GET /tasks/statistics** — Task-Statistiken
- **Response-Schema**:
```python
class TaskStatisticsResponse(BaseModel):
    total_tasks: int
    active_tasks: int
    completed_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    total_estimated_hours: int
    total_actual_hours: int
    completion_rate: float
    tasks_by_priority: Dict[TaskPriority, int]
    tasks_by_status: Dict[TaskStatus, int]
    tasks_by_assignee: Dict[str, int]
    upcoming_deadlines: List[TaskResponse]
    recent_activity: List[ActivityLogEntry]
```

### `/pages/InvestorDashboard.tsx` — Investor-Portal
**Zweck**: Portfolio-Management für Investoren
**UI-Funktionen**: Portfolio-Übersicht, KPIs, Asset-Tabelle, Filter/Sortierung
**Daten-Abhängigkeiten**: Investor-Assets, KPIs, Market-Data
**Aktionen**: Portfolio-Analyse, Asset-Details

#### Erforderliche Endpunkte:

**GET /investor/portfolio** — Portfolio-Daten
- **Response-Schema**:
```python
class InvestorAssetResponse(BaseModel):
    id: str
    address: str
    city: str
    type: PropertyType
    sqm: int
    value: float
    roi: float
    cashflow: float
    status: str
    purchase_date: datetime
    purchase_price: float
    current_value: float
    monthly_rent: float
    occupancy_rate: float
    maintenance_costs: float
    property_tax: float
    insurance: float

class PortfolioKPIsResponse(BaseModel):
    total_value: float
    average_roi: float
    total_cashflow: float
    vacancy_rate: float
    asset_count: int
    monthly_income: float
    annual_return: float
    portfolio_growth: float
```

### `/pages/CIMPage.tsx` — Central Information Model
**Zweck**: Zentrale Übersicht über Properties, Contacts, Perfect Matches
**UI-Funktionen**: Dashboard mit KPIs, Recent Items, Perfect Matches
**Daten-Abhängigkeiten**: Properties, Contacts, Matches, Summary-Statistics
**Aktionen**: Filter nach Zeitraum, Detail-Ansichten

#### Erforderliche Endpunkte:

**GET /cim/overview** — CIM Dashboard-Übersicht
- **Query-Params**: `limit`, `days_back`, `property_status`, `contact_status`
- **Response-Schema**:
```python
class CIMOverviewResponse(BaseModel):
    recent_properties: List[RecentPropertySummary]
    recent_contacts: List[RecentContactSummary]
    perfect_matches: List[PerfectMatch]
    summary: CIMSummary
    generated_at: datetime

class RecentPropertySummary(BaseModel):
    id: str
    title: str
    address: str
    price: Optional[float]
    price_formatted: str
    status: str
    status_label: str
    created_at: datetime
    last_contact: Optional[datetime]
    lead_quality: Literal['high', 'medium', 'low']
    lead_quality_label: str
    contact_count: int
    match_score: Optional[float]

class RecentContactSummary(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    status: str
    status_label: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    budget_currency: str
    budget_formatted: str
    created_at: datetime
    last_contact: Optional[datetime]
    last_action: str
    lead_score: int
    matching_properties: List[str]
    matching_count: int

class PerfectMatch(BaseModel):
    contact_id: str
    contact_name: str
    contact_budget: str
    property_id: str
    property_title: str
    property_price: str
    match_score: float
    lead_quality: str
    contact_lead_score: int

class CIMSummary(BaseModel):
    total_properties: int
    active_properties: int
    new_properties_last_30_days: int
    total_contacts: int
    new_leads_last_30_days: int
    high_priority_contacts: int
    matched_contacts_properties: int
```

### `/pages/AvmPage.tsx` — Automatische Wertermittlung
**Zweck**: AVM-Bewertung mit Vergleichsobjekten und Marktintelligenz
**UI-Funktionen**: Eingabeformular, Bewertungsergebnis, Vergleichsobjekte, Markttrends
**Daten-Abhängigkeiten**: AVM-Request, AVM-Result, Comparables, Market-Intelligence
**Aktionen**: Bewertung durchführen, Vergleichsobjekte anzeigen

#### Erforderliche Endpunkte:

**POST /avm/valuate** — Immobilie bewerten
- **Request-Schema**:
```python
class AvmRequest(BaseModel):
    address: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., regex=r'^\d{5}$')
    property_type: PropertyType
    size: int = Field(..., ge=10, le=10000)
    rooms: Optional[int] = Field(None, ge=1, le=20)
    build_year: Optional[int] = Field(None, ge=1800, le=2024)
    condition: Literal['new', 'renovated', 'good', 'needs_renovation', 'poor']
    features: List[str] = Field(default_factory=list)
```

- **Response-Schema**:
```python
class AvmResult(BaseModel):
    estimated_value: float
    confidence_level: Literal['high', 'medium', 'low']
    valuation_range: ValuationRange
    price_per_sqm: float
    methodology: str
    factors: List[ValuationFactor]
    comparables_used: int
    last_updated: datetime

class ValuationRange(BaseModel):
    min: float
    max: float

class ValuationFactor(BaseModel):
    name: str
    impact: Literal['positive', 'neutral', 'negative']
    weight: int
    description: str

class ComparableListing(BaseModel):
    id: str
    address: str
    city: str
    postal_code: str
    property_type: PropertyType
    size: int
    rooms: Optional[int]
    build_year: int
    condition: str
    price: float
    price_per_sqm: float
    sold_date: datetime
    distance: float
    match_score: float

class MarketIntelligence(BaseModel):
    region: str
    postal_code: str
    demand_level: Literal['very_high', 'high', 'medium', 'low']
    supply_level: Literal['very_high', 'high', 'medium', 'low']
    price_growth_12m: float
    price_growth_36m: float
    average_days_on_market: int
    competition_index: int
    trends: List[MarketTrendPoint]

class MarketTrendPoint(BaseModel):
    date: str
    average_price: float
    average_price_per_sqm: float
    transaction_count: int
    median_price: float
    region: str
```

### `/pages/CalendarPage.tsx` — Terminplaner
**Zweck**: Terminverwaltung und Kalender-Integration
**UI-Funktionen**: Terminliste, Filter, Statistiken, CRUD-Operationen
**Daten-Abhängigkeiten**: Appointments, Calendar-Day-Data
**Aktionen**: Termine erstellen/bearbeiten/löschen, Status ändern

#### Erforderliche Endpunkte:

**GET /appointments** — Termine auflisten
- **Query-Params**: `start_date`, `end_date`
- **Response-Schema**:
```python
class AppointmentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    type: Literal['viewing', 'call', 'meeting', 'consultation', 'signing', 'inspection']
    status: Literal['draft', 'confirmed', 'cancelled', 'completed', 'no_show']
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str]
    attendees: List[Attendee]
    property_id: Optional[str]
    property_title: Optional[str]
    contact_id: Optional[str]
    contact_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by: str

class Attendee(BaseModel):
    id: str
    name: str
    email: str
    role: Optional[str]
    status: Literal['pending', 'accepted', 'declined']
```

**POST /appointments** — Termin erstellen
**PUT /appointments/{id}** — Termin aktualisieren
**DELETE /appointments/{id}** — Termin löschen

### `/pages/PropertiesPage.tsx` — Immobilienverwaltung
**Zweck**: Immobilienliste mit erweiterten Filtern und CRUD-Operationen
**UI-Funktionen**: Liste, Filter, Sortierung, Create/Edit-Modals, Status-Management
**Daten-Abhängigkeiten**: Properties, Addresses, Contact-Persons, Features
**Aktionen**: CRUD Properties, Status-Änderungen, Bulk-Operations

#### Erforderliche Endpunkte:

**GET /properties** — Immobilien auflisten
- **Response-Schema**:
```python
class PropertyResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    property_type: PropertyType
    price: Optional[float]
    location: str
    living_area: Optional[int]
    rooms: Optional[int]
    bathrooms: Optional[int]
    year_built: Optional[int]
    address: Optional[Address]
    contact_person: Optional[ContactPerson]
    features: Optional[PropertyFeatures]
    images: List[PropertyImage]
    created_at: datetime
    updated_at: datetime
    created_by: str

class Address(BaseModel):
    street: str
    city: str
    zip_code: str
    state: str
    country: str

class ContactPerson(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str

class PropertyFeatures(BaseModel):
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    year_built: Optional[int]
    energy_class: Optional[str]
    heating_type: Optional[str]
    parking_spaces: Optional[int]
    balcony: bool = False
    garden: bool = False
    elevator: bool = False
```

**POST /properties** — Immobilie erstellen
**PUT /properties/{id}** — Immobilie aktualisieren
**DELETE /properties/{id}** — Immobilie löschen

## 2. Gemeinsame Modelle

### User/Employee
```python
class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: Literal['admin', 'employee', 'customer']
    avatar: Optional[str]
    is_active: bool
    tenant_id: str
    created_at: datetime
    last_login: Optional[datetime]
```

### Contact
```python
class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    company: Optional[str]
    status: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    budget_currency: str
    preferences: Dict[str, Any]
    lead_score: int
    created_at: datetime
    updated_at: datetime
```

### Property
```python
class PropertyResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    property_type: PropertyType
    price: Optional[float]
    location: str
    living_area: Optional[int]
    rooms: Optional[int]
    bathrooms: Optional[int]
    year_built: Optional[int]
    address: Optional[Address]
    contact_person: Optional[ContactPerson]
    features: Optional[PropertyFeatures]
    images: List[PropertyImage]
    created_at: datetime
    updated_at: datetime
```

### Task
```python
class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee: TaskAssignee
    due_date: datetime
    progress: int
    estimated_hours: int
    actual_hours: Optional[int]
    tags: List[str]
    property: Optional[PropertyInfo]
    created_at: datetime
    updated_at: datetime
```

### Document
```python
class DocumentResponse(BaseModel):
    id: str
    name: str
    title: str
    type: DocumentType
    category: DocumentCategory
    status: DocumentStatus
    visibility: DocumentVisibility
    size: int
    mime_type: str
    url: str
    uploaded_by: str
    uploaded_at: datetime
    is_favorite: bool
    view_count: int
    download_count: int
```

### Notification
```python
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime
    action_url: Optional[str]
```

### Tag
```python
class TagResponse(BaseModel):
    id: str
    name: str
    color: str
    usage_count: int
```

### Comment
```python
class CommentResponse(BaseModel):
    id: str
    author: UserResponse
    text: str
    timestamp: datetime
    parent_id: Optional[str]
    mentions: List[str]
    reactions: List[Reaction]
```

### AuditLog
```python
class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    user: UserResponse
    action: str
    resource_type: str
    resource_id: str
    old_values: Dict[str, Any]
    new_values: Dict[str, Any]
    description: str
```

## 3. Rechte & Sichtbarkeiten

### Ressource × Rolle Matrix

| Ressource | Admin | Employee | Customer |
|-----------|-------|----------|----------|
| Properties | CRUD | CRUD | R |
| Tasks | CRUD | CRUD | R (own) |
| Documents | CRUD | CRUD | R (assigned) |
| Contacts | CRUD | CRUD | R (own) |
| Appointments | CRUD | CRUD | R (own) |
| Analytics | R | R | R (own) |
| AVM | R | R | R |
| CIM | R | R | R (own) |

### Multi-Tenant-Isolation
- Alle Endpunkte müssen `tenant_id` berücksichtigen
- Daten werden automatisch nach Tenant gefiltert
- Cross-Tenant-Zugriffe sind nicht möglich

## 4. Technische Leitplanken (Backend-Umsetzung)

### FastAPI Routing
```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer

router = APIRouter(prefix="/api/v1")
security = HTTPBearer()

@router.get("/documents", response_model=PaginatedResponse[DocumentResponse])
async def get_documents(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    # Implementation
```

### Django-ORM Integration
```python
from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    category = models.CharField(max_length=50, choices=DOCUMENT_CATEGORIES)
    status = models.CharField(max_length=50, choices=DOCUMENT_STATUSES)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    url = models.URLField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_favorite = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'documents'
        indexes = [
            models.Index(fields=['tenant', 'type']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'uploaded_at']),
        ]
```

### Serialisierung
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    CONTRACT = "contract"
    EXPOSE = "expose"
    ENERGY_CERTIFICATE = "energy_certificate"
    FLOOR_PLAN = "floor_plan"
    PHOTO = "photo"
    VIDEO = "video"
    DOCUMENT = "document"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    PDF = "pdf"
    OTHER = "other"

class DocumentResponse(BaseModel):
    id: str
    name: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    type: DocumentType
    category: str
    status: str
    visibility: str
    size: int = Field(..., ge=0)
    mime_type: str
    url: str
    uploaded_by: str
    uploaded_at: datetime
    is_favorite: bool = False
    view_count: int = Field(0, ge=0)
    download_count: int = Field(0, ge=0)
    
    @validator('mime_type')
    def validate_mime_type(cls, v):
        allowed_types = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ]
        if v not in allowed_types:
            raise ValueError('Unsupported file type')
        return v
    
    class Config:
        from_attributes = True
```

### Dateien/Uploads
```python
from fastapi import UploadFile, File
import boto3
from botocore.exceptions import ClientError

class FileUploadService:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = settings.AWS_S3_BUCKET
    
    async def upload_file(
        self, 
        file: UploadFile, 
        tenant_id: str,
        folder_path: str = ""
    ) -> Dict[str, Any]:
        # File validation
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(400, "File too large")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1]
        s3_key = f"{tenant_id}/documents/{folder_path}/{file_id}.{file_extension}"
        
        # Upload to S3
        try:
            self.s3_client.upload_fileobj(
                file.file, 
                self.bucket_name, 
                s3_key,
                ExtraArgs={
                    'ContentType': file.content_type,
                    'Metadata': {
                        'original-name': file.filename,
                        'tenant-id': tenant_id
                    }
                }
            )
        except ClientError as e:
            raise HTTPException(500, "Upload failed")
        
        return {
            'file_id': file_id,
            'url': f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}",
            'size': file.size,
            'mime_type': file.content_type
        }
```

### Auditing
```python
class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['tenant', 'timestamp']),
            models.Index(fields=['tenant', 'user', 'timestamp']),
            models.Index(fields=['tenant', 'resource_type', 'resource_id']),
        ]

def audit_action(user, action, resource_type, resource_id, old_values=None, new_values=None):
    AuditLog.objects.create(
        tenant=user.tenant,
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values or {},
        new_values=new_values or {},
        ip_address=request.client.host,
        user_agent=request.headers.get('user-agent', '')
    )
```

### Idempotenz
```python
from fastapi import Header
import hashlib

def generate_idempotency_key(request_data: Dict[str, Any]) -> str:
    """Generate idempotency key from request data"""
    data_str = json.dumps(request_data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    idempotency_key: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user)
):
    if idempotency_key:
        # Check if request was already processed
        existing_upload = await get_upload_by_idempotency_key(idempotency_key)
        if existing_upload:
            return existing_upload
    
    # Process upload
    result = await upload_service.upload_file(file, current_user.tenant_id)
    
    if idempotency_key:
        await save_upload_idempotency_key(idempotency_key, result)
    
    return result
```

## 5. Seitenliste (Inhaltsverzeichnis)

- [DocumentsPage.tsx](#pagesdocumentspagetsx--dokumentenverwaltung)
- [KanbanPage.tsx](#pageskanbanpagetsx--task-management)
- [InvestorDashboard.tsx](#pagesinvestordashboardtsx--investor-portal)
- [CIMPage.tsx](#pagescimpagetsx--central-information-model)
- [AvmPage.tsx](#pagesavmpagetsx--automatische-wertermittlung)
- [CalendarPage.tsx](#pagescalendarpagetsx--terminplaner)
- [PropertiesPage.tsx](#pagespropertiespagetsx--immobilienverwaltung)
- [ContactsPage.tsx](#pagescontactspagetsx--kontaktverwaltung)
- [TasksPage.tsx](#pagestaskspagetsx--aufgabenverwaltung)
- [SettingsPage.tsx](#pagessettingspagetsx--einstellungen)
- [ReportsPage.tsx](#pagesreportspagetsx--berichte)
- [IntegrationsPage.tsx](#pagesintegrationspagetsx--integrationen)
- [MailboxPage.tsx](#pagesmailboxpagetsx--posteingang)
- [MessagesPage.tsx](#pagesmessagespagetsx--nachrichten)
- [MatchingPage.tsx](#pagesmatchingpagetsx--matching)
- [CommunicationsHub.tsx](#pagescommunicationscommunicationshubtsx--kommunikations-hub)
- [ChatView.tsx](#pagescommunicationschatviewtsx--chat-view)

---

**Hinweise zur Implementierung:**
- Alle Endpunkte müssen Multi-Tenancy unterstützen
- JWT-Authentifizierung ist erforderlich
- Rate Limiting sollte implementiert werden
- Alle Mutations sollten auditiert werden
- File Uploads sollten über S3/MinIO erfolgen
- React Query Cache-Invalidation ist kritisch für UX
- Error-Handling sollte konsistent sein
- API-Versionierung über URL-Path (`/api/v1/`)
