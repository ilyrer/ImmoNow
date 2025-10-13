# Logo-Konfiguration für ImmoNow

## 1. ImmoNow Hauptlogo (Oben in der Sidebar)

Das ImmoNow-Logo wird oben in der Sidebar angezeigt und repräsentiert deine Hauptmarke.

### Logo hochladen:
1. Lege dein Logo im Ordner `real-estate-dashboard/public/logo/` ab
2. Benenne es `immonow-logo.png` (oder passe den Pfad in `GlobalSidebar.tsx` an)
3. Empfohlene Größe: **56x56 Pixel** (quadratisch)
4. Format: PNG mit transparentem Hintergrund

### Aktueller Pfad:
```
/logo/immonow-logo.png
```

---

## 2. Firmenlogo (Beim User/My Account)

Das Firmenlogo zeigt das Logo des Tenants (der Firma, bei der der User eingeloggt ist).

### Logo in der Datenbank speichern:

#### Option 1: Über Django Admin
1. Öffne Django Admin: `http://localhost:8000/admin`
2. Gehe zu **Tenants**
3. Wähle deinen Tenant aus
4. Fülle das Feld **Logo URL** mit der URL zu deinem Firmenlogo
5. Speichern

#### Option 2: Direkt in der Datenbank
```python
from app.db.models import Tenant

# Finde deinen Tenant
tenant = Tenant.objects.get(slug='deine-firma')

# Setze Logo URL
tenant.logo_url = 'https://deine-domain.de/logos/firma-logo.png'
tenant.save()
```

#### Option 3: Via API (später implementieren)
Erstelle einen Endpoint zum Hochladen von Logos:
```python
POST /api/v1/tenants/{tenant_id}/logo
```

---

## 3. Logo-Anforderungen

### Technische Specs:
- **Format**: PNG, JPG, SVG
- **Größe**: Max. 2 MB
- **Auflösung**: 
  - ImmoNow Logo: 56x56px (wird 1:1 angezeigt)
  - Firmenlogo: 44x44px (wird 1:1 angezeigt)
- **Empfehlung**: Quadratisches Format mit transparentem Hintergrund

### Design-Richtlinien:
- ✅ Klare, einfache Logos funktionieren am besten
- ✅ Hoher Kontrast für Light & Dark Mode
- ✅ Vermeide zu viele Details bei kleinen Größen
- ❌ Keine langen Texte im Logo
- ❌ Keine zu komplexen Grafiken

---

## 4. Fallback-Verhalten

Wenn kein Logo verfügbar ist:
- **ImmoNow Logo**: Zeigt "IM" in einem Gradient-Container
- **Firmenlogo**: Zeigt User-Initialen in einem Gradient-Container

---

## 5. Migration für bestehende Datenbank

Wenn du bereits eine Datenbank hast, führe diese Migration aus:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Das fügt das neue Feld `logo_url` zur Tenant-Tabelle hinzu.

---

## 6. Beispiel: Logo hochladen

### Logo per FTP/Upload hochladen:
1. Lade dein Logo auf deinen Server hoch
2. Notiere die URL: `https://deine-domain.de/uploads/logos/firma-xyz.png`
3. Speichere die URL im Tenant-Model (siehe Option 1 oder 2 oben)

### Logo von CDN verwenden:
```python
tenant.logo_url = 'https://cdn.example.com/logos/firma-logo.png'
```

---

## 7. Testen

Nach dem Setup:
1. Logge dich ein
2. Oben in der Sidebar siehst du das **ImmoNow-Logo**
3. Unter "My Account" siehst du das **Firmenlogo** deines Tenants
4. Wenn kein Logo geladen werden kann, werden automatisch Initialen angezeigt

---

## Benötigst du Hilfe?

Falls du Probleme hast oder Fragen zur Logo-Integration hast, melde dich!
