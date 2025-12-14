# 🚀 AVM Premium Setup-Anleitung

## ✅ Schritt-für-Schritt Installation

### 1. Backend `.env` Datei erstellen

```bash
cd backend
cp env.example .env
```

### 2. **ZWINGEND ERFORDERLICH** - Basis-Konfiguration

Öffnen Sie `backend/.env` und setzen Sie:

```env
# ===== MINIMAL REQUIRED =====
SECRET_KEY=your-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-key-here-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ===== KI/LLM (für AVM-Bewertungen) =====
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# ===== TOKEN ENCRYPTION (für Social Media & Portals) =====
# Generiere mit: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=YOUR-FERNET-KEY-HERE
```

### 3. **OpenRouter API Key** holen (KOSTENLOS!)

1. Gehe zu: https://openrouter.ai/
2. Registriere dich (kostenlos)
3. Gehe zu: https://openrouter.ai/keys
4. Erstelle einen API Key
5. **WICHTIG:** Gehe zu https://openrouter.ai/settings/privacy
6. Aktiviere "**Allow free models**"
7. Kopiere den Key in deine `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-dein-key-hier
   ```

### 4. **Fernet Key** generieren

```bash
cd backend
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Kopiere den Output in deine `.env`:
```env
FERNET_KEY=der-generierte-key-hier
```

### 5. **AVM-spezifische Konfiguration** (Optional)

Füge in `backend/.env` hinzu:

```env
# ===== AVM CONFIGURATION =====
# Geocoding (OpenStreetMap Nominatim - KOSTENLOS, kein API Key nötig!)
NOMINATIM_USER_AGENT=ImmoNow AVM Service
NOMINATIM_EMAIL=deine-email@beispiel.de

# AVM Settings
AVM_CACHE_TTL_SECONDS=3600
AVM_MAX_COMPARABLES=20
AVM_SEARCH_RADIUS_KM=5
```

### 6. Backend starten

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python main.py
```

Backend läuft auf: http://localhost:8000

### 7. Frontend starten (neues Terminal)

```bash
cd frontend
npm install
npm start
```

Frontend läuft auf: http://localhost:3000

### 8. AVM testen

Navigiere zu: http://localhost:3000/avm

---

## 🎯 Was funktioniert jetzt?

### ✅ Sofort einsatzbereit (mit Basis-Config):
- **Geocoding**: OpenStreetMap Nominatim (kostenlos, kein API-Key!)
- **POI-Daten**: Overpass API (kostenlos, kein API-Key!)
- **KI-Bewertung**: OpenRouter (kostenlose Modelle verfügbar!)
- **Mock-Vergleichsobjekte**: Intelligente Dummy-Daten für Tests
- **PDF-Export**: ReportLab (keine Config nötig)
- **Premium UI**: Glassmorphismus-Design

### 📊 Datenquellen (aktuell):
- ✅ **Geocoding**: OpenStreetMap Nominatim (kostenlos)
- ✅ **POIs**: Overpass API (kostenlos)
- ✅ **LLM-Analyse**: OpenRouter DeepSeek (kostenlos)
- ⚠️ **Vergleichsobjekte**: Mock-Daten (funktional für Tests)
- ⚠️ **Marktdaten**: Mock-Daten (funktional für Tests)

### 🔮 Optional: Echte Marktdaten aktivieren

Für **echte Vergleichsobjekte** von ImmoScout24/Immowelt:

```env
# ImmoScout24 API (API-Zugang beantragen)
IMMOSCOUT24_CLIENT_ID=your-client-id
IMMOSCOUT24_CLIENT_SECRET=your-client-secret
IMMOSCOUT24_USE_SANDBOX=True

# Immowelt API (API-Zugang beantragen)
IMMOWELT_CLIENT_ID=your-client-id
IMMOWELT_CLIENT_SECRET=your-client-secret
IMMOWELT_USE_SANDBOX=True
```

**Ohne diese Keys:** AVM verwendet intelligente Mock-Daten (perfekt für Entwicklung/Tests)

---

## 🐛 Troubleshooting

### Problem: "422 Unprocessable Content"
**Lösung**: Überprüfe, ob alle Pflichtfelder in Step 1-2 ausgefüllt sind.

### Problem: "Geocoding failed"
**Lösung**: 
- Überprüfe Internetverbindung
- OpenStreetMap Nominatim ist kostenlos und ohne API-Key nutzbar
- Optional: Setze `NOMINATIM_EMAIL` für höhere Rate Limits

### Problem: "AI Provider error"
**Lösung**:
1. Überprüfe `OPENROUTER_API_KEY` in `.env`
2. Aktiviere "Allow free models" in OpenRouter Settings
3. Überprüfe Model-Name: `deepseek/deepseek-chat-v3.1:free`

### Problem: "Module not found"
**Lösung**:
```bash
cd backend
pip install -r requirements.txt
```

### Problem: "Port already in use"
**Lösung**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill
```

---

## 📦 Benötigte Dependencies

### Backend (bereits in requirements.txt):
- `fastapi` - API Framework
- `httpx` - Async HTTP Client (für Geocoding/POIs)
- `reportlab` - PDF Generation
- `matplotlib` - Charts für PDFs
- `cryptography` - Token Encryption

### Frontend (bereits in package.json):
- `react-leaflet` - Karten-Integration
- `leaflet` - Karten-Library
- `recharts` - Charting

---

## 🎯 Nächste Schritte

1. ✅ **Setup abschließen** (siehe oben)
2. ✅ **AVM testen**: http://localhost:3000/avm
3. 🔄 **Optional**: ImmoScout24/Immowelt APIs beantragen
4. 🔄 **Optional**: Redis für Caching einrichten
5. 🔄 **Optional**: PostgreSQL statt SQLite

---

## 💡 Pro-Tipps

### Performance optimieren:
```env
# Redis für Caching (optional, aber empfohlen)
REDIS_URL=redis://localhost:6379/1
```

### Geocoding Rate Limits erhöhen:
```env
# Setze deine echte Email für Nominatim
NOMINATIM_EMAIL=deine-email@beispiel.de
```

### Premium LLM nutzen (nur bei Bedarf):
```env
# Wechsel von kostenlos zu bezahlt (sehr günstig)
OPENROUTER_MODEL=deepseek/deepseek-chat  # $0.14/1M tokens
```

---

## ✅ Checklist

- [ ] `.env` erstellt und ausgefüllt
- [ ] `OPENROUTER_API_KEY` gesetzt
- [ ] "Allow free models" in OpenRouter aktiviert
- [ ] `FERNET_KEY` generiert
- [ ] Backend startet ohne Fehler
- [ ] Frontend startet ohne Fehler
- [ ] AVM-Seite lädt (http://localhost:3000/avm)
- [ ] Bewertung funktioniert

**Alles grün? Perfekt! 🎉**

