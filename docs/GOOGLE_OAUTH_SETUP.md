# 🔐 Google OAuth Setup Anleitung

## ❌ **Aktuelles Problem:**
```
Error: "Not a valid origin for the client: http://localhost:8000"
```

**Ursache:** Die Frontend-URL `http://localhost:3000` ist nicht in der Google Cloud Console als autorisierte Origin registriert.

---

## ✅ **Lösung: Google Cloud Console konfigurieren**

### **Schritt 1: Google Cloud Console öffnen**
1. Gehen Sie zu: https://console.cloud.google.com/apis/credentials
2. Melden Sie sich mit Ihrem Google-Konto an

### **Schritt 2: OAuth 2.0 Client ID auswählen**
1. Suchen Sie in der Liste nach Ihrer Client ID:
   ```
   569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com
   ```
2. Klicken Sie auf den Namen, um die Einstellungen zu öffnen

### **Schritt 3: Autorisierte JavaScript-Ursprünge hinzufügen**
1. Scrollen Sie zu **"Autorisierte JavaScript-Ursprünge"**
2. Klicken Sie auf **"URI hinzufügen"**
3. Fügen Sie folgende URLs hinzu:
   - `http://localhost:3000` (für Frontend-Entwicklung)
   - `http://localhost:8000` (optional, für Backend-Tests)
   - `http://127.0.0.1:3000` (alternative Localhost-Adresse)

### **Schritt 4: Autorisierte Weiterleitungs-URIs hinzufügen (optional)**
1. Scrollen Sie zu **"Autorisierte Weiterleitungs-URIs"**
2. Klicken Sie auf **"URI hinzufügen"**
3. Fügen Sie hinzu:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`

### **Schritt 5: Speichern**
1. Klicken Sie auf **"Speichern"** am Ende der Seite
2. Warten Sie 1-2 Minuten, bis die Änderungen wirksam werden

---

## 🧪 **Nach der Konfiguration testen:**

### **1. Browser-Cache leeren:**
```
1. Öffnen Sie Chrome DevTools (F12)
2. Rechtsklick auf den Reload-Button
3. Wählen Sie "Cache leeren und hart neu laden"
```

### **2. Frontend neu starten:**
```bash
cd real-estate-dashboard
npm start
```

### **3. Google Sign-In testen:**
1. Gehen Sie zu http://localhost:3000
2. Klicken Sie auf "Mit Google anmelden"
3. Wählen Sie Ihr Google-Konto aus
4. Erlauben Sie die Berechtigungen

---

## 📋 **Ihre Google OAuth Credentials:**

- **Client ID:** `569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com`
- **Client Secret:** `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`

⚠️ **Wichtig:** Der Client Secret ist NICHT der ID Token! Der ID Token wird automatisch vom Frontend generiert, wenn sich ein User anmeldet.

---

## 🔍 **Häufige Fehler und Lösungen:**

### **Fehler 1: "Not a valid origin"**
- **Lösung:** Fügen Sie `http://localhost:3000` in der Google Console hinzu

### **Fehler 2: "popup_closed_by_user"**
- **Lösung:** User hat das Popup geschlossen - normales Verhalten

### **Fehler 3: "idpiframe_initialization_failed"**
- **Lösung:** 
  - Browser-Cache leeren
  - Cookies von google.com erlauben
  - Drittanbieter-Cookies aktivieren

### **Fehler 4: 403 Forbidden**
- **Lösung:** 
  - Überprüfen Sie CORS-Einstellungen im Backend
  - Stellen Sie sicher, dass das Backend läuft

---

## 🎯 **Erwartetes Verhalten nach erfolgreicher Konfiguration:**

1. **User klickt "Mit Google anmelden"**
2. **Google Popup öffnet sich**
3. **User wählt Google-Konto aus**
4. **Frontend erhält ID Token (JWT)**
5. **Frontend sendet ID Token an Backend**
6. **Backend verifiziert Token mit Google**
7. **Backend erstellt/findet User**
8. **Backend sendet JWT Access Token zurück**
9. **User ist eingeloggt** ✅

---

## 📞 **Weitere Hilfe:**

Wenn das Problem weiterhin besteht:
1. Überprüfen Sie die Browser-Console auf Fehlermeldungen
2. Überprüfen Sie die Network-Tab in DevTools
3. Stellen Sie sicher, dass beide Server laufen:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

---

## 🔗 **Nützliche Links:**

- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
- Google Sign-In Docs: https://developers.google.com/identity/sign-in/web/sign-in

