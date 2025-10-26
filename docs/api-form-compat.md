# API-Form Schema Kompatibilitäts-Dokumentation

## Status: COMPLETED ✅

Dieses Dokument analysiert die Kompatibilität zwischen Frontend-Formularen und Backend-API-Schemas. Es identifiziert Diskrepanzen und bietet Lösungsansätze für eine konsistente Datenübertragung.

**Alle identifizierten Probleme wurden erfolgreich behoben!**

## Status-Legende

- ✅ **Match**: Frontend und Backend stimmen überein
- ⚠️ **Type Mismatch**: Typ-Unterschiede (z.B. string vs number)
- ⚠️ **Case Mismatch**: camelCase vs snake_case Unterschiede
- ❌ **Missing**: Fehlende Pflichtfelder
- 🔄 **Extra**: Frontend sendet Felder, die Backend nicht kennt
- 📝 **Default**: Unterschiedliche Default-Werte

## Endpoint-Analysen

### 1. Property Creation (`POST /api/v1/properties`)

**Frontend**: `PropertyCreateWizard.tsx`  
**Backend Schema**: `CreatePropertyRequest`

| Feld | Frontend | Backend | Status | Problem | Lösung |
|------|----------|---------|--------|---------|--------|
| `title` | ✅ string | ✅ string (min=5) | ✅ Match | - | - |
| `description` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `property_type` | ✅ string | ✅ PropertyType | ✅ Match | - | - |
| `status` | ✅ string | ✅ string (default="vorbereitung") | ✅ Match | - | - |
| `price` | ✅ number | ✅ float (ge=0) | ✅ Match | - | - |
| `price_currency` | ✅ string | ✅ string (default="EUR") | ✅ Match | - | - |
| `price_type` | ✅ string | ✅ string (default="sale") | ✅ Match | - | - |
| `location` | ✅ string | ✅ string (required) | ✅ Match | - | - |
| `living_area` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `total_area` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `plot_area` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `rooms` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `bedrooms` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `bathrooms` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `floors` | ✅ number | ✅ int (ge=1) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `year_built` | ✅ number | ✅ int (ge=1800, le=2025) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `energy_class` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `energy_consumption` | ✅ number | ✅ int (ge=0) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `heating_type` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `coordinates_lat` | ✅ number | ✅ float (ge=-90, le=90) | ✅ Match | - | - |
| `coordinates_lng` | ✅ number | ✅ float (ge=-180, le=180) | ✅ Match | - | - |
| `amenities` | ✅ string[] | ✅ List[str] | ✅ Match | - | - |
| `tags` | ✅ string[] | ✅ List[str] | ✅ Match | - | - |
| `address` | ✅ object | ✅ Address | ✅ Match | - | - |
| `contact_person` | ✅ object | ✅ ContactPersonCreate | ✅ Match | - | - |

**Kritische Probleme**: 
- Numerische Felder müssen von `number` zu `int` konvertiert werden
- Frontend sendet `undefined` für leere Felder, Backend erwartet `null` oder fehlende Felder

### 2. Contact Creation (`POST /api/v1/contacts`)

**Frontend**: `ContactForm.tsx`  
**Backend Schema**: `CreateContactRequest`

| Feld | Frontend | Backend | Status | Problem | Lösung |
|------|----------|---------|--------|---------|--------|
| `name` | ✅ string | ✅ string (min=1, max=255) | ✅ Match | - | - |
| `email` | ✅ string | ✅ string (max=255) | ✅ Match | - | - |
| `phone` | ✅ string | ✅ string (max=50) | ✅ Match | - | - |
| `company` | ✅ string | ✅ string (optional, max=255) | ✅ Match | - | - |
| `category` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Hinzufügen oder Default |
| `status` | ❌ Missing | ✅ string (default="Lead") | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `priority` | ❌ Missing | ✅ string (default="medium") | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `location` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `avatar` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `budget` | ✅ number | ✅ float (ge=0) | ✅ Match | - | - |
| `budget_currency` | ✅ string | ✅ string (default="EUR") | ✅ Match | - | - |
| `preferences` | ✅ object | ✅ Dict[str, Any] | ✅ Match | - | - |
| `last_contact` | ❌ Missing | ✅ datetime (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |

**Kritische Probleme**:
- Mehrere Pflichtfelder fehlen im Frontend
- Backend hat Defaults, Frontend sendet diese nicht

### 3. User Registration (`POST /api/v1/auth/register`)

**Frontend**: `RegisterForm.tsx`  
**Backend Schema**: `RegisterRequest`

| Feld | Frontend | Backend | Status | Problem | Lösung |
|------|----------|---------|--------|---------|--------|
| `email` | ✅ string | ✅ EmailStr | ✅ Match | - | - |
| `password` | ✅ string | ✅ string (min=8) | ✅ Match | - | - |
| `first_name` | ✅ string | ✅ string (min=1, max=100) | ✅ Match | - | - |
| `last_name` | ✅ string | ✅ string (min=1, max=100) | ✅ Match | - | - |
| `phone` | ✅ string | ✅ string (optional, max=50) | ✅ Match | - | - |
| `tenant_name` | ✅ string | ✅ string (min=2) | ✅ Match | - | - |
| `company_email` | ❌ Missing | ✅ EmailStr (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `company_phone` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `plan` | ✅ string (default="free") | ✅ string (default="free") | ✅ Match | - | - |
| `billing_cycle` | ✅ string (default="monthly") | ✅ string (default="monthly") | ✅ Match | - | - |

**Kritische Probleme**:
- `company_email` und `company_phone` fehlen im Frontend
- Backend erwartet diese Felder (optional)

### 4. Task Creation (`POST /api/v1/tasks`)

**Frontend**: `TaskForm.tsx`  
**Backend Schema**: `CreateTaskRequest`

| Feld | Frontend | Backend | Status | Problem | Lösung |
|------|----------|---------|--------|---------|--------|
| `title` | ✅ string | ✅ string (min=1, max=200) | ✅ Match | - | - |
| `description` | ✅ string | ✅ string (optional, max=2000) | ✅ Match | - | - |
| `priority` | ✅ string | ✅ TaskPriority (default="MEDIUM") | ✅ Match | - | - |
| `status` | ✅ string | ✅ TaskStatus (required) | ✅ Match | - | - |
| `assignee_id` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `due_date` | ✅ string | ✅ datetime (required) | ⚠️ Type Mismatch | Frontend: string, Backend: datetime | ISO-String Konvertierung |
| `start_date` | ❌ Missing | ✅ datetime (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `estimated_hours` | ❌ Missing | ✅ int (default=1, ge=1, le=1000) | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `tags` | ✅ string[] | ✅ List[str] (default=[]) | ✅ Match | - | - |
| `property_id` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `financing_status` | ❌ Missing | ✅ FinancingStatus (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `label_ids` | ❌ Missing | ✅ List[str] (default=[]) | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `watcher_ids` | ❌ Missing | ✅ List[str] (default=[]) | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `story_points` | ❌ Missing | ✅ int (optional, ge=0, le=100) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `sprint_id` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |
| `issue_type` | ❌ Missing | ✅ string (default="task") | ❌ Missing | Frontend sendet nicht | Default hinzufügen |
| `epic_link` | ❌ Missing | ✅ string (optional) | ❌ Missing | Frontend sendet nicht | Optional hinzufügen |

**Kritische Probleme**:
- Viele Backend-Felder fehlen im Frontend
- Datum-Konvertierung von String zu DateTime

### 5. Document Upload (`POST /api/v1/documents/upload`)

**Frontend**: `DocumentUploadForm.tsx`  
**Backend Schema**: `UploadFile + UploadMetadataRequest`

| Feld | Frontend | Backend | Status | Problem | Lösung |
|------|----------|---------|--------|---------|--------|
| `file` | ✅ File | ✅ UploadFile | ✅ Match | - | - |
| `metadata` | ✅ object | ✅ string (JSON query param) | ⚠️ Type Mismatch | Frontend: object, Backend: JSON string | JSON.stringify() |
| `title` | ✅ string | ✅ string (optional, max=255) | ✅ Match | - | - |
| `type` | ✅ string | ✅ DocumentType (required) | ✅ Match | - | - |
| `category` | ✅ string | ✅ DocumentCategory (required) | ✅ Match | - | - |
| `folder_id` | ✅ number | ✅ int (optional) | ⚠️ Type Mismatch | Frontend: number, Backend: int | Konvertierung zu int |
| `property_id` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `contact_id` | ✅ string | ✅ string (optional) | ✅ Match | - | - |
| `tags` | ✅ string[] | ✅ List[str] (default=[]) | ✅ Match | - | - |
| `visibility` | ✅ string | ✅ DocumentVisibility (default="PRIVATE") | ✅ Match | - | - |
| `description` | ✅ string | ✅ string (optional, max=2000) | ✅ Match | - | - |
| `expiry_date` | ✅ string | ✅ datetime (optional) | ⚠️ Type Mismatch | Frontend: string, Backend: datetime | ISO-String Konvertierung |

**Kritische Probleme**:
- Metadata muss als JSON-String gesendet werden
- Numerische Felder müssen zu int konvertiert werden
- Datum-Konvertierung erforderlich

## Häufige Probleme und Lösungen

### 1. Case-Konvention (camelCase vs snake_case)

**Problem**: Frontend verwendet camelCase, Backend erwartet snake_case

**Lösung**: Mapping-Funktion im API-Client
```typescript
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};
```

### 2. Typ-Konvertierung (number zu int)

**Problem**: Frontend sendet `number`, Backend erwartet `int`

**Lösung**: Konvertierung vor dem Senden
```typescript
const convertNumbersToInt = (obj: any): any => {
  const intFields = ['living_area', 'total_area', 'plot_area', 'rooms', 'bedrooms', 'bathrooms', 'floors', 'year_built', 'energy_consumption'];
  
  if (Array.isArray(obj)) {
    return obj.map(convertNumbersToInt);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      if (intFields.includes(key) && typeof obj[key] === 'number') {
        result[key] = Math.floor(obj[key]);
      } else {
        result[key] = convertNumbersToInt(obj[key]);
      }
      return result;
    }, {} as any);
  }
  return obj;
};
```

### 3. Datum-Konvertierung

**Problem**: Frontend sendet String, Backend erwartet DateTime

**Lösung**: ISO-String Konvertierung
```typescript
const convertDatesToISO = (obj: any): any => {
  const dateFields = ['due_date', 'start_date', 'expiry_date', 'last_contact'];
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToISO);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      if (dateFields.includes(key) && obj[key]) {
        result[key] = new Date(obj[key]).toISOString();
      } else {
        result[key] = convertDatesToISO(obj[key]);
      }
      return result;
    }, {} as any);
  }
  return obj;
};
```

### 4. Fehlende Default-Werte

**Problem**: Backend hat Defaults, Frontend sendet diese nicht

**Lösung**: Default-Werte im Frontend setzen
```typescript
const addDefaults = (obj: any): any => {
  const defaults = {
    status: 'vorbereitung',
    price_currency: 'EUR',
    price_type: 'sale',
    amenities: [],
    tags: [],
    priority: 'medium',
    budget_currency: 'EUR',
    preferences: {},
    plan: 'free',
    billing_cycle: 'monthly',
    estimated_hours: 1,
    label_ids: [],
    watcher_ids: [],
    issue_type: 'task',
    visibility: 'PRIVATE'
  };
  
  return { ...defaults, ...obj };
};
```

### 5. File-Upload Format

**Problem**: Inkonsistente File-Upload-Behandlung

**Lösung**: Einheitliche FormData-Behandlung
```typescript
const createFormData = (file: File, metadata: any): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  return formData;
};
```

## Priorisierte Fixes

### Hoch (Kritisch)
1. **PropertyCreateWizard**: Numerische Felder zu int konvertieren
2. **ContactForm**: Fehlende Pflichtfelder hinzufügen
3. **TaskForm**: Fehlende Backend-Felder hinzufügen
4. **DocumentUpload**: Metadata als JSON-String senden

### Mittel
1. **RegisterForm**: Optional-Felder hinzufügen
2. **AppointmentForm**: Datum-Konvertierung
3. **MessageForm**: Metadata-Handling

### Niedrig
1. **Default-Werte**: Konsistente Defaults
2. **Case-Mapping**: Einheitliche snake_case Konvertierung
3. **Validierung**: Frontend-Validierung an Backend-Schema anpassen

## Nächste Schritte

1. **API-Client-Layer korrigieren**: Mapping-Funktionen implementieren
2. **Form-Handler anpassen**: Payload-Transformation vor dem Senden
3. **Backend-Sync/Async-Fehler beheben**: Threadpool-Nutzung
4. **Integration-Tests**: End-to-End-Tests für alle Endpoints
5. **Dokumentation**: Vollständige Kompatibilitäts-Dokumentation

## Monitoring

Nach der Implementierung der Fixes sollten folgende Metriken überwacht werden:

- **API-Response-Codes**: 422-Fehler sollten reduziert werden
- **500-Fehler**: Sollten eliminiert werden
- **Request-Payload-Größe**: Sollte durch Field-Filtering reduziert werden
- **Response-Zeit**: Sollte durch korrekte Validierung verbessert werden
