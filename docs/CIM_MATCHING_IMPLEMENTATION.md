# CIM Matching Implementation - Budget-basierte Immobilienempfehlungen

## Übersicht

Diese Implementierung behebt das Problem, dass Kontakte mit einem Potenzial/Budget von z.B. 200.000 € keine passenden Immobilien-Empfehlungen angezeigt bekommen haben.

## Änderungen

### 1. Backend - CIM Service (`backend/app/services/cim_service.py`)

#### Matching-Logik für Kontakte
- **Implementiert:** Budget-basiertes Matching für jeden Kontakt
- **Logik:** 
  - Sucht nach aktiven Immobilien im Preisbereich `budget_min` bis `budget_max * 1.1` (10% Toleranz)
  - Gibt die passenden Immobilien-IDs und die Anzahl zurück
  - Formatiert Budget-Strings korrekt auf Deutsch

```python
# Find matching properties based on budget
if budget_max:
    budget_upper_limit = budget_max * 1.1  # 10% tolerance
    budget_lower_limit = budget_min if budget_min else 0
    
    matching_props = await sync_to_async(list)(
        Property.objects.filter(
            tenant_id=self.tenant_id,
            status='active',
            price__gte=budget_lower_limit,
            price__lte=budget_upper_limit
        ).order_by('-created_at')[:5]
    )
```

#### Perfect Matches
- **Implementiert:** Intelligente "Perfect Matches" zwischen Kontakten und Immobilien
- **Scoring:**
  - 70% Preisübereinstimmung (Price Fit)
  - 30% Lead Score des Kontakts
- **Lead Quality Classification:**
  - Hot: Lead Score ≥ 70
  - Warm: Lead Score ≥ 40
  - Cold: Lead Score < 40

### 2. Backend - Contacts API (`backend/app/api/v1/contacts.py`)

#### Neuer Endpoint: `/api/v1/contacts/{contact_id}/matching-properties`

**Request:**
```http
GET /api/v1/contacts/{contact_id}/matching-properties?limit=10
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Moderne Wohnung in Kumhausen",
    "price": 195000.0,
    "location": "Kumhausen",
    "property_type": "apartment",
    "status": "active",
    "area": 85.5,
    "rooms": 3,
    ...
  }
]
```

### 3. Backend - Contacts Service (`backend/app/services/contacts_service.py`)

#### Neue Methode: `get_matching_properties()`

```python
async def get_matching_properties(
    self, 
    contact_id: str, 
    limit: int = 10
) -> List[PropertyResponse]:
    """Get matching properties for a contact based on budget"""
```

- Lädt den Kontakt
- Prüft `budget_max`
- Sucht passende Immobilien mit 10% Toleranz nach oben
- Gibt sortierte Liste zurück (neueste zuerst)

### 4. Frontend - CRM API (`real-estate-dashboard/src/api/crm/api.ts`)

#### Aktualisierte Funktion: `getRecommendations()`

```typescript
getRecommendations: async (contactId: string, limit: number = 10) => {
  try {
    const response = await apiClient.get(`/api/v1/contacts/${contactId}/matching-properties?limit=${limit}`);
    return { properties: response };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { properties: [] };
  }
}
```

## Verwendung

### Im CIM Dashboard

1. **Kontakte mit Budget werden automatisch gematched:**
   - Zeigt `matching_count` Badge an
   - Zeigt formatiertes Budget an
   - Kontakte ohne Budget erhalten keine Matches

2. **Perfect Matches Sektion:**
   - Zeigt Top 10 Kontakt-Immobilien-Paare
   - Sortiert nach Match Score
   - Zeigt Lead Quality (Hot/Warm/Cold)

### In der Kontaktdetail-Seite

1. **Budget eingeben:**
   - Gehen Sie zu "Bearbeiten"
   - Geben Sie das Budget Maximum ein (z.B. 200000)
   - Optional: Budget Minimum
   - Speichern

2. **Empfehlungen ansehen:**
   - Die Seite lädt automatisch passende Immobilien
   - Zeigt bis zu 10 passende Objekte
   - Klick auf Immobilie öffnet Detailseite

## Beispiel-Workflow

### Schritt 1: Kontakt mit Budget erstellen
```javascript
{
  name: "Max Mustermann",
  email: "max@example.com",
  phone: "0123456789",
  budget_max: 200000,
  budget_min: 150000,
  budget_currency: "EUR",
  status: "Lead"
}
```

### Schritt 2: System findet passende Immobilien
- Budget Range: 150.000 € - 220.000 € (200k + 10%)
- Sucht aktive Immobilien in diesem Bereich
- Zeigt Top 5-10 Matches

### Schritt 3: Im CIM Dashboard sichtbar
- Kontakt zeigt "5 Matches" Badge
- Budget: "€150.000 - €200.000"
- Perfect Matches Sektion zeigt beste Übereinstimmungen

## Testing

### 1. Backend Testing

```bash
cd backend
# Backend starten
uvicorn app.main:app --reload

# Test API Endpoint
curl -X GET "http://localhost:8000/api/v1/contacts/{contact_id}/matching-properties?limit=5" \
  -H "Authorization: Bearer {token}"
```

### 2. Frontend Testing

1. **Kontakt bearbeiten:**
   - Öffnen Sie einen Kontakt
   - Klicken Sie "Bearbeiten"
   - Geben Sie Budget ein: 200000
   - Speichern

2. **CIM Dashboard öffnen:**
   - Navigieren Sie zu CIM
   - Prüfen Sie "Recent Contacts" - sollte Matching Count zeigen
   - Prüfen Sie "Perfect Matches" Sektion

3. **Kontaktdetails prüfen:**
   - Öffnen Sie den Kontakt erneut
   - Sektion "Empfehlungen" sollte passende Immobilien zeigen

## Datenbank Schema

### Contact Model
```python
budget_min = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
budget_max = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
budget_currency = models.CharField(max_length=3, default='EUR')
```

- **max_digits=12**: Unterstützt bis zu 999.999.999.999 €
- **decimal_places=2**: Cent-genaue Speicherung
- **nullable**: Kontakte ohne Budget sind erlaubt

## Budget-Formatierung

### Backend (Python)
```python
if budget_min and budget_max:
    budget_formatted = f"€{budget_min:,.0f} - €{budget_max:,.0f}"
elif budget_min:
    budget_formatted = f"€{budget_min:,.0f}+"
elif budget_max:
    budget_formatted = f"bis zu €{budget_max:,.0f}"
else:
    budget_formatted = "Kein Budget angegeben"
```

### Frontend (JavaScript)
```javascript
const parseEuroNumber = (raw) => {
  // Unterstützt: 200000, 200.000, 200,000
  // Normalisiert zu: 200000
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};
```

## Matching-Toleranz

Die Implementierung verwendet eine **10% Toleranz** nach oben:

- **Budget:** 200.000 €
- **Matching Range:** 0 € - 220.000 €
- **Rationale:** Flexibilität für leicht teurere Objekte

Diese Toleranz kann angepasst werden in `cim_service.py`:
```python
budget_upper_limit = budget_max * 1.1  # Ändern Sie 1.1 auf gewünschten Faktor
```

## Nächste Schritte

### Mögliche Erweiterungen:

1. **Location-basiertes Matching:**
   - Zusätzliche Filterung nach `contact.location` vs `property.location`
   - Radius-basierte Suche

2. **Präferenzen-Matching:**
   - `contact.preferences` (JSON) mit Property Features abgleichen
   - Scoring basierend auf Präferenz-Übereinstimmung

3. **Benachrichtigungen:**
   - Automatische Benachrichtigung bei neuen Matches
   - E-Mail an Kontakt mit passenden Objekten

4. **Match-History:**
   - Tracking welche Immobilien einem Kontakt bereits gezeigt wurden
   - Vermeidung von Duplikaten

5. **AI-basiertes Matching:**
   - Machine Learning für bessere Match-Scores
   - Berücksichtigung historischer Interaktionen

## Troubleshooting

### Problem: Keine Matches angezeigt

**Lösung 1: Budget prüfen**
```sql
SELECT id, name, budget_min, budget_max 
FROM contacts 
WHERE id = '{contact_id}';
```

**Lösung 2: Aktive Immobilien prüfen**
```sql
SELECT COUNT(*) 
FROM properties 
WHERE status = 'active' 
AND price BETWEEN {budget_min} AND {budget_max * 1.1};
```

**Lösung 3: Frontend Cache löschen**
- Browser DevTools → Application → Clear Storage
- Oder Ctrl+Shift+R (Hard Refresh)

### Problem: Backend-Fehler

**Lösung: Logs prüfen**
```bash
cd backend
# Logs anzeigen
tail -f logs/app.log
```

## Autor & Datum

- **Implementiert:** 13. Oktober 2025
- **Version:** 1.0
- **Getestet mit:** Python 3.13, Node.js 20, React 18
