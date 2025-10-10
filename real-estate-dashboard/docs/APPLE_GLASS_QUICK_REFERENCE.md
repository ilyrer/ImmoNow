# Apple Glass Design - Quick Reference

## Farben

### Akzentfarben (verwende diese statt generischen Farben)
```jsx
className="text-apple-blue"        // #0A84FF - Primär
className="text-apple-green"       // #32D74B - Erfolg
className="text-apple-red"         // #FF453A - Fehler
className="text-apple-orange"      // #FF9F0A - Warnung
className="text-apple-purple"      // #BF5AF2 - Sekundär
```

### Text-Farben (Dark Mode)
```jsx
className="text-dark-text-primary"     // #FFFFFF - Überschriften
className="text-dark-text-secondary"   // #D1D1D6 - Body
className="text-dark-text-tertiary"    // #8E8E93 - Labels
```

## Glassmorphism

### Karten/Module
```jsx
className="bg-glass-dark backdrop-blur-4xl border-glass-dark-border shadow-apple-soft"
```

### Hover-Effekte
```jsx
className="hover:bg-glass-dark-hover hover:scale-102 hover:shadow-apple-card transition-all duration-200"
```

## Buttons

### Primär (Apple Blue)
```jsx
<button className="bg-apple-blue hover:bg-apple-blue/80 text-white px-4 py-2 rounded-xl shadow-apple-blue-glow hover:scale-102 transition-all duration-200">
  Action
</button>
```

### Sekundär (Glas-Stil)
```jsx
<button className="bg-glass-dark backdrop-blur-xl border-glass-dark-border text-dark-text-primary hover:bg-glass-dark-hover hover:scale-102 px-4 py-2 rounded-xl transition-all duration-200">
  Cancel
</button>
```

## Schatten

```jsx
shadow-apple-soft          // 0 8px 30px rgba(0,0,0,0.6)
shadow-apple-card          // 0 12px 40px rgba(0,0,0,0.5)
shadow-apple-elevated      // 0 20px 50px rgba(0,0,0,0.7)
shadow-apple-blue-glow     // Subtiler blauer Glow
shadow-apple-green-glow    // Subtiler grüner Glow
shadow-apple-purple-glow   // Subtiler lila Glow
```

## Borders

```jsx
border-glass-dark-border   // rgba(255,255,255,0.1) - feiner Rahmen
```

## Backdrop Blur

```jsx
backdrop-blur-3xl          // 64px
backdrop-blur-4xl          // 80px - Standard für Apple Glass
```

## Häufige Patterns

### Card
```jsx
<div className="bg-glass-dark backdrop-blur-4xl border-glass-dark-border shadow-apple-soft rounded-xl p-6 hover:scale-102 hover:shadow-apple-card transition-all duration-200">
  <h3 className="text-dark-text-primary font-semibold mb-2">Titel</h3>
  <p className="text-dark-text-secondary">Beschreibung</p>
</div>
```

### Sidebar Item (Aktiv)
```jsx
<button className="bg-glass-blue text-dark-text-primary shadow-apple-soft border border-apple-blue/40 scale-102 px-3 py-2 rounded-xl">
  Aktiv
</button>
```

### Sidebar Item (Hover)
```jsx
<button className="hover:bg-glass-dark-hover hover:text-dark-text-primary hover:scale-102 px-3 py-2 rounded-xl transition-all duration-200">
  Normal
</button>
```

### Badge
```jsx
<span className="bg-apple-red text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-apple-soft">
  5
</span>
```

### Input Field
```jsx
<input 
  className="bg-glass-dark backdrop-blur-xl border-glass-dark-border text-dark-text-primary placeholder-dark-text-tertiary px-4 py-2 rounded-xl focus:ring-2 focus:ring-apple-blue/50 focus:outline-none transition-all duration-200" 
  placeholder="Suchen..."
/>
```

## Best Practices

### ✅ DO
- Verwende `backdrop-blur-4xl` für Glas-Effekte
- Nutze `hover:scale-102` für subtile Hover-Effekte
- Setze `transition-all duration-200` für sanfte Animationen
- Verwende Apple-Farben (`apple-blue`, `apple-green`, etc.)
- Nutze die Text-Hierarchie (`dark-text-primary/secondary/tertiary`)

### ❌ DON'T
- Vermeide grelle Neon-Farben
- Keine zu großen `scale` Werte (max 1.02)
- Keine langen Animationen (max 300ms)
- Kein `backdrop-blur` unter 30px im Dark Mode
- Keine generischen Farben wie `blue-500` oder `gray-700`

## Debugging

### Dark Mode aktivieren/deaktivieren
```javascript
// Aktivieren
document.documentElement.classList.add('dark');
localStorage.setItem('darkMode', 'true');

// Deaktivieren
document.documentElement.classList.remove('dark');
localStorage.setItem('darkMode', 'false');
```

### Backdrop Filter Test
Falls `backdrop-filter` nicht funktioniert:
```css
-webkit-backdrop-filter: blur(30px);
backdrop-filter: blur(30px);
```

## Checkliste für neue Komponenten

- [ ] Glassmorphism-Hintergrund (`bg-glass-dark backdrop-blur-4xl`)
- [ ] Feiner Border (`border-glass-dark-border`)
- [ ] Apple Shadow (`shadow-apple-soft` oder `shadow-apple-card`)
- [ ] Text-Farben-Hierarchie (`dark-text-primary/secondary/tertiary`)
- [ ] Hover-Effekt (`hover:scale-102 hover:shadow-apple-card`)
- [ ] Subtile Animation (`transition-all duration-200`)
- [ ] Apple-Akzentfarben für wichtige Elemente
- [ ] Rounded Corners (`rounded-xl` oder `rounded-lg`)

---

**Quick Tip**: Kopiere einfach ein bestehendes Pattern und passe es an deine Bedürfnisse an!
