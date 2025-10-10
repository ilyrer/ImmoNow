# Manuelle Testanleitung (Frontend ↔ Backend)

Voraussetzungen
- Backend läuft lokal: http://localhost:8000 (FastAPI, Prefix /api/v1)
- Frontend: REACT_APP_API_URL in .env gesetzt (z. B. http://localhost:8000/api/v1)

Start
1) Backend starten (uvicorn). Healthcheck: GET http://localhost:8000/health
2) Frontend starten (npm start). App öffnet sich unter http://localhost:3000

Login-Flow
- Auf Login-Seite: mit existierendem User anmelden (admin/manager/agent). Request: POST /auth/login
- Erfolgreich: access_token + refresh_token im LocalStorage, User-Objekt vorhanden
- App lädt /auth/me; Dashboard wird sichtbar

Klickpfade (Smoke)
- Dashboard (/) → prüfe Widgets laden (GET /dashboard/overview)
- Immobilien (/immobilien) → Liste lädt (GET /properties)
  - Detail öffnen → (GET /properties/{id})
- Kontakte (/kontakte) → Liste lädt (GET /contacts/)
  - Detail öffnen → (GET /contacts/{id})
- Aufgaben (/aufgaben) → Listen laden (GET /tasks)
  - Task erstellen → (POST /tasks)
- Termine (/termine) → laden (GET /calendar/appointments)
  - Termin anlegen → (POST /calendar/appointments)
- Dokumente (/dokumente) → Liste laden (GET /documents)
  - Upload testen → (POST /documents/upload) mit FormData
- CIM (/cim, /measures) → Kennzahlen-Liste (GET /measures)

Fehlerbilder & Checks
- 401 → Token abgelaufen: erneutes Login; ggf. Refresh vorhanden
- 403 → Berechtigung/Rolle prüfen; User muss Rolle admin/manager/agent haben
- 422 → Body/Query-Parameter und Datentypen (ISO-Datum, Zahlen, boolean) prüfen
- Uploads → multipart/form-data, Felder exakt wie Backend erwartet

Test-IDs
- Füge data-testid Attribute pro Seite hinzu (Listencontainer, Formular, Submit-Button), um E2E-Tests zu erleichtern.

Optional E2E
- Playwright/Cypress: Smoke (Login → Dashboard → Immobilien laden → eine POST-Action)

Troubleshooting
- CORS: Backend erlaubt * in Dev; bei Cookies/withCredentials anpassen
- Trailing slash: bei Collection-Routen /contacts/ statt /contacts
- Base URL: doppelt prüfen, Debug-Logs im Netzwerk-Tab nutzen
