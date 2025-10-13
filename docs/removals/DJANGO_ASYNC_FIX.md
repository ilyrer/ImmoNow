# 🔧 Django Async Fix - ContactsService

## Problem
```python
django.core.exceptions.SynchronousOnlyOperation: 
You cannot call this from an async context - use a thread or sync_to_async.
```

---

## ✅ Lösung - sync_to_async hinzugefügt

### Gefixt: `backend/app/services/contacts_service.py`

**Vorher (❌ Fehlerhaft):**
```python
async def get_contacts(self, ...):
    queryset = Contact.objects.filter(tenant_id=self.tenant_id)  # ❌ Sync call in async
    # ...
    total = queryset.count()  # ❌ Sync call in async
    contacts = list(queryset[offset:offset + limit])  # ❌ Sync call in async
```

**Nachher (✅ Korrekt):**
```python
async def get_contacts(self, ...):
    @sync_to_async
    def get_contacts_sync():
        queryset = Contact.objects.filter(tenant_id=self.tenant_id)  # ✅ In sync wrapper
        # ...
        total = queryset.count()  # ✅ In sync wrapper
        contacts = list(queryset[offset:offset + limit])  # ✅ In sync wrapper
        return contacts, total
    
    contacts, total = await get_contacts_sync()
```

---

## 🔧 Alle gefixten Methoden:

### 1. `get_contacts()` ✅
```python
@sync_to_async
def get_contacts_sync():
    # Django ORM operations here
    return contacts, total
```

### 2. `get_contact()` ✅
```python
@sync_to_async
def get_contact_sync():
    try:
        return Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
    except Contact.DoesNotExist:
        return None
```

### 3. `create_contact()` ✅
```python
@sync_to_async
def create_contact_sync():
    return Contact.objects.create(...)
```

### 4. `update_contact()` ✅
```python
@sync_to_async
def update_contact_sync():
    contact = Contact.objects.get(...)
    # Update fields
    contact.save()
    return contact
```

### 5. `delete_contact()` ✅
```python
@sync_to_async
def delete_contact_sync():
    contact = Contact.objects.get(...)
    contact.delete()
```

---

## 📋 Pattern für alle Services

### Regel: **Jede Django ORM-Operation muss in `@sync_to_async` gewrappt sein**

```python
from asgiref.sync import sync_to_async

async def my_async_method(self, ...):
    @sync_to_async
    def sync_operation():
        # ✅ Alle Django ORM-Calls hier
        result = MyModel.objects.filter(...)
        return result
    
    result = await sync_operation()
    return result
```

---

## 🚀 Wie testen?

### 1. Backend neu starten
```bash
cd C:\Users\albian\Documents\ImmoNow\backend
python main.py
```

### 2. Contacts-Endpunkt testen
```bash
# Liste abrufen
curl http://localhost:8000/contacts?page=1&size=20

# Einzelnen Contact
curl http://localhost:8000/contacts/{id}
```

### 3. Frontend testen
1. Öffne: `http://localhost:3000/contacts`
2. **Erwartung:** Keine Django Async-Fehler mehr
3. **Erwartung:** Kontakte werden geladen

---

## 🐛 Andere Services prüfen

### Diese Services müssen auch gefixt werden:

#### ✅ PropertiesService
- Bereits gefixt (verwendet `sync_to_async`)

#### ✅ ContactsService
- **JETZT GEFIXT** ✅

#### ⚠️ Andere Services (falls vorhanden):
```bash
# Suche nach Services ohne sync_to_async
grep -r "async def" backend/app/services/*.py
grep -r "objects.filter" backend/app/services/*.py
```

Falls ein Service `async def` hat und `objects.filter/get/create` verwendet, muss er gefixt werden!

---

## 📚 Warum ist das nötig?

### Problem:
- **FastAPI** ist async (verwendet `asyncio`)
- **Django ORM** ist sync (verwendet synchrone DB-Treiber)
- Wenn du Django ORM direkt in async Context aufrufst → **SynchronousOnlyOperation Error**

### Lösung:
- `@sync_to_async` führt Django ORM in einem separaten Thread aus
- FastAPI bleibt async
- Django ORM bleibt sync
- Beide funktionieren zusammen!

---

## 🎯 Checkliste

- [x] ContactsService `get_contacts()` gefixt ✅
- [x] ContactsService `get_contact()` gefixt ✅
- [x] ContactsService `create_contact()` gefixt ✅
- [x] ContactsService `update_contact()` gefixt ✅
- [x] ContactsService `delete_contact()` gefixt ✅
- [x] Import `sync_to_async` hinzugefügt ✅

---

## ✅ Fertig!

**ContactsService ist jetzt async-safe!**

Starte das Backend neu und teste die Contacts-Seite! 🚀
