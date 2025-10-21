# 🚀 Quick Setup Guide - E-Mail Notifications

## In 5 Minuten einsatzbereit!

### 1. SendGrid Account (2 Min)
1. Gehe zu [sendgrid.com](https://sendgrid.com) → Kostenlos registrieren
2. Settings → API Keys → Create API Key → "Full Access"
3. Kopiere API-Key (beginnt mit `SG.`)

### 2. Environment Setup (1 Min)
Erstelle `backend/.env.local`:
```bash
EMAIL_PROVIDER=sendgrid
EMAIL_ENABLED=true
SENDGRID_API_KEY=SG.dein-api-key-hier
SENDGRID_FROM_EMAIL=noreply@immonow.com
SENDGRID_FROM_NAME=ImmoNow
FRONTEND_URL=http://localhost:3000
```

### 3. Sender Verification (1 Min)
- SendGrid → Settings → Sender Authentication → Single Sender Verification
- Füge hinzu: `noreply@immonow.com` oder deine E-Mail
- Verifiziere per E-Mail

### 4. Test (1 Min)
```bash
cd backend
python -m uvicorn app.main:app --reload
```
Gehe zu `http://localhost:8000/docs` → POST `/api/v1/test/simple-test-email`

## ✅ Fertig!

**Das System sendet jetzt automatisch E-Mails bei:**
- 🏠 Property-Events (Erstellung, Status-Änderung)
- ✅ Task-Events (Zuweisung, Fälligkeit)
- 📅 Appointment-Events (Erstellung, Erinnerung)
- 📄 Document-Events (Upload, Sharing)
- 👥 Contact-Events (Erstellung, Zuweisung)
- 💰 Financial-Events (Zahlungen, Abo-Änderungen)
- 🔔 System-Events (Welcome, Trial-Expired)

**Jeder Benutzer kann seine E-Mail-Präferenzen individuell einstellen!**

---

📖 **Vollständige Dokumentation**: `docs/EMAIL_NOTIFICATIONS_SETUP.md`
