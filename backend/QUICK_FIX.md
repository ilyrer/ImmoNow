# Quick Fix für "table already exists" Fehler

## ⚠️ WICHTIG: Reihenfolge beachten!

Du musst die Migrationen **ZUERST als fake markieren**, bevor du `python manage.py migrate` ausführst!

## ✅ Korrekte Schritte:

### Schritt 1: Migrationen als fake markieren

```bash
cd backend

# Option A: Script verwenden (EMPFOHLEN)
./fix_migrations.sh

# Option B: Manuell (wenn Script nicht funktioniert)
python manage.py migrate accounts 0001_initial --fake
python manage.py migrate common 0001_initial --fake
python manage.py migrate properties 0001_initial --fake
python manage.py migrate contacts 0001_initial --fake
python manage.py migrate documents 0001_initial --fake
python manage.py migrate tasks 0001_initial --fake
python manage.py migrate appointments 0001_initial --fake
python manage.py migrate communications 0001_initial --fake
python manage.py migrate investor 0001_initial --fake
python manage.py migrate notifications 0001_initial --fake
python manage.py migrate billing 0001_initial --fake
python manage.py migrate automation 0001_initial --fake
python manage.py migrate workflow 0001_initial --fake
python manage.py migrate sla 0001_initial --fake
python manage.py migrate locations 0001_initial --fake
python manage.py migrate custom_fields 0001_initial --fake
```

### Schritt 2: Dann normale Migration ausführen

```bash
python manage.py migrate
```

## 🎯 Einfachste Lösung (Alle Befehle auf einmal):

Führe diese Befehle nacheinander aus:

```bash
cd backend

# Alle Migrationen als fake markieren
python manage.py migrate accounts 0001_initial --fake && \
python manage.py migrate common 0001_initial --fake && \
python manage.py migrate properties 0001_initial --fake && \
python manage.py migrate contacts 0001_initial --fake && \
python manage.py migrate documents 0001_initial --fake && \
python manage.py migrate tasks 0001_initial --fake && \
python manage.py migrate appointments 0001_initial --fake && \
python manage.py migrate communications 0001_initial --fake && \
python manage.py migrate investor 0001_initial --fake && \
python manage.py migrate notifications 0001_initial --fake && \
python manage.py migrate billing 0001_initial --fake && \
python manage.py migrate automation 0001_initial --fake && \
python manage.py migrate workflow 0001_initial --fake && \
python manage.py migrate sla 0001_initial --fake && \
python manage.py migrate locations 0001_initial --fake && \
python manage.py migrate custom_fields 0001_initial --fake

# Dann normale Migration
python manage.py migrate
```

## ❌ Was NICHT funktioniert:

```bash
# FALSCH: Direkt migrate ausführen
python manage.py migrate  # ❌ Fehler: table already exists

# RICHTIG: Erst fake, dann migrate
python manage.py migrate accounts 0001_initial --fake  # ✅
python manage.py migrate  # ✅ Jetzt funktioniert es
```
