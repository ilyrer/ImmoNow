"""
Django Admin für Legacy App
Alle Modelle wurden in ihre jeweiligen Apps migriert.
Diese Datei wird für Backward Compatibility beibehalten, registriert aber keine Modelle mehr.
Alle Admin-Registrierungen befinden sich jetzt in den App-spezifischen admin.py Dateien:
- accounts/admin.py: User, Tenant, TenantUser, UserProfile, Permission, Role, FeatureFlag
- properties/admin.py: Property, Address, ContactPerson, etc.
- contacts/admin.py: Contact
- documents/admin.py: Document, DocumentFolder, etc.
- tasks/admin.py: Task, Project, Board, etc.
- etc.
"""
from django.contrib import admin

# Alle Modelle wurden in ihre jeweiligen Apps migriert
# Keine Admin-Registrierungen mehr hier - siehe accounts/admin.py, properties/admin.py, etc.
