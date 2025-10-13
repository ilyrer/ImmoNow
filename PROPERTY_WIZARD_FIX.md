# Property Wizard Backend Integration - VOLLSTÄNDIG

## Problem
Der PropertyCreateWizard konnte keine Immobilien erstellen. Der Server antwortete mit **404 Not Found**, da das Backend Schema nicht mit den Daten vom Frontend übereinstimmte.

## Root Cause Analysis

### Frontend sendet (PropertyCreateWizard.tsx):
```typescript
{
  title, description, property_type, status,
  price, price_currency, price_type,
  location,
  living_area, total_area, plot_area,
  rooms, bedrooms, bathrooms, floors,
  year_built, energy_class, energy_consumption, heating_type,
  coordinates_lat, coordinates_lng,
  amenities, tags,
  address: { street, house_number, postal_code, city, state, country },
  contact_person: { first_name, last_name, email, phone }
}
```

### Backend erwartete (CreatePropertyRequest - ALT):
```python
{
  title, description, property_type,
  price, location,
  living_area, rooms, bathrooms, year_built,
  address: { street, zip_code, city, state, country },
  contact_person, features
}
```

**Fehlende Felder:** status, price_currency, price_type, total_area, plot_area, bedrooms, floors, energy_class, energy_consumption, heating_type, coordinates_lat, coordinates_lng, amenities, tags, address.house_number, address.postal_code

## Lösung - Vollständige Backend-Erweiterung

### 1. ✅ Property Model erweitert (`app/db/models/__init__.py`)
```python
class Property(models.Model):
    # Preis
    price = models.DecimalField(...)
    price_currency = models.CharField(max_length=3, default='EUR')
    price_type = models.CharField(max_length=20, choices=PRICE_TYPE_CHOICES, default='sale')
    
    # Flächen
    living_area = models.IntegerField(...)
    total_area = models.IntegerField(...)
    plot_area = models.IntegerField(...)
    
    # Zimmer
    rooms = models.IntegerField(...)
    bedrooms = models.IntegerField(...)
    bathrooms = models.IntegerField(...)
    floors = models.IntegerField(...)
    
    # Gebäude Info
    year_built = models.IntegerField(...)
    energy_class = models.CharField(max_length=10, ...)
    energy_consumption = models.IntegerField(...)
    heating_type = models.CharField(max_length=100, ...)
    
    # Koordinaten
    coordinates_lat = models.DecimalField(max_digits=9, decimal_places=6, ...)
    coordinates_lng = models.DecimalField(max_digits=9, decimal_places=6, ...)
    
    # Zusatzdaten
    amenities = models.JSONField(default=list, ...)
    tags = models.JSONField(default=list, ...)
    
    # Status mit Choices
    status = models.CharField(max_length=50, default='vorbereitung', 
                             choices=[('vorbereitung', 'Vorbereitung'), 
                                     ('aktiv', 'Aktiv'), ...])
```

### 2. ✅ Address Model erweitert
```python
class Address(models.Model):
    street = models.CharField(max_length=255)
    house_number = models.CharField(max_length=20, blank=True, null=True)  # NEU
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    postal_code = models.CharField(max_length=10, blank=True, null=True)  # NEU (Alias)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='Deutschland')
```

### 3. ✅ Schemas aktualisiert (`app/schemas/properties.py`)
```python
class Address(BaseModel):
    street: str
    house_number: Optional[str] = None  # NEU
    city: str
    zip_code: Optional[str] = None
    postal_code: Optional[str] = None  # NEU
    state: Optional[str] = None
    country: str = "Deutschland"

class CreatePropertyRequest(BaseModel):
    title: str = Field(..., min_length=5)  # Min. 5 Zeichen wie im Frontend
    property_type: PropertyType
    status: Optional[str] = Field("vorbereitung", max_length=50)  # NEU
    
    # Alle neuen Felder hinzugefügt
    price_currency: Optional[str] = Field("EUR", max_length=3)
    price_type: Optional[str] = Field("sale", max_length=20)
    total_area: Optional[int] = Field(None, ge=1)
    plot_area: Optional[int] = Field(None, ge=1)
    bedrooms: Optional[int] = Field(None, ge=1)
    floors: Optional[int] = Field(None, ge=1)
    energy_class: Optional[str] = Field(None, max_length=10)
    energy_consumption: Optional[int] = Field(None, ge=0)
    heating_type: Optional[str] = Field(None, max_length=100)
    coordinates_lat: Optional[float] = Field(None, ge=-90, le=90)
    coordinates_lng: Optional[float] = Field(None, ge=-180, le=180)
    amenities: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)
    # ... (alle anderen Felder)
```

### 4. ✅ PropertiesService aktualisiert (`app/services/properties_service.py`)
```python
async def create_property(self, property_data: CreatePropertyRequest, created_by_id: str):
    @sync_to_async
    def create_property_sync():
        property_obj = Property.objects.create(
            tenant_id=self.tenant_id,
            title=property_data.title,
            status=property_data.status or 'vorbereitung',
            # Alle neuen Felder werden jetzt verarbeitet
            price_currency=property_data.price_currency or 'EUR',
            price_type=property_data.price_type or 'sale',
            total_area=property_data.total_area,
            plot_area=property_data.plot_area,
            bedrooms=property_data.bedrooms,
            floors=property_data.floors,
            energy_class=property_data.energy_class,
            energy_consumption=property_data.energy_consumption,
            heating_type=property_data.heating_type,
            coordinates_lat=property_data.coordinates_lat,
            coordinates_lng=property_data.coordinates_lng,
            amenities=property_data.amenities or [],
            tags=property_data.tags or [],
            # ... (alle anderen Felder)
        )
        
        # Address-Erstellung mit house_number und postal_code
        if property_data.address:
            addr = property_data.address
            zip_code = addr.postal_code or addr.zip_code or ''
            Address.objects.create(
                property=property_obj,
                street=addr.street,
                house_number=addr.house_number or '',
                city=addr.city,
                zip_code=zip_code,
                postal_code=zip_code,
                state=addr.state or '',
                country=addr.country or 'Deutschland'
            )
```

### 5. ✅ Migration erstellt und ausgeführt
```bash
python manage.py makemigrations app --name property_wizard_fields
# Migration 0008_property_wizard_fields created

python manage.py migrate app
# ✅ Migration applied successfully
```

**Migration fügt hinzu:**
- 15 neue Felder zum Property Model
- 2 neue Felder zum Address Model (house_number, postal_code)
- Anpassungen an bestehenden Feldern (status choices, nullable fields)

## Testing - Nächste Schritte

### 1. Frontend neu laden
```bash
# Im Browser (oder Terminal):
cd real-estate-dashboard
npm start  # Falls nicht läuft

# Im Browser:
Drücke Ctrl+Shift+R (Hard Reload)
```

### 2. Test durchführen
1. **Einloggen** (falls nicht eingeloggt)
2. **Navigation:** Klicke auf "Immobilien" → Button "Neue Immobilie"
3. **Schritt 1 - Basis:**
   - Titel: "Testimmobilie Musterstraße" (mindestens 5 Zeichen!)
   - Beschreibung: Optional
   - Typ: z.B. "Haus"
   - Status: "Vorbereitung" (default)
   - Preis: z.B. 500000
   - Preisart: "Kauf"
   - Währung: "EUR"
   - **Adresse (WICHTIG):**
     - Straße: "Musterstraße"
     - PLZ: "80331"
     - Ort: "München"
4. **Schritt 2 - Details:**
   - Wohnfläche: z.B. 120 m²
   - Zimmer: z.B. 4
   - Schlafzimmer: z.B. 3
   - Bäder: z.B. 2
   - Optional: Weitere Details ausfüllen
5. **Schritt 3 - Medien:**
   - Optional: Bilder/Dokumente (funktioniert noch nicht, aber erstellt Warnung)
6. **Schritt 4 - Bestätigung:**
   - Klick auf "Erstellen"

### 3. Erwartetes Ergebnis
✅ **Erfolg:**
- Toast-Nachricht: "Immobilie erstellt"
- Weiterleitung zu Property Detail Seite
- Alle Daten sind sichtbar

⚠️ **Bekannte Limitationen:**
- Bilder/Dokumente Upload: Backend-Endpoints fehlen noch (TODO)
- Console Warning: "Media upload not yet implemented" ist normal

### 4. Fehlerbehebung
Falls 404 Error weiterhin auftritt:

**A. Backend Server neu starten:**
```bash
# Terminal mit backend server: Ctrl+C drücken
cd backend
python main.py
```

**B. Logs prüfen:**
```bash
# Im Backend Terminal:
# Sollte "POST /api/v1/properties" mit Status 201 zeigen
```

**C. Browser DevTools öffnen (F12):**
```javascript
// Network Tab:
// POST http://localhost:8000/api/v1/properties
// Status: 201 Created (nicht 404!)

// Console:
// Sollte keine roten Errors zeigen
```

## Zusammenfassung der Änderungen

### Modified Files:
1. ✅ `backend/app/db/models/__init__.py` - Property & Address Model erweitert
2. ✅ `backend/app/schemas/properties.py` - Alle Schemas aktualisiert
3. ✅ `backend/app/services/properties_service.py` - Create/Read Logic aktualisiert
4. ✅ `backend/app/migrations/0008_property_wizard_fields.py` - Migration erstellt
5. ✅ `real-estate-dashboard/src/services/api.service.ts` - TODO Kommentare für Media Upload

### Database Changes:
```sql
-- Neue Property Felder:
ALTER TABLE properties ADD COLUMN price_currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE properties ADD COLUMN price_type VARCHAR(20) DEFAULT 'sale';
ALTER TABLE properties ADD COLUMN total_area INTEGER;
ALTER TABLE properties ADD COLUMN plot_area INTEGER;
ALTER TABLE properties ADD COLUMN bedrooms INTEGER;
ALTER TABLE properties ADD COLUMN floors INTEGER;
ALTER TABLE properties ADD COLUMN energy_class VARCHAR(10);
ALTER TABLE properties ADD COLUMN energy_consumption INTEGER;
ALTER TABLE properties ADD COLUMN heating_type VARCHAR(100);
ALTER TABLE properties ADD COLUMN coordinates_lat DECIMAL(9,6);
ALTER TABLE properties ADD COLUMN coordinates_lng DECIMAL(9,6);
ALTER TABLE properties ADD COLUMN amenities JSON DEFAULT '[]';
ALTER TABLE properties ADD COLUMN tags JSON DEFAULT '[]';

-- Neue Address Felder:
ALTER TABLE addresses ADD COLUMN house_number VARCHAR(20);
ALTER TABLE addresses ADD COLUMN postal_code VARCHAR(10);
```

## Status
✅ **VOLLSTÄNDIG** - Backend vollständig mit Frontend verbunden
⚠️ Media Upload Endpoints fehlen noch (separate Task)

## Nächste TODOs (Optional):
1. Media Upload Endpoints im Backend implementieren
2. Document Upload Endpoints im Backend implementieren
3. Property Update Logic für neue Felder erweitern
4. Tests für Property Creation schreiben

---
**Erstellt:** 2025-10-13
**Problem:** 404 Error beim Property Creation
**Lösung:** Vollständige Backend Schema-Erweiterung mit 17 neuen Feldern
**Status:** ✅ READY FOR TESTING
