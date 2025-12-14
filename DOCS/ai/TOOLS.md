# ImmoNow AI - Tool System Referenz

**Version**: 1.0  
**Datum**: 13.12.2025

---

## Übersicht

Das AI-Tool-System ermöglicht dem LLM strukturierte Actions auf der ImmoNow-Plattform auszuführen. Tools werden via **JSON Tool-Calling** ausgelöst und durch den **ToolRegistry** validiert und ausgeführt.

**Features**:
- ✅ Pydantic-basierte Validierung
- ✅ RBAC (Role-Based Access Control)
- ✅ Audit Logging
- ✅ Confirmation Flow (kritische Actions)
- ✅ Idempotency Support
- ✅ UI Commands (Frontend-Execution)

---

## Tool-Kategorien

| Kategorie | Tools | Description |
|-----------|-------|-------------|
| **Tasks** | `create_task`, `list_tasks`, `update_task` | Task-Management |
| **Entities** | `create_contact`, `list_contacts`, `list_properties` | Contact/Property CRUD |
| **Navigation** | `navigate`, `show_toast`, `open_modal` | UI Steuerung |

---

## JSON Tool-Calling Format

### Request (vom LLM)

```json
{
  "tool": "create_task",
  "arguments": {
    "title": "Meeting mit Herrn Schmidt",
    "due_date": "2025-12-20",
    "priority": "high"
  },
  "requires_confirmation": false
}
```

### Response (vom Backend)

```json
{
  "success": true,
  "data": {
    "task_id": "task-123",
    "title": "Meeting mit Herrn Schmidt",
    "status": "open"
  },
  "message": "Task erfolgreich erstellt.",
  "metadata": {
    "execution_time_ms": 120
  }
}
```

---

## Task Tools

### `create_task`

**Beschreibung**: Erstellt eine neue Aufgabe

**Scopes**: `write`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `title` | string | ✅ | Task-Titel (max 200 Zeichen) |
| `description` | string | ❌ | Ausführliche Beschreibung |
| `due_date` | string | ❌ | Fälligkeitsdatum (ISO 8601: `YYYY-MM-DD`) |
| `priority` | enum | ❌ | `low`, `medium`, `high`, `urgent` |
| `assignee` | string | ❌ | User-ID des Zuständigen |
| `project` | string | ❌ | Projekt-ID |
| `status` | enum | ❌ | `open`, `in_progress`, `completed`, `cancelled` |
| `tags` | array | ❌ | Tags (max 10) |

**Response**:
```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Vorbereitung",
    "status": "open",
    "priority": "medium",
    "due_date": "2025-12-20",
    "created_at": "2025-12-13T10:30:00Z"
  }
}
```

**cURL Beispiel**:
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "message": "Erstelle einen Task für Meeting morgen um 14 Uhr",
    "skip_confirmation": false
  }'
```

**LLM Output**:
```json
{
  "response": "Ich erstelle einen Task für das Meeting morgen um 14 Uhr.",
  "tool_calls": [{
    "tool": "create_task",
    "arguments": {
      "title": "Meeting",
      "due_date": "2025-12-14",
      "description": "Meeting um 14:00 Uhr"
    }
  }]
}
```

---

### `list_tasks`

**Beschreibung**: Listet Tasks mit optionalen Filtern

**Scopes**: `read`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `status` | enum | ❌ | Filter: `open`, `in_progress`, `completed`, `cancelled` |
| `priority` | enum | ❌ | Filter: `low`, `medium`, `high`, `urgent` |
| `assignee` | string | ❌ | Filter: User-ID |
| `project` | string | ❌ | Filter: Projekt-ID |
| `limit` | int | ❌ | Max Anzahl (default: 20, max: 100) |

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "task_id": "...",
        "title": "Review Dokumentation",
        "status": "open",
        "priority": "high",
        "due_date": "2025-12-15"
      }
    ],
    "total": 1,
    "limit": 20
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Zeige mir alle offenen High-Priority Tasks"
  }'
```

---

### `update_task`

**Beschreibung**: Aktualisiert Task-Felder

**Scopes**: `write`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `task_id` | string | ✅ | UUID des Tasks |
| `title` | string | ❌ | Neuer Titel |
| `description` | string | ❌ | Neue Beschreibung |
| `status` | enum | ❌ | Neuer Status |
| `priority` | enum | ❌ | Neue Priorität |
| `due_date` | string | ❌ | Neues Datum |
| `assignee` | string | ❌ | Neue Zuweisung |

**Confirmation**: ✅ (nur bei Status-Änderung zu `completed` oder `cancelled`)

**cURL**:
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Setze Task task-123 auf completed"
  }'
```

**Confirmation Flow**:
```json
// 1. Backend Response mit confirmation_required
{
  "response": "Möchtest du Task XYZ wirklich als erledigt markieren?",
  "confirmation_required": true,
  "pending_actions": [{
    "tool": "update_task",
    "arguments": {
      "task_id": "task-123",
      "status": "completed"
    }
  }],
  "confirmation_token": "conf-xyz-abc"
}

// 2. User bestätigt
POST /api/v1/ai/chat/confirm
{
  "confirmation_token": "conf-xyz-abc",
  "confirmed": true
}

// 3. Tool wird ausgeführt
{
  "success": true,
  "data": { ... },
  "message": "Task erfolgreich aktualisiert."
}
```

---

## Entity Tools

### `create_contact`

**Beschreibung**: Erstellt neuen Kontakt

**Scopes**: `write`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `name` | string | ✅ | Kontaktname |
| `email` | string | ❌ | E-Mail-Adresse |
| `phone` | string | ❌ | Telefonnummer |
| `contact_type` | enum | ❌ | `buyer`, `seller`, `agent`, `supplier`, `other` |
| `notes` | string | ❌ | Notizen |

**Response**:
```json
{
  "success": true,
  "data": {
    "contact_id": "c-456",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "contact_type": "buyer"
  }
}
```

**Beispiel Chat**:
```
User: "Lege einen Kontakt für Max Mustermann an, max@example.com"
LLM: "Ich erstelle den Kontakt."
     → Tool: create_contact(name="Max Mustermann", email="max@example.com")
```

---

### `list_contacts`

**Beschreibung**: Listet Kontakte

**Scopes**: `read`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `contact_type` | enum | ❌ | Filter: `buyer`, `seller`, `agent`, etc. |
| `limit` | int | ❌ | Max Anzahl (default: 20) |

**Beispiel**:
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Zeige mir alle Käufer-Kontakte"}'
```

---

### `list_properties`

**Beschreibung**: Listet Immobilien

**Scopes**: `read`

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `property_type` | enum | ❌ | `apartment`, `house`, `commercial`, `land` |
| `status` | enum | ❌ | `available`, `sold`, `reserved` |
| `limit` | int | ❌ | Max Anzahl |

**Beispiel**:
```
User: "Liste alle verfügbaren Wohnungen"
LLM: → list_properties(property_type="apartment", status="available")
```

---

## Navigation Tools

**Hinweis**: Diese Tools erzeugen **UI Commands**, die vom Frontend ausgeführt werden müssen.

### `navigate`

**Beschreibung**: Navigiert zu Route

**Scopes**: Keine (UI-only)

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `route` | string | ✅ | React Router Path (z.B. `/properties/123`) |
| `params` | object | ❌ | Query-Parameter |

**Response**:
```json
{
  "success": true,
  "data": {
    "ui_command": {
      "type": "navigate",
      "route": "/properties/prop-123",
      "params": {"tab": "details"}
    }
  }
}
```

**Frontend Execution**:
```typescript
// ChatbotPanel.tsx
if (result.data?.ui_command?.type === 'navigate') {
  navigate(result.data.ui_command.route, {
    state: result.data.ui_command.params
  });
}
```

**Beispiel Chat**:
```
User: "Öffne Immobilie 123"
LLM: "Ich öffne die Immobilie."
     → navigate(route="/properties/123")
Frontend: Führt Navigation aus
```

---

### `show_toast`

**Beschreibung**: Zeigt Toast-Notification

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `message` | string | ✅ | Toast-Text |
| `type` | enum | ❌ | `success`, `error`, `info`, `warning` |
| `duration` | int | ❌ | Dauer in ms (default: 3000) |

**Response**:
```json
{
  "success": true,
  "data": {
    "ui_command": {
      "type": "show_toast",
      "message": "Task erstellt!",
      "toast_type": "success",
      "duration": 3000
    }
  }
}
```

---

### `open_modal`

**Beschreibung**: Öffnet Modal-Dialog

**Parameter**:
| Name | Type | Required | Beschreibung |
|------|------|----------|--------------|
| `modal_id` | string | ✅ | Modal-Identifier (z.B. `task-form`, `contact-details`) |
| `data` | object | ❌ | Modal-Props |

**Beispiel**:
```json
{
  "tool": "open_modal",
  "arguments": {
    "modal_id": "task-form",
    "data": {
      "title": "Neuer Task",
      "prefill": {
        "title": "Meeting",
        "due_date": "2025-12-20"
      }
    }
  }
}
```

---

## Tool Development

### 1. Tool Definition erstellen

```python
# backend/app/tools/custom_tools.py
from app.tools.registry import ToolRegistry, ToolParameter, ToolDefinition

tool_def = ToolDefinition(
    name="send_email",
    description="Sendet E-Mail an Kontakt",
    parameters=[
        ToolParameter(
            name="recipient",
            param_type="string",
            description="E-Mail-Adresse",
            required=True
        ),
        ToolParameter(
            name="subject",
            param_type="string",
            description="Betreff",
            required=True
        ),
        ToolParameter(
            name="body",
            param_type="string",
            description="E-Mail-Text",
            required=True
        )
    ],
    required_scopes=["write"],
    requires_confirmation=True,
    confirmation_message="Möchtest du die E-Mail wirklich senden?"
)
```

### 2. Tool Function implementieren

```python
async def send_email_tool(
    tenant_id: str,
    user_id: str,
    recipient: str,
    subject: str,
    body: str
) -> Dict[str, Any]:
    """Tool function: Send email"""
    email_service = EmailService(tenant_id)
    result = await email_service.send_email(
        to=recipient,
        subject=subject,
        body=body
    )
    
    return {
        "email_id": result.email_id,
        "status": "sent",
        "sent_at": result.sent_at.isoformat()
    }
```

### 3. Tool registrieren

```python
ToolRegistry.register(
    definition=tool_def,
    function=send_email_tool
)
```

### 4. Import in `__init__.py`

```python
# backend/app/tools/__init__.py
from .custom_tools import send_email_tool

# Wird automatisch beim Import registriert
```

---

## Testing Tools

### Via API (direkt)

```bash
# 1. Tool Liste abrufen
curl http://localhost:8000/api/v1/ai/tools \
  -H "Authorization: Bearer <token>"

# 2. Tool via Chat ausführen
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Erstelle Task: Test Meeting morgen",
    "skip_rag": true
  }'
```

### Via Python (Unit Tests)

```python
# backend/tests/test_tools.py
import pytest
from app.tools.registry import ToolRegistry

@pytest.mark.asyncio
async def test_create_task_tool():
    result = await ToolRegistry.execute(
        tool_name="create_task",
        tenant_id="tenant-123",
        user_id="user-456",
        user_scopes=["read", "write"],
        arguments={
            "title": "Test Task",
            "priority": "high"
        }
    )
    
    assert result.success is True
    assert "task_id" in result.data
```

---

## Best Practices

### 1. Tool Naming

- **Verb-Noun**: `create_task`, `list_contacts`, `update_property`
- **Kurz & präzise**: Nicht `create_a_new_task_in_the_database`
- **Konsistent**: Alle CRUD → `create_*`, `list_*`, `update_*`, `delete_*`

### 2. Parameter Design

- **Required vs Optional**: Nur essentials als `required`
- **Defaults**: Sinnvolle Defaults (`limit=20`, `status="open"`)
- **Validierung**: Pydantic-Types nutzen (`EmailStr`, `HttpUrl`, Enums)

### 3. Error Handling

```python
async def my_tool(...):
    try:
        # Business Logic
        return {"result": ...}
    except ValidationError as e:
        raise ToolError(f"Validierung fehlgeschlagen: {e}")
    except NotFoundError:
        raise ToolError("Ressource nicht gefunden")
```

### 4. Idempotency

Für kritische Tools:
```python
tool_def = ToolDefinition(
    name="delete_property",
    idempotent=False,  # Nicht wiederholbar
    requires_confirmation=True
)
```

### 5. Audit Logging

Automatisch via ToolRegistry:
```python
# Alle Tool-Executions werden geloggt:
# - tool_name
# - tenant_id, user_id
# - arguments (sanitized)
# - result (success/error)
# - execution_time
```

---

## Weitere Ressourcen

- [ARCHITECTURE.md](ARCHITECTURE.md) - System-Übersicht
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Installation
- `backend/app/tools/registry.py` - ToolRegistry Source
- `backend/app/services/ai_orchestrator_service.py` - Tool-Calling Logic
