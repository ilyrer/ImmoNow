# Pull Request

## 📝 Beschreibung

<!-- Beschreibe deine Änderungen klar und prägnant -->

## 🎯 Typ der Änderung

<!-- Markiere die zutreffende(n) Option(en) -->

- [ ] 🐛 Bug Fix (nicht-breaking change, behebt ein Issue)
- [ ] ✨ New Feature (nicht-breaking change, fügt Funktionalität hinzu)
- [ ] 💥 Breaking Change (Fix oder Feature das bestehende Funktionalität bricht)
- [ ] 📝 Documentation Update (keine Code-Änderung)
- [ ] 🎨 Style/UI Update (keine funktionalen Änderungen)
- [ ] ♻️ Code Refactoring (keine funktionalen Änderungen)
- [ ] ⚡ Performance Improvement
- [ ] 🧪 Test Update
- [ ] 🔧 Configuration/Build Update

## 🔗 Related Issues

<!-- Verlinke relevante Issues -->

Closes #
Relates to #

## 🧪 Wie wurde getestet?

<!-- Beschreibe deine Tests im Detail -->

### Backend Tests
```bash
# Kommandos die du ausgeführt hast
pytest tests/test_...
```

### Frontend Tests
```bash
# Kommandos die du ausgeführt hast
npm test ...
```

### Manuelle Tests
- [ ] Feature X getestet in Chrome
- [ ] Feature X getestet in Firefox
- [ ] Feature X getestet in Safari
- [ ] Mobile Ansicht getestet
- [ ] Dark Mode getestet

## 📸 Screenshots (wenn UI-Änderungen)

<!-- Füge Before/After Screenshots hinzu -->

### Before
<!-- Screenshot oder "N/A" -->

### After
<!-- Screenshot oder "N/A" -->

## ✅ Code Quality Checklist

### General
- [ ] Code folgt Projekt-Standards (`.cursorrules`)
- [ ] Selbst-Review durchgeführt
- [ ] Code kommentiert (komplexe Logik)
- [ ] Keine neuen Warnings/Errors
- [ ] Dokumentation aktualisiert (wenn nötig)
- [ ] CHANGELOG.md aktualisiert (wenn relevant)

### Backend (wenn relevant)
- [ ] Type Hints für alle Parameter/Returns
- [ ] Tenant Isolation geprüft (Multi-Tenant-Check)
- [ ] Error Handling mit Custom Exceptions
- [ ] Logging für wichtige Aktionen
- [ ] Input Validation (Pydantic Schemas)
- [ ] Async/Await korrekt verwendet
- [ ] Tests geschrieben (min. 80% Coverage)
- [ ] Migration erstellt (bei Model-Änderungen)
- [ ] API Docs aktualisiert (Swagger)

### Frontend (wenn relevant)
- [ ] TypeScript Strict Mode ohne Errors
- [ ] Props mit Interfaces typisiert
- [ ] React Query für Server State
- [ ] Loading States implementiert
- [ ] Error States implementiert
- [ ] Empty States implementiert
- [ ] Responsive Design (Mobile + Desktop getestet)
- [ ] Dark Mode Support
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Toast Notifications für User-Feedback

### Security (wenn relevant)
- [ ] Tenant Isolation geprüft
- [ ] Input Sanitization vorhanden
- [ ] SQL Injection unmöglich (ORM genutzt)
- [ ] XSS unmöglich (React escaping)
- [ ] Authentication/Authorization geprüft
- [ ] Keine Secrets im Code
- [ ] Rate Limiting bedacht

### Performance (wenn relevant)
- [ ] Keine N+1 Query Probleme
- [ ] Pagination bei Listen implementiert
- [ ] React.memo für teure Components
- [ ] useMemo/useCallback wo sinnvoll
- [ ] Images optimiert
- [ ] Lazy Loading wo möglich
- [ ] Caching bedacht

## 🧪 Test Coverage

<!-- Füge Test Coverage Report ein -->

**Backend Coverage**: XX%  
**Frontend Coverage**: XX%

## 📊 Performance Impact

<!-- Wenn relevant, beschreibe Performance-Impact -->

- [ ] Keine negativen Performance-Auswirkungen
- [ ] Performance-Verbesserung (Details: ...)
- [ ] Performance-Degradation (begründet: ...)

## 🚀 Deployment Notes

<!-- Spezielle Anweisungen für Deployment -->

### Pre-Deployment
```bash
# Kommandos vor Deployment (z.B. Migrations)
```

### Post-Deployment
```bash
# Kommandos nach Deployment (z.B. Cache clear)
```

### Environment Variables
<!-- Neue/geänderte ENV Variables -->

```bash
# Neue Variables die gesetzt werden müssen:
NEW_VAR=value
```

## 🤔 Questions / Discussion Points

<!-- Offene Fragen für Reviewer -->

- [ ] Frage 1: ...
- [ ] Frage 2: ...

## 📝 Additional Notes

<!-- Zusätzliche Informationen für Reviewer -->

## 🙏 Reviewer Notes

<!-- Spezielle Hinweise für Reviewer -->

**Bitte besonders achten auf:**
- [ ] Security-Aspekte
- [ ] Performance
- [ ] Code-Qualität
- [ ] Tests

**Geschätzte Review-Zeit:** XX Minuten

---

## 📋 Reviewer Checklist

<!-- Für Reviewer -->

- [ ] Code reviewed und verstanden
- [ ] Tests laufen durch
- [ ] Keine Security-Lücken erkannt
- [ ] Performance akzeptabel
- [ ] Dokumentation ausreichend
- [ ] Design/UX passend
- [ ] Keine offenen Fragen

**Reviewer Feedback:**
<!-- Feedback hier -->

---

**PR Author**: @username  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

<!-- 
Hinweis: Diese PR-Template basiert auf .cursorrules und CONTRIBUTING.md
Bitte stelle sicher, dass alle relevanten Checkboxen markiert sind.
-->

