# LLM API Tests ohne Authentication

## Problem

Die normalen LLM-Endpunkte (`/api/v1/llm/ask` und `/api/v1/llm/dashboard_qa`) benötigen einen gültigen JWT-Token. Wenn dein Token abgelaufen ist, bekommst du die Fehlermeldung:

```json
{
  "detail": "Token has expired"
}
```

## Lösung: Test-Endpunkte

Für Development-Zwecke haben wir **Test-Endpunkte ohne Authentication** hinzugefügt:

- `POST /api/v1/llm/test` - Allgemeine Fragen (ohne Auth)
- `POST /api/v1/llm/test_dashboard` - Dashboard Q&A (ohne Auth)

⚠️ **WICHTIG:** Diese Endpunkte sollten in Production **entfernt oder geschützt** werden!

---

## 🚀 Tests ausführen

### Option 1: Python Script (Empfohlen)

```bash
cd backend
python test_llm_api.py
```

Dieses Script testet beide Endpunkte und zeigt detaillierte Ergebnisse.

### Option 2: curl Befehle

#### Test 1: Allgemeine Frage

```bash
curl -X POST http://localhost:8000/api/v1/llm/test \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Was ist Immobilienverwaltung in einem Satz?",
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

**Erwartete Antwort:**
```json
{
  "response": "Immobilienverwaltung ist die professionelle...",
  "tokens_used": 142,
  "model": "deepseek/deepseek-chat-v3.1:free",
  "timestamp": "2025-10-15T19:30:00Z"
}
```

#### Test 2: Dashboard Q&A

```bash
curl -X POST http://localhost:8000/api/v1/llm/test_dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Was bedeutet ROI im Immobilienkontext?",
    "context_type": "dashboard",
    "include_data": true
  }'
```

**Erwartete Antwort:**
```json
{
  "answer": "ROI (Return on Investment) ist...",
  "context_used": "Das ImmoNow-Dashboard ist...",
  "related_kpis": ["ROI", "Rendite"],
  "tokens_used": 250,
  "timestamp": "2025-10-15T19:30:00Z"
}
```

### Option 3: Postman / Insomnia

1. Erstelle eine neue POST-Anfrage
2. URL: `http://localhost:8000/api/v1/llm/test`
3. Body (JSON):
```json
{
  "prompt": "Was ist Immobilienverwaltung?",
  "max_tokens": 150,
  "temperature": 0.7
}
```
4. Sende die Anfrage (ohne Authorization Header!)

---

## 🔧 Troubleshooting

### Fehler: "Connection refused"

**Problem:** Backend-Server läuft nicht

**Lösung:**
```bash
cd backend
python main.py
```

### Fehler: "OpenRouter API key not configured"

**Problem:** `OPENROUTER_API_KEY` nicht in `.env` gesetzt

**Lösung:**
```bash
# Füge zu backend/.env hinzu:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Fehler: "Import openai could not be resolved"

**Problem:** openai Package nicht installiert

**Lösung:**
```bash
cd backend
pip install -r requirements.txt
```

### Fehler: "Rate limit exceeded"

**Problem:** Zu viele Anfragen in kurzer Zeit

**Lösung:** Warte 1 Minute und versuche es erneut

---

## 🔐 Production: Mit Authentication

Für Production-Endpunkte brauchst du einen gültigen JWT-Token:

### 1. Login und Token erhalten

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deine-email@example.com",
    "password": "dein-passwort"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### 2. Token bei Anfragen verwenden

```bash
curl -X POST http://localhost:8000/api/v1/llm/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "prompt": "Was ist Immobilienverwaltung?",
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

### 3. Token erneuern (wenn abgelaufen)

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 📊 API-Endpunkt Übersicht

| Endpunkt | Auth benötigt? | Zweck |
|----------|----------------|-------|
| `POST /api/v1/llm/test` | ❌ Nein | Development-Test ohne Auth |
| `POST /api/v1/llm/test_dashboard` | ❌ Nein | Development-Test Dashboard Q&A ohne Auth |
| `POST /api/v1/llm/ask` | ✅ Ja | Production - Allgemeine Fragen |
| `POST /api/v1/llm/dashboard_qa` | ✅ Ja | Production - Dashboard Q&A |
| `GET /api/v1/llm/health` | ✅ Ja | Health Check |

---

## 🎯 Empfohlener Workflow

### Development:
1. ✅ Verwende `/test` Endpunkte ohne Auth
2. ✅ Schnelles Testen und Debugging
3. ✅ Keine Token-Verwaltung nötig

### Production:
1. ✅ Entferne oder schütze `/test` Endpunkte
2. ✅ Verwende geschützte Endpunkte mit JWT-Token
3. ✅ Implementiere Token-Refresh-Logik im Frontend

---

## 🔒 Sicherheitshinweis

Die `/test` Endpunkte sind **nur für Development** gedacht!

**Vor Production-Deployment:**

1. ✅ Entferne die `/test` Endpunkte aus `backend/app/api/v1/llm.py`
2. ✅ Oder schütze sie mit IP-Whitelist / Environment-Check
3. ✅ Verwende immer die geschützten Endpunkte in Production

**Beispiel: Environment-Check**

```python
@router.post("/test")
async def test_llm_no_auth(request: LLMRequest):
    # Nur in Development erlaubt
    if os.getenv("DEBUG", "False") != "True":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoint only available in development"
        )
    
    # ... rest of the code
```

---

## 📚 Weitere Ressourcen

- [README_LLM_DEEPSEEK.md](README_LLM_DEEPSEEK.md) - Vollständige Dokumentation
- [DEEPSEEK_V3_SETUP_COMPLETE.md](../DEEPSEEK_V3_SETUP_COMPLETE.md) - Setup-Zusammenfassung
- [OpenRouter Docs](https://openrouter.ai/docs)

---

**Happy Testing! 🚀**

