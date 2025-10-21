# 🎨 Professionelle E-Mail-Templates - Apple-Style

## Übersicht

Die E-Mail-Templates wurden komplett überarbeitet und verwenden jetzt ein modernes Apple-inspiriertes Design mit:

- **Professionellem Branding** mit ImmoNow-Logo
- **Apple-Style Design** mit Glasmorphismus-Effekten
- **Responsive Layout** für alle Geräte
- **Dunkelmodus-Support** für moderne E-Mail-Clients
- **Konsistente Farbpalette** basierend auf Apple's Design-System

## 🎨 Design-Features

### Farbpalette
- **Primary**: `#007AFF` (Apple Blue)
- **Secondary**: `#5856D6` (Apple Purple) 
- **Accent**: `#AF52DE` (Apple Pink)
- **Success**: `#34C759` (Apple Green)
- **Warning**: `#FF9500` (Apple Orange)
- **Error**: `#FF3B30` (Apple Red)
- **Neutral**: `#8E8E93` (Apple Gray)

### Typography
- **Font**: `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`
- **Headings**: 700 weight, -0.3px letter-spacing
- **Body**: 400 weight, 1.6 line-height
- **Small**: 14px, 1.5 line-height

### Layout-Elemente
- **Cards**: 16px border-radius, subtle shadows
- **Buttons**: 12px border-radius, gradient backgrounds
- **Priority Indicators**: 20px border-radius, color-coded
- **Spacing**: 8px grid system

## 📧 Template-Struktur

### Base Template (`base.html`)
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <!-- Apple-style CSS -->
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header mit Logo -->
            <div class="header">
                <div class="logo-container">
                    <div class="logo">
                        <!-- SVG Logo -->
                    </div>
                    <h1>ImmoNow</h1>
                    <p>Immobilien-Management</p>
                </div>
            </div>
            
            <!-- Content -->
            <div class="content">
                <!-- Template-spezifischer Inhalt -->
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <!-- Links & Unsubscribe -->
            </div>
        </div>
    </div>
</body>
</html>
```

### Spezifische Templates

#### 1. Property Notifications (`notification_property.html`)
- 🏠 Immobilien-spezifische Icons
- 📍 Adresse, 💰 Preis, 📊 Status
- 📋 "Immobilie anzeigen" Button

#### 2. Task Notifications (`notification_task.html`)
- ✅ Aufgaben-spezifische Icons
- 📝 Aufgabe, 📅 Fälligkeit, 👤 Zugewiesen
- 📋 "Aufgabe bearbeiten" Button

#### 3. Appointment Notifications (`notification_appointment.html`)
- 📅 Termin-spezifische Icons
- 📝 Termin, 📅 Datum, 📍 Ort, 👥 Teilnehmer
- 📋 "Termin anzeigen" Button

#### 4. Document Notifications (`notification_document.html`)
- 📄 Dokument-spezifische Icons
- 📄 Dokument, 🏷️ Typ, 📏 Größe, 👤 Uploader
- 📋 "Dokument anzeigen" Button

#### 5. Payment Success (`payment_success.html`)
- ✅ Erfolg-spezifische Icons
- 💰 Betrag, 📄 Rechnung, 📅 Datum, 📦 Plan
- 🎉 Erfolgs-Banner mit Gradient

#### 6. Welcome Email (`welcome.html`)
- 🎉 Willkommen-spezifische Icons
- 👤 Account, ⏰ Testphase
- 🚀 Feature-Übersicht mit Grid-Layout
- 📞 Support-Informationen

## 🔧 Technische Features

### Responsive Design
```css
@media only screen and (max-width: 600px) {
    .email-container { border-radius: 12px; }
    .content { padding: 30px 20px; }
    .action-button { width: 100%; }
}
```

### Dark Mode Support
```css
@media (prefers-color-scheme: dark) {
    .content { background: #1c1c1e; color: #ffffff; }
    .notification-card { background: #2c2c2e; }
}
```

### Priority Colors
```python
def get_priority_colors(priority: str) -> tuple[str, str]:
    color_map = {
        'urgent': ('#FF9500', '#E6850E'),  # Orange
        'high': ('#FF3B30', '#E5342B'),   # Red
        'normal': ('#34C759', '#30B04A'),  # Green
        'low': ('#8E8E93', '#7A7A7E'),    # Gray
    }
    return color_map.get(priority.lower(), ('#007AFF', '#0056CC'))
```

## 🎯 Template-Kontext

### Standard-Variablen
```python
context = {
    'frontend_url': 'http://localhost:3000',
    'priority_color': '#007AFF',
    'priority_color_dark': '#0056CC',
    'unsubscribe_url': '/profile#notifications',
    'user_name': 'Lieber Kunde',
    'timestamp': '18.10.2025 16:57',
}
```

### Template-spezifische Variablen
```python
# Property Template
property_context = {
    'property_address': 'Musterstraße 123, 12345 Berlin',
    'property_price': '€ 450.000',
    'property_status': 'Verfügbar',
    'property_type': 'Eigentumswohnung',
}

# Task Template
task_context = {
    'task_title': 'Besichtigungstermin vereinbaren',
    'task_due_date': '25.10.2025',
    'task_assignee': 'Max Mustermann',
    'task_status': 'In Bearbeitung',
}

# Payment Template
payment_context = {
    'invoice_amount': '€ 29,99',
    'invoice_number': 'INV-2025-001',
    'payment_date': '18.10.2025',
    'subscription_plan': 'Pro Plan',
    'next_billing_date': '18.11.2025',
}
```

## 🚀 Verwendung

### Template rendern
```python
from app.services.email_service import EmailService

# Template mit Kontext rendern
html_content = EmailService._render_template(
    'notification_property.html',
    {
        'notification_title': 'Neue Immobilie erstellt',
        'message': 'Eine neue Immobilie wurde zu Ihrem Portfolio hinzugefügt.',
        'priority': 'normal',
        'property_address': 'Musterstraße 123, Berlin',
        'property_price': '€ 450.000',
        'action_url': 'https://app.immonow.com/properties/123',
        'action_label': 'Immobilie anzeigen',
    }
)
```

### E-Mail senden
```python
# E-Mail über SendGrid/Mailgun senden
success = await EmailService._send_email(
    to_email='user@example.com',
    subject='🏠 Immobilien-Benachrichtigung: Neue Immobilie erstellt',
    html_content=html_content
)
```

## 📱 E-Mail-Client-Kompatibilität

### Unterstützte Clients
- ✅ **Apple Mail** (macOS/iOS)
- ✅ **Gmail** (Web/Mobile)
- ✅ **Outlook** (Web/Desktop/Mobile)
- ✅ **Thunderbird**
- ✅ **Yahoo Mail**

### CSS-Features
- ✅ **Flexbox** für Layout
- ✅ **CSS Grid** für Feature-Grids
- ✅ **Gradients** für Buttons und Header
- ✅ **Border-radius** für moderne Ecken
- ✅ **Box-shadow** für Tiefe
- ✅ **Media queries** für Responsive Design

## 🎨 Customization

### Farben anpassen
```css
:root {
    --primary-color: #007AFF;
    --secondary-color: #5856D6;
    --accent-color: #AF52DE;
    --success-color: #34C759;
    --warning-color: #FF9500;
    --error-color: #FF3B30;
}
```

### Logo anpassen
```html
<div class="logo">
    <!-- Eigenes SVG oder PNG Logo -->
    <img src="data:image/svg+xml;base64,..." alt="ImmoNow" />
</div>
```

### Schriftarten anpassen
```css
body {
    font-family: 'Custom Font', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

## 📊 Performance

### Optimierungen
- **Inline CSS** für maximale Kompatibilität
- **SVG Icons** für skalierbare Grafiken
- **Minimierte HTML** für schnelle Ladezeiten
- **Responsive Images** für verschiedene Bildschirmgrößen

### Dateigrößen
- **Base Template**: ~8KB
- **Property Template**: ~12KB
- **Task Template**: ~10KB
- **Payment Template**: ~15KB
- **Welcome Template**: ~18KB

## 🔍 Testing

### Test-E-Mail senden
```bash
# API-Endpoint testen
curl -X POST "http://localhost:8000/api/v1/test/simple-test-email"

# Konfiguration prüfen
curl "http://localhost:8000/api/v1/test/email-config"
```

### E-Mail-Vorschau
- **Console-Modus**: E-Mails werden im Terminal ausgegeben
- **SendGrid**: E-Mails werden an echte Adressen gesendet
- **Mailgun**: E-Mails werden an echte Adressen gesendet

## 📈 Analytics

### Tracking-Parameter
```html
<!-- UTM-Parameter für Analytics -->
<a href="{{ action_url }}?utm_source=email&utm_medium=notification&utm_campaign=property_update">
    Immobilie anzeigen
</a>
```

### Öffnungs-Tracking
```html
<!-- 1x1 Pixel für Öffnungs-Tracking -->
<img src="{{ tracking_url }}/open/{{ email_id }}" width="1" height="1" />
```

---

## 🎉 Ergebnis

Die neuen E-Mail-Templates bieten:

- **Professionelles Design** im Apple-Stil
- **Konsistente Branding** mit ImmoNow-Logo
- **Responsive Layout** für alle Geräte
- **Moderne Farbpalette** basierend auf Apple's Design-System
- **Hohe Kompatibilität** mit allen E-Mail-Clients
- **Optimierte Performance** für schnelle Ladezeiten

**Die E-Mails sehen jetzt aus wie von Apple designed!** 🍎✨
