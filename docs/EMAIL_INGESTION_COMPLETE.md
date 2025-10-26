# Email-Ingestion Hook + Parser (Phase 1)

## Übersicht

Implementierung eines provider-agnostischen Email-Ingestion-Systems für automatische Lead-Erfassung aus eingehenden Emails.

## Features

### ✅ Implementiert

- **Email Parser Service** mit Regex-Patterns für deutsche und englische Emails
- **Lead Ingestion Service** mit Deduplication und Validation
- **Provider-agnostische Webhook-API** für verschiedene Email-Provider
- **Feature Flag** für sicheren Rollout
- **Umfassende Tests** für alle Komponenten

### 🔄 Phase 1 Scope

- Basis Email-Parsing mit 2-3 Regex-Patterns
- Lead-Deduplication via Email-Hash
- Provider-agnostischer Webhook-Endpoint
- Basic Validation & Error-Handling

## API Endpoints

### 1. Provider-agnostischer Endpoint

```http
POST /api/v1/hooks/email/inbound
Content-Type: application/json

{
  "subject": "Interesse an Immobilie",
  "body": "Hallo, mein Name ist Max Mustermann...",
  "sender_email": "max@example.com",
  "sender_name": "Max Mustermann",
  "property_id": "optional-property-id",
  "source_url": "optional-source-url"
}
```

### 2. Provider-spezifische Webhooks

#### SendGrid
```http
POST /api/v1/hooks/email/webhook/sendgrid
Content-Type: application/json

{
  "email": {
    "subject": "Test Subject",
    "text": "Email Body",
    "from": {
      "email": "sender@example.com",
      "name": "Sender Name"
    }
  }
}
```

#### Mailgun
```http
POST /api/v1/hooks/email/webhook/mailgun
Content-Type: application/x-www-form-urlencoded

subject=Test Subject&body-plain=Email Body&sender=sender@example.com
```

#### AWS SES
```http
POST /api/v1/hooks/email/webhook/ses
Content-Type: application/json

{
  "Message": {
    "content": {
      "subject": "Test Subject",
      "text": "Email Body",
      "from": {
        "email": "sender@example.com",
        "name": "Sender Name"
      }
    }
  }
}
```

### 3. Statistiken und Management

```http
GET /api/v1/hooks/email/stats
POST /api/v1/hooks/email/reprocess?limit=10
```

## Email Parser Patterns

### Name-Extraktion

```regex
# Deutsche Namen
(?:Name|Ihr Name|Mein Name)[\s:]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)
(?:Ich bin|Mein Name ist|Ich heiße)[\s:]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)

# Englische Namen
(?:Name|My name|I am)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)
(?:I am|My name is)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)
```

### Email-Extraktion

```regex
([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})
(?:E-Mail|Email|Mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})
```

### Telefon-Extraktion

```regex
# Deutsche Telefonnummern
(?:\+49|0049|0)[\s\-]?(\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})
(?:Tel|Telefon|Phone)[\s:]*(\+?49[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})

# Internationale Formate
(\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})
```

### Budget-Extraktion

```regex
# Deutsche Budget-Formate
(?:Budget|Preis|Kosten)[\s:]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€?
(?:bis zu|maximal|höchstens)[\s:]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€?

# Englische Budget-Formate
(?:Budget|Price|Cost)[\s:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$?
(?:up to|maximum|max)[\s:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$?
```

## Lead Validation

### Mindestanforderungen

- ✅ Email-Adresse (erforderlich)
- ✅ Name (erforderlich)
- ✅ Confidence-Score ≥ 0.3

### Validierungsregeln

- Email: Gültiges Format
- Telefon: Mindestens 10 Ziffern
- Budget: Zwischen 10.000€ und 10.000.000€
- Name: Mindestens 2 Zeichen, keine Zahlen

## Deduplication

### Hash-Generierung

1. **Primär**: Email-Adresse (MD5)
2. **Fallback**: Name + Telefon (MD5)
3. **Letzter Fallback**: Raw-Text (MD5)

### Duplikat-Erkennung

- Gleiche Email-Adresse → Duplikat
- Gleicher Name + Telefon → Duplikat
- Gleicher Hash → Duplikat

## Confidence-Score

### Berechnung

```python
score = 0.0
if name: score += 0.3
if email: score += 0.3
if phone: score += 0.2
if budget: score += 0.1
if property_type: score += 0.05
if location: score += 0.05

# Bonus für vollständige Kontaktdaten
if name and email and phone: score += 0.1

# Bonus für hohes Budget
if budget and budget > 100000: score += 0.1

return min(score, 1.0)
```

### Score-Interpretation

- **0.8-1.0**: Sehr hohe Qualität
- **0.6-0.8**: Hohe Qualität
- **0.4-0.6**: Mittlere Qualität
- **0.3-0.4**: Niedrige Qualität (minimal akzeptabel)
- **0.0-0.3**: Ungültig (wird verworfen)

## Feature Flag

### Aktivierung

```bash
# Environment Variable
EMAIL_INGESTION=true

# Oder in env.local
EMAIL_INGESTION=true
```

### Deaktivierung

```bash
EMAIL_INGESTION=false
# oder einfach nicht setzen (default: false)
```

## Provider-Setup

### SendGrid

1. **Inbound Parse Webhook** konfigurieren
2. **Webhook URL**: `https://your-domain.com/api/v1/hooks/email/webhook/sendgrid`
3. **Authentication**: JWT Token erforderlich

### Mailgun

1. **Inbound Routes** konfigurieren
2. **Webhook URL**: `https://your-domain.com/api/v1/hooks/email/webhook/mailgun`
3. **Authentication**: JWT Token erforderlich

### AWS SES

1. **SES Rule Set** konfigurieren
2. **Lambda Function** oder **SNS Topic** → Webhook
3. **Webhook URL**: `https://your-domain.com/api/v1/hooks/email/webhook/ses`

## Testing

### Unit Tests

```bash
# Email Parser Tests
pytest backend/tests/api/test_email_ingestion.py::TestEmailParserService

# Lead Ingestion Tests
pytest backend/tests/api/test_email_ingestion.py::TestLeadIngestionService

# API Tests
pytest backend/tests/api/test_email_ingestion.py::TestEmailWebhookAPI
```

### Integration Tests

```bash
# Vollständige Email-Verarbeitung
pytest backend/tests/api/test_email_ingestion.py -v
```

## Monitoring

### Logs

```python
# Erfolgreiche Lead-Verarbeitung
logger.info(f"Successfully processed lead: {contact.email} (confidence: {confidence})")

# Duplikat-Erkennung
logger.info(f"Duplicate lead detected: {sender_email}")

# Validierungsfehler
logger.warning(f"Invalid lead from {sender_email}: {validation_errors}")
```

### Metriken

- `email_leads_processed_total` (Counter)
- `email_leads_duplicates_total` (Counter)
- `email_leads_invalid_total` (Counter)
- `email_parser_confidence_histogram` (Histogram)

## Rollout-Plan

### Phase 1 (Aktuell)

1. ✅ Feature Flag `EMAIL_INGESTION=false` (default)
2. ✅ Provider-agnostischer Endpoint implementiert
3. ✅ Basis Email-Parsing mit Regex-Patterns
4. ✅ Lead-Deduplication via Email-Hash
5. ✅ Basic Validation & Error-Handling

### Phase 2 (Zukünftig)

- Machine Learning-basierte Email-Parsing
- Erweiterte Deduplication mit Fuzzy-Matching
- Lead-Scoring und Qualitätsbewertung
- Automatische Property-Zuordnung
- CRM-Integration

### Phase 3 (Zukünftig)

- Multi-Language Support (EN, DE, FR, ES)
- Attachment-Verarbeitung
- Email-Thread-Tracking
- Advanced Analytics und Reporting

## Troubleshooting

### Häufige Probleme

1. **Niedrige Confidence-Scores**
   - Prüfe Email-Format und Regex-Patterns
   - Validiere Input-Daten

2. **Duplikat-Erkennung funktioniert nicht**
   - Prüfe Hash-Generierung
   - Validiere Email-Normalisierung

3. **Provider-Webhooks funktionieren nicht**
   - Prüfe Authentication (JWT Token)
   - Validiere Webhook-URL
   - Prüfe Provider-spezifische Datenformate

### Debug-Modus

```python
# In EmailParserService
logger.setLevel(logging.DEBUG)

# Detaillierte Parsing-Logs
logger.debug(f"Parsing email: {subject[:50]}...")
logger.debug(f"Extracted name: {parsed_lead.name}")
logger.debug(f"Extracted email: {parsed_lead.email}")
logger.debug(f"Confidence score: {parsed_lead.confidence}")
```
