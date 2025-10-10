# Frontend ↔ Backend Integration Plan

Dieses Dokument bildet alle Tabs/Seiten des React-Frontends auf die bestehenden Backend-Endpunkte ab und dient als laufende To-do-Liste.

Basis-Setup
- Base URL: aus REACT_APP_API_URL (z. B. http://localhost:8000/api/v1)
- Auth: JWT per Authorization: Bearer <access_token>; Refresh optional (falls /auth/refresh vorhanden)
- CORS: clientseitig, kein CSRF (FastAPI)
- Trailing Slash: bei Collection-Routen bevorzugen (z. B. /contacts/), um 307-Redirects zu vermeiden
- Upload-Pfade: ohne Trailing Slash (z. B. /documents/upload), um unnötige 307 zu vermeiden
- Zentraler API-Client: src/api/config.ts (axios-Instance, Interceptors, Dev-Logger, GET-Cache mit TTL)
- Caching: In-Memory-GET-Cache (default TTL 60s), invalidiert bei mutierenden Requests

Tab/Seite | Route (Frontend) | Endpoint(s) | Methode | Request-Schema | Response-Schema | Status
--- | --- | --- | --- | --- | --- | ---
Login | /login (Modal/Seite) | /auth/login | POST | { email, password } | { access_token, refresh_token, token_type, user } | done
App Boot: Me | n/a (beim Start) | /auth/me | GET | Header: Bearer | { id, email, first_name, last_name, role, ... } | done
Dashboard (Rollenbasiert) | / | /dashboard/overview | GET | - | Overview JSON | done
Dashboard Classic | /dashboard-classic | /dashboard/overview | GET | - | Overview JSON | todo
Team-Status | /team-status | /dashboard/analytics/performance | GET | { period_days? } | KPIs | todo
Projektstatus Überblick | /projektstatus | (Frontend-Stub: /project-status/*) | GET | diverse | diverse | in progress
Aufgaben (Kanban) | /aufgaben | /tasks | GET | Filters (page,size,...) | TaskListResponse | in progress
Aufgabe Detail | /aufgaben/:id | /tasks/{id} | GET | Path id | TaskDetailResponse | in progress
Task Aktionen | - | /tasks (create), /tasks/{id} (patch/delete), /tasks/{id}/comments | POST/PATCH/DELETE | siehe schemas.tasks | TaskResponse/CommentResponse | in progress
Termine (Kalender) | /termine | /calendar/appointments | GET | Filters | AppointmentListResponse | in progress
Termin Detail | - | /calendar/appointments/{id} | GET | Path id | AppointmentDetailResponse | in progress
Immobilien Liste | /immobilien, /properties | /properties | GET | { page, limit, status, type, search } | PropertyListResponsePaginated | done (legacy ApiService unwraps .properties)
Immobilie Detail | /immobilien/:id | /properties/{id} | GET | Path id | PropertyResponse | done
Öffentlich: Suche | - | /properties/search | GET | Query | PropertyListResponse[] | todo
Öffentlich: Detail | - | /properties/{id}/public | GET | Path | PropertyResponse | todo
Kontakte Liste | /kontakte | /contacts/ | GET | { page,size,search,status,tags } | ContactListResponsePaginated | in progress
Kontakt Detail | /kontakte/:id | /contacts/{id} | GET | Path id | ContactDetailResponse | in progress
Dokumente Liste | /documents, /dokumente | /documents | GET | { page,size,search,... } | DocumentListResponse | in progress
Dokument Upload | - | /documents/upload | POST | FormData Felder lt. backend | DocumentUploadResponse | in progress (Pfad normalisiert)
Dokument Download | - | /documents/{id}/download | GET | Path id | File | todo
CIM Dashboard | /cim | /measures/dashboard/overview | GET | - | DashboardListResponse | in progress
Measures Tracking | /measures | /measures, /measures/{id}, /measures/{id}/values | GET/POST | lt. schemas.measures | Metric/List/ValueResponse | in progress
Admin | /admin | /auth/users (nur Admin) | GET | page,limit | Users list | todo
Finanzierung | /finance | (Frontend-intern) | - | - | - | n/a

Hinweise
- Exakte Schemas siehe Backend unter backend/cim_app/cim_app/cim/schemas/*.
- Standardisiere Fehlertexte aus error.response.data.detail.
- Pro Seite data-testid-Attribute ergänzen (smoke tests) – folgt iterativ.
- Performance: Nutze React Query Stale/GC Times und den neuen API-GET-Cache (TTL je Call anpassbar) für spürbar schnellere Ladezeiten. Dashboard nutzt zentralen Client; Properties-List extrahiert paginierte .properties.

Statuslegende: todo = offen, in progress = teilweise angebunden, done = vollständig angebunden und manuell getestet.
