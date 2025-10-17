# ImmoNow - Real Estate Management Platform

Eine vollständige Immobilienverwaltungsplattform mit React-Frontend und Django + FastAPI-Backend.

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+ und npm
- Python 3.9+
- Git

### Backend Setup

1. **Backend-Verzeichnis öffnen:**
   ```bash
   cd backend
   ```

2. **Virtuelle Umgebung erstellen und aktivieren:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

3. **Abhängigkeiten installieren:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp env.example .env
   # Bearbeiten Sie .env mit Ihren Einstellungen
   ```

5. **Datenbank migrieren:**
   ```bash
   python manage.py migrate
   ```

6. **Superuser erstellen:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Backend starten:**
   ```bash
   python app/main.py
   ```

Das Backend läuft auf `http://localhost:8000`

### Frontend Setup

1. **Frontend-Verzeichnis öffnen:**
   ```bash
   cd real-estate-dashboard
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp env.example .env.local
   # Bearbeiten Sie .env.local mit Ihren Einstellungen
   ```

4. **Frontend starten:**
   ```bash
   npm start
   ```

Das Frontend läuft auf `http://localhost:3000`

## 📁 Projektstruktur

```
ImmoNow/
├── backend/                 # Django + FastAPI Backend
│   ├── app/
│   │   ├── api/v1/         # API Endpoints
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic
│   │   ├── db/models/      # Django Models
│   │   └── core/           # Core Settings
│   ├── requirements.txt
│   └── env.example
├── real-estate-dashboard/   # React Frontend
│   ├── src/
│   │   ├── api/            # API Hooks & Types
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── lib/            # Utilities
│   │   └── contexts/       # React Contexts
│   ├── package.json
│   └── env.example
└── docs/                   # Dokumentation
```

## 🔧 API-Integration

### Neue API-Hooks verwenden

Das Frontend verwendet React Query für API-Calls. Hier ein Beispiel:

```typescript
import { useProperties, useCreateProperty } from '../api/hooks';

function PropertiesPage() {
  const { data: properties, isLoading } = useProperties({
    page: 1,
    size: 20,
    search: 'Berlin'
  });
  
  const createProperty = useCreateProperty();
  
  const handleCreate = async () => {
    await createProperty.mutateAsync({
      title: 'Neue Immobilie',
      property_type: 'apartment',
      price: 250000,
      location: 'Berlin'
    });
  };
  
  if (isLoading) return <div>Lade...</div>;
  
  return (
    <div>
      {properties?.items.map(property => (
        <div key={property.id}>{property.title}</div>
      ))}
    </div>
  );
}
```

### Verfügbare Hooks

- **Auth:** `useAuth`, `useCurrentUser`, `useCurrentTenant`
- **Properties:** `useProperties`, `useCreateProperty`, `useUpdateProperty`
- **Documents:** `useDocuments`, `useUploadDocument`, `useDocumentFolders`
- **Tasks:** `useTasks`, `useCreateTask`, `useUpdateTask`
- **Contacts:** `useContacts`, `useCreateContact`, `useUpdateContact`
- **Analytics:** `useDashboardAnalytics`, `usePropertyAnalytics`
- **Communications:** `useConversations`, `useSendMessage`
- **Social:** `useSocialAccounts`, `useSocialPosts`, `useCreateSocialPost`
- **Finance:** `useFinancingCalculation`, `useInvestmentAnalysis`

## 🗄️ Datenbank

### SQLite (Standard)
Keine zusätzliche Konfiguration erforderlich.

### PostgreSQL (Produktion)
```bash
# In .env setzen:
USE_POSTGRES=True
DB_NAME=immonow
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

## 🔐 Authentifizierung

Das System verwendet JWT-Token für die Authentifizierung:

- **Access Token:** 30 Minuten gültig
- **Refresh Token:** 7 Tage gültig
- **Automatische Token-Erneuerung** im Frontend

## 📊 Features

### ✅ Implementiert
- **Authentifizierung:** Login, Register, Token-Refresh
- **Immobilien:** CRUD-Operationen, Suche, Filter
- **Dokumente:** Upload, Download, Ordnerstruktur
- **Aufgaben:** Kanban-Board, Prioritäten, Zuweisungen
- **Kontakte:** Lead-Management, Scoring
- **Analytics:** Dashboard, KPIs, Charts
- **Multi-Tenancy:** Mandantenfähigkeit

### 🚧 In Entwicklung
- **Communications:** Chat-System
- **Social Hub:** Social Media Management
- **Finance:** Finanzierungsrechner
- **AVM:** Automatische Wertermittlung
- **Investor Dashboard:** Portfolio-Management

## 🛠️ Entwicklung

### Backend-Entwicklung

1. **Neue API-Route erstellen:**
   ```python
   # backend/app/api/v1/example.py
   from fastapi import APIRouter
   from app.schemas.example import ExampleResponse
   
   router = APIRouter()
   
   @router.get("/example", response_model=ExampleResponse)
   async def get_example():
       return ExampleResponse(data="Hello World")
   ```

2. **Schema definieren:**
   ```python
   # backend/app/schemas/example.py
   from pydantic import BaseModel
   
   class ExampleResponse(BaseModel):
       data: str
   ```

3. **Service implementieren:**
   ```python
   # backend/app/services/example_service.py
   class ExampleService:
       def __init__(self, tenant_id: str):
           self.tenant_id = tenant_id
       
       async def get_example(self):
           return {"data": "Hello World"}
   ```

### Frontend-Entwicklung

1. **Neue Hook erstellen:**
   ```typescript
   // src/api/hooks.ts
   export const useExample = () => {
     return useQuery({
       queryKey: ['example'],
       queryFn: () => apiClient.get<ExampleResponse>('/api/v1/example')
     });
   };
   ```

2. **Types definieren:**
   ```typescript
   // src/api/types.gen.ts
   export interface ExampleResponse {
     data: string;
   }
   ```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd real-estate-dashboard
npm test
```

## 🚀 Deployment

### Docker (Empfohlen)
```bash
# Backend
cd backend
docker build -t immonow-backend .
docker run -p 8000:8000 immonow-backend

# Frontend
cd real-estate-dashboard
docker build -t immonow-frontend .
docker run -p 3000:3000 immonow-frontend
```

### Manuell
1. Backend auf Server deployen
2. Frontend builden: `npm run build`
3. Statische Dateien auf Web-Server bereitstellen

## 📝 API-Dokumentation

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Schema:** `http://localhost:8000/openapi.json`

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen: `git checkout -b feature/amazing-feature`
3. Änderungen committen: `git commit -m 'Add amazing feature'`
4. Branch pushen: `git push origin feature/amazing-feature`
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Dokumentation durchsuchen
- Team kontaktieren

---

**ImmoNow** - Moderne Immobilienverwaltung für das digitale Zeitalter 🏠✨
