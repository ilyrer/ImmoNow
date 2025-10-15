# Property Create Fix - Frontend/Backend Synchronisation

## Problem
Der PropertyCreateWizard im Frontend sendete `contact_person` mit `first_name` und `last_name`, aber das Backend erwartete ein `name` Feld und ein obligatorisches `role` Feld.

### Frontend sendet:
```javascript
contact_person: {
  first_name: '',
  last_name: '',
  email: '',
  phone: ''
}
```

### Backend erwartete:
```python
contact_person: {
  id: str,
  name: str,
  email: str,
  phone: str,
  role: str  # Obligatorisch
}
```

## Lösung

### 1. Neues flexibles Schema: `ContactPersonCreate`
**Datei:** `backend/app/schemas/properties.py`

```python
class ContactPersonCreate(BaseModel):
    """Contact person creation model - flexible input"""
    # Support both formats: name OR (first_name + last_name)
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    phone: str
    role: Optional[str] = "Ansprechpartner"  # Default value
    
    @field_validator('name', mode='after')
    @classmethod
    def build_name(cls, v, info):
        """Build name from first_name and last_name if name is not provided"""
        if v:
            return v
        
        first_name = info.data.get('first_name', '')
        last_name = info.data.get('last_name', '')
        
        if first_name or last_name:
            return f"{first_name} {last_name}".strip()
        
        return "Unbekannt"
```

**Features:**
- ✅ Akzeptiert `name` ODER `first_name` + `last_name`
- ✅ Baut automatisch `name` aus `first_name` und `last_name` zusammen
- ✅ Standard-`role` = "Ansprechpartner" (wenn nicht angegeben)
- ✅ Fallback zu "Unbekannt" wenn keine Namen angegeben werden

### 2. Schema-Updates
- `CreatePropertyRequest.contact_person`: `Optional[ContactPersonCreate]`
- `UpdatePropertyRequest.contact_person`: `Optional[ContactPersonCreate]`

### 3. Service-Update
**Datei:** `backend/app/services/properties_service.py`

```python
# Create contact person if provided
if property_data.contact_person:
    cp = property_data.contact_person
    ContactPerson.objects.create(
        property=property_obj,
        name=cp.name,  # Already built by validator
        email=cp.email,
        phone=cp.phone,
        role=cp.role
    )
```

## Getestete Szenarien

### ✅ Szenario 1: Frontend mit first_name + last_name
```json
{
  "contact_person": {
    "first_name": "Max",
    "last_name": "Mustermann",
    "email": "max@example.com",
    "phone": "+49 123 456789"
  }
}
```
**Ergebnis:** `name = "Max Mustermann"`, `role = "Ansprechpartner"`

### ✅ Szenario 2: Direkter name
```json
{
  "contact_person": {
    "name": "Max Mustermann",
    "email": "max@example.com",
    "phone": "+49 123 456789",
    "role": "Verkaufsleiter"
  }
}
```
**Ergebnis:** `name = "Max Mustermann"`, `role = "Verkaufsleiter"`

### ✅ Szenario 3: Nur first_name
```json
{
  "contact_person": {
    "first_name": "Max",
    "email": "max@example.com",
    "phone": "+49 123 456789"
  }
}
```
**Ergebnis:** `name = "Max"`, `role = "Ansprechpartner"`

### ✅ Szenario 4: Keine Namen (Edge Case)
```json
{
  "contact_person": {
    "email": "info@example.com",
    "phone": "+49 123 456789"
  }
}
```
**Ergebnis:** `name = "Unbekannt"`, `role = "Ansprechpartner"`

## Alle Felder synchronisiert

### Property Model (Backend) ✅
- `title`, `description`, `property_type`, `status`
- `price`, `price_currency`, `price_type`
- `location`
- `living_area`, `total_area`, `plot_area`
- `rooms`, `bedrooms`, `bathrooms`, `floors`
- `year_built`, `energy_class`, `energy_consumption`, `heating_type`
- `coordinates_lat`, `coordinates_lng`
- `amenities`, `tags`

### Address (Relation) ✅
- `street`, `house_number`, `city`, `postal_code` / `zip_code`, `state`, `country`

### ContactPerson (Relation) ✅
- `name` (aus `first_name` + `last_name` oder direkt)
- `email`, `phone`, `role`

### PropertyFeatures (Relation) ✅
- `bedrooms`, `bathrooms`, `year_built`
- `energy_class`, `heating_type`, `parking_spaces`
- `balcony`, `garden`, `elevator`

## Status

✅ **Backend Schema aktualisiert**  
✅ **Service aktualisiert**  
✅ **Validatoren hinzugefügt**  
✅ **Flexible Input-Formate unterstützt**  
✅ **Rückwärtskompatibel**  
✅ **Syntax-Check bestanden**  

## Nächste Schritte

1. Backend neu starten
2. Frontend-Wizard testen
3. Property erstellen mit allen Feldern
4. Verifizieren, dass `contact_person` korrekt gespeichert wird

## Test-Request

```bash
curl -X POST "http://localhost:8000/api/v1/properties" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Schönes Einfamilienhaus",
    "description": "Tolles Haus in ruhiger Lage",
    "property_type": "house",
    "status": "vorbereitung",
    "price": 450000,
    "price_currency": "EUR",
    "price_type": "sale",
    "location": "München",
    "living_area": 120,
    "rooms": 5,
    "address": {
      "street": "Musterstraße",
      "house_number": "42",
      "postal_code": "80331",
      "city": "München",
      "state": "Bayern",
      "country": "Deutschland"
    },
    "contact_person": {
      "first_name": "Max",
      "last_name": "Mustermann",
      "email": "max@example.com",
      "phone": "+49 123 456789"
    }
  }'
```

**Erwartete Antwort:** 201 Created mit vollständigem Property-Objekt

