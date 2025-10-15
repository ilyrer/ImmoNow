# LLM Integration mit DeepSeek V3.1 (free)

## Übersicht

Diese Integration ermöglicht es, einen KI-Chatbot mit dem kostenlosen DeepSeek V3.1 Modell über OpenRouter in das ImmoNow-Dashboard zu integrieren. Das Modell bietet:

- **671B Parameter** (37B aktiv) - Hybrid Reasoning Modell
- **128K Kontext** - Große Kontextfenster
- **Kostenlos** - $0/M für Input und Output Tokens
- **OpenAI-kompatibel** - Verwendet das `openai` Python-Paket

## Setup

### 1. API-Schlüssel erstellen

1. Gehe zu [OpenRouter](https://openrouter.ai/)
2. Registriere dich oder melde dich an
3. Navigiere zu [API Keys](https://openrouter.ai/keys)
4. Erstelle einen neuen API-Schlüssel
5. Kopiere den Schlüssel (beginnt mit `sk-or-v1-...`)

### 2. Umgebungsvariablen konfigurieren

Füge die folgenden Variablen zu deiner `.env` Datei hinzu:

```bash
# OpenRouter/DeepSeek V3.1 Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
OPENROUTER_TIMEOUT=60
OPENROUTER_MAX_TOKENS=2048
SITE_URL=https://immonow.com
SITE_NAME=ImmoNow Dashboard
```

### 3. Dependencies installieren

```bash
cd backend
pip install -r requirements.txt
```

Dies installiert:
- `openai==1.54.0` - OpenAI Python SDK für API-Aufrufe
- Alle anderen erforderlichen Pakete

## Verwendung

### API-Endpunkte

#### 1. Allgemeine Fragen (`POST /api/v1/llm/ask`)

Stelle beliebige Fragen an den LLM:

```python
# Request
{
    "prompt": "Was ist Immobilienverwaltung?",
    "context": "Optionaler zusätzlicher Kontext",
    "max_tokens": 2048,
    "temperature": 0.7
}

# Response
{
    "response": "Immobilienverwaltung ist...",
    "tokens_used": 150,
    "model": "deepseek/deepseek-chat-v3.1:free",
    "timestamp": "2025-10-15T19:00:00Z"
}
```

#### 2. Dashboard Q&A (`POST /api/v1/llm/dashboard_qa`)

Stelle Fragen mit vordefiniertem Dashboard-Kontext:

```python
# Request
{
    "question": "Was bedeutet ROI im Immobilienkontext?",
    "context_type": "dashboard",
    "include_data": true
}

# Response
{
    "answer": "ROI (Return on Investment) ist...",
    "context_used": "Das ImmoNow-Dashboard ist...",
    "related_kpis": ["ROI", "Rendite"],
    "tokens_used": 250,
    "timestamp": "2025-10-15T19:00:00Z"
}
```

#### 3. Health Check (`GET /api/v1/llm/health`)

Überprüfe den Status der LLM-Integration:

```python
# Response
{
    "status": "healthy",
    "model": "deepseek/deepseek-chat-v3.1:free",
    "base_url": "https://openrouter.ai/api/v1",
    "rate_limit_enabled": true,
    "max_requests_per_minute": 10
}
```

### Rate Limiting

Die Integration implementiert automatisches Rate Limiting:

- **10 Anfragen pro Minute** pro Benutzer
- Anfragen werden im Memory gespeichert (in Produktion: Redis verwenden)
- Bei Überschreitung: HTTP 400 Fehler

### Retry-Logik

Bei Fehlern wird automatisch wiederholt:

- **3 Versuche** mit exponentieller Verzögerung
- Bei Rate Limits: 2^attempt Sekunden warten
- Bei Timeouts: Automatischer Retry
- Andere Fehler: Fehler-Logging und Retry

## Testen

### Test-Script ausführen

```bash
cd backend
python test_llm_service.py
```

Das Script testet:

1. ✓ API-Schlüssel Konfiguration
2. ✓ Service-Initialisierung
3. ✓ Allgemeine Frage
4. ✓ Dashboard Q&A
5. ✓ Frage mit Kontext

### Beispiel-Output

```
============================================================
Testing LLM Service with DeepSeek V3.1 (free)
============================================================

✓ API Key configured: sk-or-v1-xxxxx...

Initializing LLM Service...
✓ Service initialized
  Model: deepseek/deepseek-chat-v3.1:free
  Base URL: https://openrouter.ai/api/v1
  Timeout: 60s
  Max Tokens: 2048

============================================================
Test 1: Allgemeine Frage
============================================================
Frage: Was ist Immobilienverwaltung in einem Satz?
Sende Anfrage...

✓ Antwort erhalten:
  Modell: deepseek/deepseek-chat-v3.1:free
  Tokens verwendet: 142
  Antwort: Immobilienverwaltung ist die professionelle...

============================================================
✅ Alle Tests erfolgreich!
============================================================
```

## Code-Architektur

### LLMService Klasse

```python
class LLMService:
    def __init__(self, tenant_id: str):
        # Initialisiert AsyncOpenAI Client
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY'),
            timeout=60
        )
    
    async def ask_question(...) -> LLMResponse:
        # Allgemeine Fragen
        
    async def ask_dashboard_question(...) -> DashboardQAResponse:
        # Dashboard-spezifische Fragen mit Kontext
    
    async def _make_openrouter_request(...) -> Dict:
        # OpenAI Client Aufruf mit Retry-Logik
```

### Vorteile des OpenAI SDK

1. **Einfachere API** - Weniger Boilerplate Code
2. **Bessere Fehlerbehandlung** - Native Exception-Typen
3. **Type Safety** - Vollständige Type Hints
4. **Automatische Retries** - SDK-integriert
5. **Streaming Support** - Für zukünftige Erweiterungen

## Frontend-Integration

### React Hook Beispiel

```typescript
// useAIAssistant.ts
import { useState } from 'react';
import { api } from '@/api';

export function useAIAssistant() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const askQuestion = async (question: string) => {
    setLoading(true);
    try {
      const result = await api.post('/api/v1/llm/ask', {
        prompt: question,
        max_tokens: 2048,
        temperature: 0.7
      });
      setResponse(result.data.response);
    } catch (error) {
      console.error('LLM Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, loading, response };
}
```

### Verwendung in Komponenten

```typescript
// ChatWidget.tsx
import { useAIAssistant } from '@/hooks/useAIAssistant';

function ChatWidget() {
  const { askQuestion, loading, response } = useAIAssistant();

  const handleSubmit = (question: string) => {
    askQuestion(question);
  };

  return (
    <div>
      <input onSubmit={handleSubmit} />
      {loading && <Spinner />}
      {response && <div>{response}</div>}
    </div>
  );
}
```

## Monitoring & Auditing

### Audit Logs

Alle LLM-Anfragen werden automatisch geloggt:

```python
# Gespeichert in AuditService
{
    "user_id": "user-123",
    "tenant_id": "tenant-456",
    "request_type": "general" | "dashboard_qa",
    "prompt": "Benutzerfrage",
    "response": "LLM Antwort",
    "tokens_used": 150,
    "model": "deepseek/deepseek-chat-v3.1:free",
    "timestamp": "2025-10-15T19:00:00Z",
    "request_id": "unique-id"
}
```

## Troubleshooting

### Fehler: "OpenRouter API key not configured"

**Lösung:** Setze `OPENROUTER_API_KEY` in der `.env` Datei

### Fehler: "Rate limit exceeded"

**Lösung:** 
- Warte 1 Minute
- Erhöhe Rate Limit in der Konfiguration
- Verwende Redis für verteiltes Rate Limiting

### Fehler: "Import openai could not be resolved"

**Lösung:** Installiere Dependencies:
```bash
pip install -r requirements.txt
```

### Timeout-Fehler

**Lösung:** Erhöhe `OPENROUTER_TIMEOUT` in `.env`:
```bash
OPENROUTER_TIMEOUT=120
```

## Zukünftige Erweiterungen

### 1. Streaming-Unterstützung

```python
# Aktiviere Streaming für Echtzeit-Antworten
async def ask_question_stream(...):
    completion = await self.client.chat.completions.create(
        model=self.openrouter_model,
        messages=messages,
        stream=True  # Enable streaming
    )
    
    async for chunk in completion:
        yield chunk.choices[0].delta.content
```

### 2. Redis Rate Limiting

```python
# Verwende Redis statt Memory
import redis

class LLMService:
    def __init__(self, tenant_id: str):
        self.redis_client = redis.Redis(...)
    
    def _check_rate_limit(self, user_id: str) -> bool:
        key = f"rate_limit:{self.tenant_id}:{user_id}"
        # Use Redis for distributed rate limiting
```

### 3. Mehrere Modelle

```python
# Wähle Modell basierend auf Anfrage
models = {
    'fast': 'deepseek/deepseek-chat-v3.1:free',
    'smart': 'anthropic/claude-3.5-sonnet',
    'reasoning': 'deepseek/deepseek-r1'
}
```

## Ressourcen

- [OpenRouter Dokumentation](https://openrouter.ai/docs)
- [DeepSeek V3.1 Modell-Seite](https://openrouter.ai/deepseek/deepseek-chat-v3.1:free)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [API Playground](https://openrouter.ai/playground)

## Support

Bei Fragen oder Problemen:

1. Überprüfe die [OpenRouter Status-Seite](https://status.openrouter.ai/)
2. Teste mit dem `test_llm_service.py` Script
3. Überprüfe die Logs in `backend/logs/`
4. Kontaktiere das Development-Team

---

**Version:** 1.0.0  
**Datum:** Oktober 2025  
**Modell:** DeepSeek V3.1 (free)

