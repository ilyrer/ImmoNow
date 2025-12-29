# 📚 RAG Service - Dokumenten & Prompts Guide

## 🗂️ Wo kommen die Dokumente hin?

### 1. **Für RAG Knowledge Base (Empfohlen)**

Erstelle eine strukturierte Dokumenten-Bibliothek:

```
backend/
├── rag_documents/              # 👈 HAUPTORDNER für RAG Dokumente
│   ├── dashboard/              # Dashboard-spezifische Docs
│   │   ├── overview.md
│   │   ├── statistics.md
│   │   └── widgets.md
│   ├── properties/             # Immobilien-Dokumentation
│   │   ├── property_types.md
│   │   ├── workflow.md
│   │   └── fields_guide.md
│   ├── contacts/               # CRM & Kontakte
│   │   ├── lead_management.md
│   │   └── communication.md
│   ├── tasks/                  # Task Management
│   │   ├── kanban_guide.md
│   │   └── workflow.md
│   ├── prompts/                # System Prompts für AI
│   │   ├── system_prompt.txt
│   │   ├── dashboard_assistant.txt
│   │   ├── property_expert.txt
│   │   └── task_helper.txt
│   └── schemas/                # API Schemas als Dokumentation
│       ├── property_schema.json
│       ├── task_schema.json
│       └── contact_schema.json
```

### 2. **Upload-Ordner für User-Uploads**

Nutzer können auch eigene Dokumente hochladen:

```
backend/
└── uploads/
    └── {tenant_id}/            # Pro Mandant isoliert
        └── rag_docs/           # RAG-spezifische Uploads
            ├── company_docs/
            ├── templates/
            └── guidelines/
```

---

## 🚀 Wie bekommst du Dokumente in den RAG Service?

### Option 1: Via API (Empfohlen für Production)

#### A) Text-Content direkt senden

```bash
curl -X POST http://localhost:8000/api/v1/ai/ingest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "dashboard/overview",
    "content": "Das Dashboard zeigt eine Übersicht...",
    "source_type": "docs",
    "metadata": {
      "category": "dashboard",
      "version": "1.0"
    }
  }'
```

#### B) Datei hochladen

```bash
curl -X POST http://localhost:8000/api/v1/ai/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@dashboard_guide.pdf" \
  -F "source_type=docs"
```

#### C) Python Script (Bulk Import)

```python
# backend/scripts/ingest_rag_docs.py
import os
import asyncio
import httpx
from pathlib import Path

async def ingest_directory(directory: str, token: str, base_url: str):
    """Ingests all files from a directory into RAG"""
    
    async with httpx.AsyncClient() as client:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.md', '.txt', '.json')):
                    filepath = Path(root) / file
                    
                    # Read file
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Determine source path (relative)
                    relative_path = filepath.relative_to(directory)
                    source = str(relative_path).replace('\\', '/')
                    
                    # Ingest
                    response = await client.post(
                        f"{base_url}/api/v1/ai/ingest",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "source": source,
                            "content": content,
                            "source_type": "docs",
                            "metadata": {
                                "file_type": filepath.suffix,
                                "category": relative_path.parts[0] if len(relative_path.parts) > 1 else "general"
                            }
                        }
                    )
                    
                    if response.status_code == 200:
                        print(f"✅ Ingested: {source}")
                    else:
                        print(f"❌ Failed: {source} - {response.text}")

# Usage
asyncio.run(ingest_directory(
    directory="backend/rag_documents",
    token="your-jwt-token",
    base_url="http://localhost:8000"
))
```

### Option 2: Via Frontend (AIKnowledgeBase Component)

Du hast bereits eine Admin-Oberfläche:

```tsx
// Im Admin-Bereich: /admin/ai-knowledge
<AIKnowledgeBase />
```

**Features:**
- ✅ Drag & Drop für Dateien (.txt, .md, .pdf, .doc, .docx)
- ✅ Text direkt einfügen mit Source-Name
- ✅ Alle ingestierten Dokumente anzeigen
- ✅ Dokumente löschen

---

## 📝 Prompts für RAG System

### System Prompts Struktur

```
backend/rag_documents/prompts/
├── base_system_prompt.txt          # Basis-Prompt für alle AI Anfragen
├── dashboard_assistant.txt         # Spezialisiert auf Dashboard
├── property_expert.txt             # Immobilien-Experte
├── task_manager.txt                # Task-Management Assistent
├── contact_advisor.txt             # CRM & Kontakt-Berater
└── financial_analyst.txt           # Finanzberechnungen
```

### Beispiel: `base_system_prompt.txt`

```text
Du bist der ImmoNow AI-Assistent, ein Experte für Immobilienverwaltung.

KONTEXT:
- Du hilfst Maklern, Investoren und Property Managern
- Du hast Zugriff auf das gesamte ImmoNow System
- Du kannst Tasks erstellen, Immobilien suchen, Kontakte verwalten

VERHALTEN:
- Antworte präzise und professionell auf Deutsch
- Nutze RAG-Kontext aus der Dokumentation
- Frage nach, wenn Informationen fehlen
- Schlage passende Aktionen vor (z.B. "Soll ich einen Task erstellen?")

TOOLS:
- task_create: Erstelle Tasks im System
- property_search: Suche nach Immobilien
- contact_find: Finde Kontakte
- dashboard_navigate: Navigiere zu Dashboard-Bereichen

AUSGABE:
- Nutze Markdown für Formatierung
- Sei freundlich aber effizient
- Zeige RAG-Quellen wenn verfügbar
```

### Beispiel: `dashboard_assistant.txt`

```text
Du bist der Dashboard-Assistent von ImmoNow.

DEINE AUFGABE:
- Erkläre Dashboard-Widgets und Statistiken
- Hilf bei der Navigation im Dashboard
- Zeige Insights aus den Daten
- Erstelle Reports und Analysen

VERFÜGBARE WIDGETS:
- Immobilien-Übersicht (Anzahl, Typen, Status)
- Aufgaben-Kanban (To-Do, In Progress, Done)
- Kontakt-Pipeline (Leads, Opportunities)
- Finanz-Übersicht (Einnahmen, Ausgaben, ROI)
- Aktivitäts-Timeline (Letzte Aktionen)

BEISPIELE:
- "Zeig mir alle überfälligen Tasks" → Navigiere zu Kanban, filtere überfällig
- "Wie viele Immobilien haben wir?" → Zeige Statistik aus Property Widget
- "Erstelle einen Report für Q4 2024" → Generiere PDF mit KPIs
```

---

## 🏗️ Empfohlene Dokumenten-Struktur

### 1. **Dashboard Dokumentation**

**Datei:** `rag_documents/dashboard/overview.md`

```markdown
# ImmoNow Dashboard - Übersicht

## Widgets

### Immobilien-Widget
- Zeigt Gesamtanzahl aller Immobilien
- Filter: Verkauf, Vermietung, Verwaltet
- Klick öffnet Property-Liste

### Task-Widget (Kanban)
- 4 Spalten: To-Do, In Progress, Review, Done
- Drag & Drop zwischen Spalten
- Farben nach Priorität

### Kontakt-Pipeline
- Lead-Status visualisiert
- Conversion Rate angezeigt
- Nächste Follow-ups

## Navigation
- Sidebar links: Hauptmenü
- Top-Bar: Suche, Notifications, Profil
- Breadcrumbs: Aktueller Pfad

## Shortcuts
- `Ctrl+K`: Globale Suche
- `Ctrl+N`: Neues Element
- `Ctrl+S`: Speichern
```

### 2. **Property Management Guide**

**Datei:** `rag_documents/properties/workflow.md`

```markdown
# Immobilien-Workflow

## Neue Immobilie Erstellen
1. Navigation: Dashboard → Properties → "Neue Immobilie"
2. Basisinformationen ausfüllen (Titel, Typ, Adresse)
3. Details hinzufügen (Fläche, Zimmer, Preis)
4. Fotos hochladen
5. Dokumente anhängen
6. Speichern

## Immobilie Publizieren
- ImmoScout24: Automatische Synchronisation
- Immowelt: API-Integration
- Social Media: Facebook, Instagram Posts

## AVM (Bewertung)
- Button: "Immobilie bewerten"
- AI analysiert: Lage, Ausstattung, Markt
- Ergebnis: Preis-Range mit Confidence Score
```

### 3. **API Schemas als Docs**

**Datei:** `rag_documents/schemas/property_schema.json`

```json
{
  "Property": {
    "title": "string (required) - Immobilientitel",
    "description": "string (optional) - Beschreibung",
    "property_type": "enum: APARTMENT, HOUSE, COMMERCIAL, LAND",
    "status": "enum: AVAILABLE, SOLD, RENTED, RESERVED",
    "price": "decimal - Preis in Euro",
    "size": "decimal - Fläche in m²",
    "rooms": "integer - Anzahl Zimmer",
    "address": {
      "street": "string",
      "city": "string",
      "zip": "string",
      "country": "string (default: DE)"
    },
    "features": {
      "balcony": "boolean",
      "parking": "boolean",
      "elevator": "boolean",
      "garden": "boolean"
    }
  }
}
```

---

## 🎯 Verwendung im Code

### RAG Service nutzen

```python
# backend/app/services/rag_service.py

from app.services.rag_service import RagService

# Initialize
rag_service = RagService(tenant_id="abc-123")

# Ensure collection exists
await rag_service.ensure_collection()

# Ingest document
result = await rag_service.ingest_document(
    source="dashboard/overview",
    content=dashboard_content,
    source_type="docs",
    metadata={"category": "dashboard", "version": "1.0"}
)

# Retrieve relevant chunks
chunks = await rag_service.retrieve(
    query="Wie erstelle ich eine neue Immobilie?",
    top_k=5,
    source_type="docs"  # Optional: Filter by type
)

# Use chunks in prompt
context = "\n\n".join([chunk.chunk.content for chunk in chunks])
prompt = f"Kontext:\n{context}\n\nFrage: {query}"
```

### Prompts dynamisch laden

```python
# backend/app/services/ai/prompt_loader.py

from pathlib import Path

class PromptLoader:
    """Load system prompts from files"""
    
    PROMPT_DIR = Path(__file__).parent.parent.parent / "rag_documents" / "prompts"
    
    @classmethod
    def load_prompt(cls, name: str) -> str:
        """Load prompt by name"""
        prompt_file = cls.PROMPT_DIR / f"{name}.txt"
        
        if not prompt_file.exists():
            return cls.load_prompt("base_system_prompt")  # Fallback
        
        with open(prompt_file, 'r', encoding='utf-8') as f:
            return f.read()
    
    @classmethod
    def get_dashboard_prompt(cls) -> str:
        return cls.load_prompt("dashboard_assistant")
    
    @classmethod
    def get_property_prompt(cls) -> str:
        return cls.load_prompt("property_expert")

# Usage in AI Orchestrator
system_prompt = PromptLoader.get_dashboard_prompt()
```

---

## 🔄 Automatische Ingestion bei Startup

**Datei:** `backend/app/main.py`

```python
from fastapi import FastAPI
from app.services.rag_service import RagService
from pathlib import Path
import asyncio

app = FastAPI()

async def ingest_default_docs():
    """Ingest RAG documents on startup"""
    docs_dir = Path(__file__).parent / "rag_documents"
    
    if not docs_dir.exists():
        return
    
    # TODO: Get default tenant or admin tenant
    rag_service = RagService(tenant_id="default")
    await rag_service.ensure_collection()
    
    for doc_file in docs_dir.rglob("*.md"):
        try:
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            source = str(doc_file.relative_to(docs_dir))
            
            await rag_service.ingest_document(
                source=source,
                content=content,
                source_type="docs"
            )
            
            print(f"✅ Ingested: {source}")
        except Exception as e:
            print(f"❌ Failed to ingest {doc_file}: {e}")

@app.on_event("startup")
async def startup_event():
    # Other startup tasks...
    await ingest_default_docs()
```

---

## 📊 Monitoring & Verwaltung

### Check Health

```bash
curl http://localhost:8000/api/v1/ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "ollama": true,
  "qdrant": true,
  "collection_exists": true,
  "tenant_chunk_count": 145,
  "models": ["deepseek-r1:8b", "nomic-embed-text"]
}
```

### List Sources

```bash
curl http://localhost:8000/api/v1/ai/sources \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "sources": [
    {
      "source": "dashboard/overview.md",
      "chunk_count": 12,
      "source_type": "docs",
      "created_at": "2024-12-14T10:30:00Z"
    },
    {
      "source": "properties/workflow.md",
      "chunk_count": 8,
      "source_type": "docs",
      "created_at": "2024-12-14T10:31:00Z"
    }
  ],
  "count": 2
}
```

### Delete Source

```bash
curl -X DELETE http://localhost:8000/api/v1/ai/sources/dashboard/overview.md \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Best Practices

### 1. **Strukturiere Dokumente Logisch**

```
✅ RICHTIG:
rag_documents/
├── dashboard/
│   ├── overview.md
│   └── widgets.md
├── properties/
│   ├── create.md
│   └── publish.md

❌ FALSCH:
rag_documents/
├── doc1.md
├── doc2.md
└── random_stuff.txt
```

### 2. **Nutze Metadata für Filtering**

```python
# Ingest mit Category
await rag_service.ingest_document(
    source="guide.md",
    content=content,
    metadata={
        "category": "dashboard",
        "audience": "admin",
        "version": "1.0",
        "last_updated": "2024-12-14"
    }
)

# Retrieve mit Filter
chunks = await rag_service.retrieve(
    query=query,
    metadata_filter={"category": "dashboard"}
)
```

### 3. **Halte Chunks Optimal**

- **Chunk Size:** 500-1000 Zeichen (default: 800)
- **Overlap:** 100-200 Zeichen (default: 200)
- **Warum?** Balance zwischen Kontext und Präzision

### 4. **Versioniere Prompts**

```
prompts/
├── v1/
│   └── base_system_prompt.txt
├── v2/
│   └── base_system_prompt.txt
└── current -> v2/  # Symlink
```

### 5. **Teste RAG Retrieval**

```python
# Test Script
async def test_rag():
    rag = RagService(tenant_id="test")
    
    # Test queries
    queries = [
        "Wie erstelle ich eine Immobilie?",
        "Dashboard Widgets anzeigen",
        "Task erstellen"
    ]
    
    for query in queries:
        chunks = await rag.retrieve(query, top_k=3)
        print(f"\n🔍 Query: {query}")
        for chunk in chunks:
            print(f"  📄 {chunk.chunk.source} (Score: {chunk.score:.2f})")
            print(f"     {chunk.chunk.content[:100]}...")
```

---

## 🚀 Quick Start Checklist

- [ ] Erstelle `backend/rag_documents/` Ordner
- [ ] Füge initiale Dokumente hinzu (dashboard, properties, tasks)
- [ ] Erstelle System-Prompts in `prompts/`
- [ ] Starte Qdrant: `docker run -p 6333:6333 qdrant/qdrant`
- [ ] Starte Ollama: `ollama serve`
- [ ] Ingest Docs via Script oder Admin UI
- [ ] Teste Health: `curl localhost:8000/api/v1/ai/health`
- [ ] Teste Chat mit RAG: Frontend AIChat Component

---

## 📞 Support

Bei Fragen zur RAG-Integration:
- Logs checken: `backend/logs/rag_service.log`
- Qdrant Web UI: http://localhost:6333/dashboard
- API Docs: http://localhost:8000/docs

---

**Version:** 1.0  
**Letztes Update:** 14. Dezember 2025
