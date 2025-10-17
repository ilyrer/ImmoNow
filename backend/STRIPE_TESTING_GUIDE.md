# Stripe Subscription Integration - Manual Testing Guide

## Übersicht

Diese Anleitung beschreibt die manuellen Tests für die Stripe Subscription Integration. Alle Tests werden ohne Frontend-Änderungen durchgeführt - die Billing-Logik läuft vollständig serverseitig.

## Vorbereitung

### 1. Environment Setup

```bash
# Backend Environment Variables setzen
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_PUBLISHABLE_KEY="pk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export STRIPE_PRICE_STARTER="price_..."
export STRIPE_PRICE_PRO="price_..."
export STRIPE_PRICE_ENTERPRISE="price_..."
export FRONTEND_URL="http://localhost:3000"
```

### 2. Django Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 3. Bestehende Tenants migrieren

```bash
python migrate_billing.py
```

## Test-Szenarien

### Test 1: Registrierung mit automatischer Stripe-Integration

**Ziel:** Überprüfen dass neue Registrierungen automatisch Stripe Customer und BillingAccount erstellen.

**Schritte:**
1. Öffne Frontend-Registrierungsseite
2. Registriere neuen User mit Firmendaten
3. Prüfe Backend-Logs auf Stripe Customer-Erstellung
4. Verifiziere BillingAccount in Datenbank

**Erwartetes Ergebnis:**
- Registrierung funktioniert wie bisher
- Stripe Customer wird erstellt
- BillingAccount mit plan_key="free" wird angelegt
- Keine Frontend-Änderungen sichtbar

**Verifikation:**
```python
# In Django Shell
from app.db.models import BillingAccount, Tenant
billing = BillingAccount.objects.filter(tenant__name="Test Company").first()
print(f"Plan: {billing.plan_key}, Status: {billing.status}")
print(f"Stripe Customer: {billing.stripe_customer_id}")
```

### Test 2: Property-Limit Durchsetzung (Free Plan)

**Ziel:** Überprüfen dass Free Plan-Limits serverseitig durchgesetzt werden.

**Schritte:**
1. Registriere neuen Tenant (Free Plan)
2. Erstelle 5 Properties über API
3. Versuche 6. Property zu erstellen
4. Prüfe HTTP-Response

**Erwartetes Ergebnis:**
- Erste 5 Properties werden erfolgreich erstellt
- 6. Property gibt HTTP 403 mit `PLAN_LIMIT_REACHED`
- Fehler enthält `required_plan: "starter"`

**API-Test:**
```bash
# 6. Property erstellen
curl -X POST "http://localhost:8000/api/v1/properties" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Property 6", "property_type": "apartment", "location": "Test"}'

# Erwartete Response:
# HTTP 403
# {
#   "code": "PLAN_LIMIT_REACHED",
#   "message": "Property limit reached (5)",
#   "required_plan": "starter"
# }
```

### Test 3: User-Limit Durchsetzung (Free Plan)

**Ziel:** Überprüfen dass User-Limits durchgesetzt werden.

**Schritte:**
1. Verwende Tenant mit Free Plan (2 User Limit)
2. Erstelle 2 UserProfiles
3. Versuche 3. User zu erstellen
4. Prüfe HTTP-Response

**Erwartetes Ergebnis:**
- HTTP 403 mit `PLAN_LIMIT_REACHED` für User-Limit

### Test 4: Storage-Limit Durchsetzung

**Ziel:** Überprüfen dass Storage-Limits bei Dokument-Upload durchgesetzt werden.

**Schritte:**
1. Verwende Tenant mit Free Plan (1GB Limit)
2. Lade große Dokumente hoch
3. Prüfe dass Limit erreicht wird

**Erwartetes Ergebnis:**
- HTTP 403 mit `PLAN_LIMIT_REACHED` für Storage-Limit

### Test 5: Subscription-Status Durchsetzung

**Ziel:** Überprüfen dass inaktive Subscriptions blockiert werden.

**Schritte:**
1. Setze BillingAccount.status auf "past_due"
2. Versuche Property zu erstellen
3. Prüfe HTTP-Response

**Erwartetes Ergebnis:**
- HTTP 402 mit `SUBSCRIPTION_REQUIRED`

**Datenbank-Update:**
```python
# In Django Shell
from app.db.models import BillingAccount
billing = BillingAccount.objects.get(tenant__name="Test Company")
billing.status = "past_due"
billing.save()
```

### Test 6: Billing API Endpoints

**Ziel:** Überprüfen dass Billing-API Endpoints funktionieren.

**Schritte:**
1. Hole Billing-Info über API
2. Erstelle Portal-Session
3. Erstelle Checkout-Session

**API-Tests:**
```bash
# Billing Info abrufen
curl -X GET "http://localhost:8000/api/billing/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"

# Portal Session erstellen
curl -X POST "http://localhost:8000/api/billing/portal" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"

# Checkout Session erstellen
curl -X POST "http://localhost:8000/api/billing/checkout?plan=starter" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Test 7: Stripe Webhook-Verarbeitung

**Ziel:** Überprüfen dass Stripe Webhooks korrekt verarbeitet werden.

**Schritte:**
1. Installiere Stripe CLI
2. Forwarde Webhooks zu lokalem Server
3. Simuliere verschiedene Events
4. Prüfe Datenbank-Updates

**Stripe CLI Setup:**
```bash
# Stripe CLI installieren
stripe listen --forward-to localhost:8000/api/billing/stripe/webhook

# Event simulieren
stripe trigger checkout.session.completed
```

**Erwartetes Ergebnis:**
- Webhook wird empfangen und verarbeitet
- BillingAccount wird aktualisiert
- Idempotenz verhindert doppelte Verarbeitung

### Test 8: Plan-Upgrade über Webhook

**Ziel:** Überprüfen dass Plan-Upgrades über Webhooks funktionieren.

**Schritte:**
1. Erstelle Checkout-Session für Starter Plan
2. Simuliere erfolgreiche Zahlung
3. Prüfe dass Plan upgraded wird
4. Teste dass neue Limits greifen

**Erwartetes Ergebnis:**
- Plan wird von "free" zu "starter" upgraded
- Neue Limits (5 Properties, 5 Users) werden aktiv
- Weitere Properties können erstellt werden

### Test 9: Plan-Downgrade über Webhook

**Ziel:** Überprüfen dass Plan-Downgrades funktionieren.

**Schritte:**
1. Simuliere Subscription-Deletion
2. Prüfe dass Plan zu "free" downgraded wird
3. Teste dass alte Limits wieder greifen

**Erwartetes Ergebnis:**
- Plan wird zu "free" downgraded
- Alte Limits werden wieder aktiv
- Überschreitung der Limits führt zu Fehlern

### Test 10: Usage-Tracking

**Ziel:** Überprüfen dass Usage korrekt getrackt wird.

**Schritte:**
1. Erstelle verschiedene Resources
2. Prüfe Usage-Snapshot über API
3. Vergleiche mit Limits

**API-Test:**
```bash
curl -X GET "http://localhost:8000/api/billing/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

**Erwartetes Ergebnis:**
- Usage wird korrekt berechnet
- Prozentuale Auslastung wird angezeigt
- Limits werden korrekt verglichen

## Fehlerbehandlung

### Häufige Probleme

1. **Stripe API Key nicht gesetzt**
   - Fehler: "Stripe integration failed"
   - Lösung: STRIPE_SECRET_KEY in Environment setzen

2. **Webhook-Signatur fehlschlägt**
   - Fehler: "Invalid signature"
   - Lösung: STRIPE_WEBHOOK_SECRET korrekt setzen

3. **BillingAccount nicht gefunden**
   - Fehler: "Billing account not found"
   - Lösung: Migration-Script ausführen

4. **Plan-Limits nicht aktualisiert**
   - Fehler: Alte Limits werden verwendet
   - Lösung: Tenant-Limits manuell aktualisieren

### Debugging

**Logs prüfen:**
```bash
# Backend-Logs
tail -f backend/logs/django.log

# Stripe CLI Logs
stripe logs tail
```

**Datenbank prüfen:**
```python
# Django Shell
from app.db.models import BillingAccount, StripeWebhookEvent
print("BillingAccounts:", BillingAccount.objects.count())
print("Webhook Events:", StripeWebhookEvent.objects.count())
```

## Erfolgskriterien

✅ **Registrierung:** Neue User erhalten automatisch Stripe Customer und BillingAccount

✅ **Limits:** Free Plan-Limits werden serverseitig durchgesetzt

✅ **Webhooks:** Stripe Events werden korrekt verarbeitet

✅ **Upgrades:** Plan-Upgrades funktionieren über Webhooks

✅ **Downgrades:** Plan-Downgrades funktionieren korrekt

✅ **API:** Billing-API Endpoints funktionieren

✅ **Idempotenz:** Webhook-Events werden nicht doppelt verarbeitet

✅ **Tenant-Isolation:** Jeder Tenant hat eigene Billing-Daten

✅ **Error Handling:** Strukturierte Fehler mit korrekten HTTP-Codes

## Nächste Schritte

Nach erfolgreichen Tests:

1. **Stripe Price IDs konfigurieren** in Stripe Dashboard
2. **Webhook-Endpoint** in Stripe Dashboard einrichten
3. **Frontend-Integration** für Billing-Management (optional)
4. **Monitoring** für Billing-Events einrichten
5. **Backup-Strategie** für Billing-Daten

## Support

Bei Problemen:
- Prüfe Backend-Logs
- Verifiziere Stripe-Dashboard
- Teste mit Stripe CLI
- Prüfe Datenbank-Status

