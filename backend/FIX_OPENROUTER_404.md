# Fix: OpenRouter 404 Error - "No endpoints found matching your data policy"

## 🔴 Der Fehler

```
Error code: 404 - {'error': {'message': 'No endpoints found matching your data policy (Free model publication). Configure: https://openrouter.ai/settings/privacy', 'code': 404}}
```

## 🎯 Das Problem

Um **kostenlose Modelle** (wie `deepseek/deepseek-chat-v3.1:free`) bei OpenRouter zu nutzen, musst du in deinen **Account-Einstellungen** die Verwendung kostenloser Modelle erlauben.

OpenRouter benötigt diese Einstellung aus Sicherheits- und Datenschutzgründen.

---

## ✅ Lösung 1: Privacy Settings anpassen (KOSTENLOS)

### Schritt 1: Öffne die Privacy Settings
🔗 **https://openrouter.ai/settings/privacy**

### Schritt 2: Aktiviere kostenlose Modelle

Suche nach einer dieser Optionen und **aktiviere** sie:

- ☑️ **"Allow using free credits"** oder
- ☑️ **"Allow free model usage"** oder
- ☑️ **"Enable free models"** oder
- ☑️ Ändere die **Data Policy** auf **"Allow"**

### Schritt 3: Speichern

Klicke auf **"Save"** oder **"Update Settings"**

### Schritt 4: Warten (wichtig!)

⏱️ Warte **30-60 Sekunden** bis die Änderungen wirksam werden.

### Schritt 5: Server neu starten

```bash
# Server stoppen (Strg+C in der Konsole wo der Server läuft)
# Dann neu starten:
cd backend
python main.py
```

### Schritt 6: Erneut testen

```bash
cd backend
python test_llm_api.py
```

**Erwartetes Ergebnis:**
```
✅ Alle Tests erfolgreich!
Die OpenRouter Integration funktioniert korrekt! 🎉
```

---

## ✅ Lösung 2: Bezahltes Modell verwenden (SEHR GÜNSTIG)

Falls du die Privacy Settings nicht ändern möchtest oder es nicht funktioniert, kannst du das **bezahlte DeepSeek Modell** verwenden. Es ist **extrem günstig**:

### Kosten:
- **$0.14 per 1 Million Input Tokens**
- **$0.28 per 1 Million Output Tokens**

Zum Vergleich: Eine typische Konversation kostet nur ca. **$0.0001** (0.01 Cent)!

### Änderung in deiner `.env` oder `env.local` Datei:

```bash
# Ändere diese Zeile:
# OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# Zu:
OPENROUTER_MODEL=deepseek/deepseek-chat
```

### Server neu starten

```bash
cd backend
python main.py
```

### Erneut testen

```bash
cd backend
python test_llm_api.py
```

---

## 🔍 Debug: Überprüfe deine Konfiguration

Führe diesen Befehl aus um zu sehen, welches Modell aktuell konfiguriert ist:

```bash
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env'); load_dotenv('env.local'); print('Model:', os.getenv('OPENROUTER_MODEL')); print('API Key:', os.getenv('OPENROUTER_API_KEY')[:20] + '...' if os.getenv('OPENROUTER_API_KEY') else 'NOT SET')"
```

**Erwartete Ausgabe:**
```
Model: deepseek/deepseek-chat-v3.1:free
API Key: sk-or-v1-74d7ba8c5f...
```

---

## 📊 Vergleich der Modelle

| Modell | Kosten | Privacy Setting nötig? | Performance |
|--------|--------|------------------------|-------------|
| `deepseek/deepseek-chat-v3.1:free` | **$0.00** | ✅ Ja | Sehr gut |
| `deepseek/deepseek-chat` | **$0.14/$0.28 per 1M tokens** | ❌ Nein | Identisch |
| `qwen/qwen-2.5-72b-instruct` | **$0.35/$0.35 per 1M tokens** | ❌ Nein | Sehr gut |

**Empfehlung:**
- Für Development: `deepseek/deepseek-chat-v3.1:free` (nach Privacy-Einstellung)
- Für Production: `deepseek/deepseek-chat` (extrem günstig und zuverlässig)

---

## 🔧 Weitere mögliche Probleme

### Problem: "Invalid API Key"
**Lösung:** Erstelle einen neuen API-Key auf https://openrouter.ai/keys

### Problem: "Insufficient credits"
**Lösung 1:** Gehe zu https://openrouter.ai/credits und lade dein Konto auf
**Lösung 2:** Verwende das kostenlose Modell mit aktivierten Privacy Settings

### Problem: "Rate limit exceeded"
**Lösung:** Warte 1 Minute und versuche es erneut

---

## 🎉 Wenn alles funktioniert

Nach erfolgreicher Konfiguration solltest du folgendes sehen:

```bash
============================================================
Test 1: Allgemeine Frage (ohne Auth)
============================================================

URL: http://localhost:8000/api/v1/llm/test
Sende Anfrage...
Status Code: 200

✅ Erfolgreich!

Modell: deepseek/deepseek-chat-v3.1:free
Tokens verwendet: 142
Antwort: Immobilienverwaltung ist die professionelle...

============================================================
✅ Alle Tests erfolgreich!
============================================================
```

---

## 📱 Support

Wenn du weiterhin Probleme hast:

1. **Überprüfe deine OpenRouter Account Settings:**
   - https://openrouter.ai/settings/privacy
   - https://openrouter.ai/keys
   - https://openrouter.ai/credits

2. **Teste direkt in der OpenRouter Playground:**
   - https://openrouter.ai/playground
   - Wähle `deepseek/deepseek-chat-v3.1:free`
   - Teste eine einfache Anfrage

3. **OpenRouter Discord:**
   - https://discord.gg/openrouter

---

**Viel Erfolg! 🚀**

Nach der Konfiguration sollte alles reibungslos funktionieren.

