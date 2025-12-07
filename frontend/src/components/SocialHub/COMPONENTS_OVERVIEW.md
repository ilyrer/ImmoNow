# Vorhandene UI-Komponenten - Übersicht

Diese Dokumentation listet die bestehenden, wiederverwendbaren UI-Komponenten auf, die im SocialHub-Modul verwendet wurden.

## 1. Cards & Container

### Card-Komponente (`src/components/common/Card.tsx`)

Die grundlegende Card-Komponente für strukturierte Inhaltsdarstellung:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';

<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Inhalt */}
  </CardContent>
</Card>
```

**Features:**
- Dark Mode Support
- Rounded Borders
- Shadow Effects
- Flexible Padding-System

**Verwendung im SocialHub:**
- Alle Dashboard-Kacheln
- Statistik-Übersichten
- Content-Container

## 2. Modale Dialoge

### DocumentDetailModal (`src/components/documents/DocumentDetailModal.tsx`)

Vollständig ausgestatteter Modal-Dialog mit:
- Header mit Close-Button
- Tab-Navigation
- Formular-Felder
- Action-Buttons
- Responsive Design

**Pattern für SocialHub adaptierbar:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
    {/* Modal-Inhalt */}
  </div>
</div>
```

**Verwendbar für:**
- Account-Details
- Post-Vorschau
- Erweiterte Einstellungen

## 3. Upload-Komponenten

### DocumentUploadModal (`src/components/documents/DocumentUploadModal.tsx`)

Umfangreiche Upload-Lösung mit:
- Drag & Drop Zone
- File Preview
- Progress Tracking
- Multi-File Support
- Metadata-Eingabe

**Features:**
```tsx
- Border-Dashed Upload-Zone
- Drag-Events (onDragEnter, onDragOver, onDrop)
- Progress-Bar für Uploads
- File-Type Validation
- Thumbnail-Generierung
```

**Verwendung im SocialHub:**
- Medien-Upload im Composer
- Media Library Upload
- Bulk-Upload-Funktion

## 4. Tabellen

### DocumentListView (`src/components/documents/DocumentListView.tsx`)

Vollständige Tabellen-Implementierung mit:
- Sortierung
- Filterung
- Checkboxen für Selektion
- Row-Actions
- Responsive Design

**Table-Pattern:**
```tsx
<table className="w-full">
  <thead className="bg-gray-50 dark:bg-gray-900/50">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium">Header</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-4">Content</td>
    </tr>
  </tbody>
</table>
```

**Verwendbar für:**
- Post-Liste im Scheduler
- Queue-Übersicht
- Analytics-Tabellen

## 5. Button-Komponente

### Button (`src/components/common/Button.tsx`)

Wiederverwendbare Button-Komponente mit Varianten:

**Verwendete Button-Styles im SocialHub:**

```tsx
// Primary Button
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
  
// Secondary Button
<button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200">

// Danger Button
<button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200">

// Icon Button
<button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
  <i className="ri-icon-line"></i>
</button>
```

## 6. Badges & Status-Indikatoren

### Verwendete Badge-Patterns

```tsx
// Status Badge
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
  Aktiv
</span>

// Platform Badge
<span className="px-2 py-1 rounded text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30">
  <i className="ri-facebook-fill mr-1"></i>
  Facebook
</span>
```

**Farb-Schema:**
- Blau: Informativ, Primary
- Grün: Erfolgreich, Aktiv
- Rot: Fehler, Warnung
- Gelb/Orange: Warnung, Medium Priority
- Grau: Inaktiv, Neutral
- Lila: Processing, Verarbeitung

## 7. Input-Felder

### Text-Input
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
/>
```

### Textarea
```tsx
<textarea
  rows={8}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
/>
```

### Select
```tsx
<select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
  <option value="">Auswählen</option>
</select>
```

### Checkbox
```tsx
<input
  type="checkbox"
  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
/>
```

### Toggle Switch
```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" className="sr-only peer" />
  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
</label>
```

## 8. Progress-Indikatoren

### Progress Bar
```tsx
<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
  <div
    className="bg-blue-600 h-2 rounded-full transition-all"
    style={{ width: `${progress}%` }}
  ></div>
</div>
```

### Loading Spinner
```tsx
<i className="ri-loader-4-line text-xl animate-spin"></i>
```

## 9. Icon-System

### Remix Icons
Das Projekt verwendet Remix Icons (`ri-*`):

**Häufig verwendete Icons:**
- `ri-add-line` - Hinzufügen
- `ri-edit-line` - Bearbeiten
- `ri-delete-bin-line` - Löschen
- `ri-eye-line` - Ansehen
- `ri-download-line` - Herunterladen
- `ri-upload-line` - Hochladen
- `ri-close-line` - Schließen
- `ri-check-line` - Bestätigen
- `ri-error-warning-line` - Fehler
- `ri-time-line` - Zeit/Uhr
- `ri-calendar-line` - Kalender
- `ri-heart-line` - Like
- `ri-share-forward-line` - Teilen
- `ri-chat-3-line` - Kommentar

## 10. Layout-Patterns

### Grid-Layout
```tsx
// 2 Spalten
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// 3 Spalten
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 4 Spalten
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Flex-Layout
```tsx
// Horizontal mit Space Between
<div className="flex items-center justify-between">

// Vertical Stack
<div className="flex flex-col space-y-4">

// Horizontal Stack
<div className="flex items-center space-x-4">
```

### Container-Padding
```tsx
// Standard-Container
<div className="p-6">

// Card-Content
<div className="px-6 py-4">

// Tight Padding
<div className="p-4">
```

## 11. Hover-Effekte

```tsx
// Card Hover
hover:shadow-lg transition-shadow

// Button Hover
hover:bg-blue-700 transition-colors

// Scale on Hover
hover:scale-105 transition-all

// Opacity on Hover
group-hover:opacity-100 transition-opacity
```

## 12. Dark Mode

Alle Komponenten unterstützen Dark Mode durch `dark:`-Varianten:

```tsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

## Zusammenfassung

**Genutzte Komponenten im SocialHub:**

✅ Card, CardHeader, CardTitle, CardContent  
✅ Modal-Dialoge (Pattern von DocumentDetailModal)  
✅ Upload-Zone (Pattern von DocumentUploadModal)  
✅ Tabellen (Pattern von DocumentListView)  
✅ Buttons (verschiedene Varianten)  
✅ Input-Felder (Text, Textarea, Select, Checkbox, Toggle)  
✅ Badges & Status-Indikatoren  
✅ Progress-Bars  
✅ Icons (Remix Icons)  
✅ Grid & Flex Layouts  
✅ Dark Mode Support  

**Keine Integration erforderlich für:**
- Navigation (wie gewünscht nicht geändert)
- Router-Links (können später hinzugefügt werden)
- Globaler State (lokaler State ausreichend)

---

**Stand:** Oktober 2024
