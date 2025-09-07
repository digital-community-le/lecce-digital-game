# Guida Sviluppo - Il Sigillo di Lecce

## 🚀 Setup Ambiente di Sviluppo

### Prerequisiti
- Node.js 18+ 
- npm o yarn
- Browser moderno con supporto Canvas HTML5

### Installazione
```bash
# Clone del progetto
git clone [repository-url]
cd il-sigillo-di-lecce

# Installazione dipendenze
npm install

# Avvio ambiente di sviluppo
npm run dev
```

### Struttura Workflow
- **Frontend**: Vite dev server su porta 5000
- **Backend**: Express.js integrato con middleware Vite
- **Hot Reload**: Automatico per modifiche frontend e backend
- **Database**: PostgreSQL (Neon) per ambiente di sviluppo

## 🛠️ Guida Modifica Componenti

### Aggiungere Nuova Sfida

#### 1. Definire la Sfida
**File**: `client/src/hooks/use-game-store.ts`
```typescript
// Aggiungere al array challenges
{
  id: 'nuova-sfida',
  title: 'Titolo Sfida',
  emoji: '🎯',
  description: 'Descrizione della sfida',
  position: { top: '70%', left: '80%' }, // Posizione sulla mappa
  status: 'locked',
  progress: 0,
  total: 1
}
```

#### 2. Creare Componente Sfida
**File**: `client/src/pages/challenges/NuovaSfida.tsx`
```typescript
import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';

const NuovaSfida: React.FC = () => {
  const { completeChallenge, setActiveView } = useGameStore();

  const handleComplete = () => {
    // Logica completamento sfida
    completeChallenge('nuova-sfida');
    setActiveView('map');
  };

  return (
    <div className="challenge-container">
      {/* UI della sfida */}
    </div>
  );
};

export default NuovaSfida;
```

#### 3. Aggiungere Route
**File**: `client/src/App.tsx`
```typescript
import NuovaSfida from '@/pages/challenges/NuovaSfida';

// Aggiungere nella sezione routing
<Route path="/challenge/nuova-sfida" component={NuovaSfida} />
```

### Modificare Mappa Canvas

#### Aggiungere Nuovo Tipo Terreno
**File**: `client/src/components/CanvasMap.tsx`

```typescript
// 1. Estendere il tipo
type TerrainType = 'grass' | 'forest' | 'mountain' | 'lake' | 'volcano';

// 2. Aggiungere logica generazione
if (x > 30 && y > 20 && (x + y) % 10 === 0) {
  tileType = 'volcano';
}

// 3. Implementare rendering
case 'volcano':
  ctx.fillStyle = '#dc2626'; // Rosso lava
  ctx.fillRect(x, y, size, size);
  // Pattern specifico del vulcano
  break;
```

#### Modificare Distribuzione Terreno
```typescript
// Modificare condizioni in generateTerrainTiles()
// Esempio: più foreste
if ((x < 20 && y < 15) || (x < 15 && y > 20)) {
  tileType = 'forest';
}
```

### Sistema di Temi

#### Aggiungere Nuovo Tema
**File**: `client/src/index.css`
```css
.ldc-theme--nuovo-tema {
  --ldc-background: #color;
  --ldc-surface: #color;
  --ldc-on-background: #color;
  /* Altre variabili... */
}
```

**File**: `client/src/types/game.ts`
```typescript
// Aggiungere al type
export type ThemeType = 'default' | 'dark' | 'high-contrast' | 'nuovo-tema';
```

## 🎨 Personalizzazione Visiva

### Modificare Avatar
1. **Aggiungere immagini**: `attached_assets/avatars/`
2. **Formato**: PNG trasparente 64x64px, stile pixel art
3. **Registrare**: In `client/src/lib/avatars.ts`

```typescript
// Aggiungere nuovo avatar
export const avatars = [
  // ...esistenti
  {
    id: 'nuovo-avatar',
    name: 'Nome Avatar',
    gender: 'male' | 'female',
    profession: 'professione',
    src: '/avatars/nuovo-avatar.png'
  }
];
```

### Personalizzare Colori LDC
**File**: `client/src/index.css`
```css
:root {
  --ldc-primary: #nuovo-colore;
  --ldc-secondary: #altro-colore;
  /* Aggiornare tutti i riferimenti */
}
```

## 📱 PWA Configuration

### Service Worker
**File**: `public/sw.js`
- Cache strategies per assets statici
- Offline fallbacks per pagine principali
- Background sync per dati di gioco

### Web App Manifest
**File**: `public/manifest.json`
- Icone per diverse dimensioni
- Display mode: standalone
- Orientamento: portrait preferito

## 🔧 Debugging e Testing

### Console Commands Utili
```javascript
// Ispezionare stato di gioco
JSON.parse(localStorage.getItem('ldc:gameState'))

// Reset completo
localStorage.clear()

// Debug canvas
const canvas = document.querySelector('[data-testid="terrain-canvas"]')
console.log('Canvas size:', canvas.width, 'x', canvas.height)
```

### Punti di Debug Comuni
1. **Strade non allineate**: Verificare `generatePaths()` coordinate
2. **Tile non visibili**: Controllare opacità CSS e z-index
3. **Performance**: Ridurre MAP_WIDTH/MAP_HEIGHT per test
4. **Responsive**: Testare `window.innerWidth` changes

### Test Data-TestId
Ogni elemento interattivo ha un `data-testid` per testing:
```typescript
// Pattern naming
button-{action}     // button-start-game
text-{content}      // text-user-name  
node-{id}          // node-guild-builder
tile-{type}-{id}   // tile-grass-123
```

## 🚢 Deployment

### Build Production
```bash
npm run build
```

### Environment Variables
```bash
# Development
NODE_ENV=development
DATABASE_URL=postgresql://...

# Production  
NODE_ENV=production
DATABASE_URL=postgresql://production...
```

### Checklist Pre-Deploy
- [ ] Build senza errori TypeScript
- [ ] Test su dispositivi mobile
- [ ] Verifica PWA offline
- [ ] Database migrations applicate
- [ ] Environment variables impostate

## 🤝 Contribuzioni

### Workflow Git
1. **Branch**: `feature/nome-feature` per nuove funzionalità
2. **Commit**: Messaggi descrittivi in italiano
3. **PR**: Includere screenshots per modifiche UI
4. **Review**: Test su almeno 2 dispositivi diversi

### Convenzioni Code Style
- **TypeScript**: Strict mode abilitato
- **React**: Functional components con hooks
- **CSS**: Utility-first con Tailwind + variabili CSS custom
- **Import**: Preferire path alias `@/` per import relativi

### Performance Guidelines
- **Canvas**: Evitare ridisegni frequenti, usare debouncing
- **State**: Minimizzare re-render con React.memo dove necessario  
- **Assets**: Ottimizzare immagini per web (WebP quando possibile)
- **Bundle**: Lazy loading per componenti non critici

---

*Per supporto tecnico o domande specifiche, consulta la documentazione inline nel codice.*