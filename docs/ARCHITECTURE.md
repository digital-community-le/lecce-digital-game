# Architettura Tecnica - Il Sigillo di Lecce

## 📐 Panoramica Architetturale

### Principi Fondamentali
- **Local-First**: I dati sono salvati localmente per default, sync remoto opzionale
- **Progressive**: Migliore esperienza su dispositivi moderni, funziona su tutti
- **Offline-Ready**: PWA completamente funzionante senza connessione
- **Responsive**: Adattamento automatico a tutti i dispositivi

## 🧩 Componenti Principali

### Frontend Layer

#### State Management (`use-game-store.ts`)
```typescript
// Store reattivo basato su localStorage
const gameState = {
  currentUser: UserProfile,      // Profilo utente corrente
  gameProgress: GameProgress,    // Progresso nelle sfide
  challenges: Challenge[],       // Definizione delle 4 sfide
  ui: UIState,                  // Stato interfaccia (modals, scanner)
  theme: ThemeType              // Tema attivo (default/dark/high-contrast)
}
```

**Dove intervenire**:
- Aggiungere nuovi campi al state: Estendere le interfacce
- Modificare persistenza: Aggiornare funzioni `load*` e `save*`
- Nuove azioni: Aggiungere metodi allo store

#### Routing System (`App.tsx`)
```typescript
// Routing basato su Wouter
<Route path="/" component={IntroPage} />
<Route path="/game" component={GameMapPage} />
<Route path="/challenge/:id" component={ChallengePage} />
```

**Dove intervenire**:
- Nuove pagine: Aggiungere route in App.tsx
- Protezione route: Modificare guards in GameMapPage
- Navigazione: Usare `useLocation()` hook

#### Sistema Mappa (`CanvasMap.tsx`)

##### Generazione Procedurale
```typescript
// Algoritmo di generazione terreno
const generateTerrainTiles = (): MapTile[] => {
  // Logica posizionale deterministica
  // Forest: top-left + bottom-left
  // Mountains: top-center + top-right  
  // Lakes: bottom-right
  // Grass: everywhere else
}
```

##### Rendering Canvas
```typescript
// Tre layer di rendering:
// 1. Terrain tiles (z-index: 1)
// 2. Roads (z-index: 5) 
// 3. Interactive overlay (z-index: 15+)
```

**Dove intervenire**:
- Nuovi tipi terreno: Estendere `TerrainType` e `drawTileResponsive()`
- Algoritmo generazione: Modificare `generateTerrainTiles()`
- Stile grafico: Aggiornare funzioni `drawTile*`

### Backend Layer

#### API Structure (`server/routes.ts`)
```typescript
// RESTful endpoints
POST /api/profile     // Creazione profilo
GET  /api/leaderboard // Classifica globale
POST /api/sync        // Sincronizzazione dati
```

#### Database Schema (`shared/schema.ts`)
```sql
-- Tabelle principali
users        -- Profili utenti
game_events  -- Eventi di gioco (scan, completamenti)
leaderboard  -- Classifica globale
```

**Dove intervenire**:
- Nuovi endpoint: Aggiungere in `server/routes.ts`
- Schema database: Modificare `shared/schema.ts`
- Validazione: Usare schemi Zod esistenti

## 🎨 Sistema di Styling

### Gerarchia CSS
1. **Base**: Tailwind CSS utilities
2. **Components**: NES.css per stile retro
3. **Custom**: Variabili CSS LDC in `:root`
4. **Themes**: Override in `.ldc-theme--*`

### Palette Colori LDC
```css
:root {
  --ldc-primary: #86257b;    /* Viola principale LDC */
  --ldc-secondary: #442c80;  /* Viola secondario */
  --ldc-accent: #c93880;     /* Rosa accento */
  --ldc-error: #ff3366;      /* Rosso errori */
}
```

**Dove intervenire**:
- Nuovi colori: Aggiungere variabili in `:root`
- Temi: Creare classe `.ldc-theme--nome`
- Componenti: Usare variabili CSS esistenti

## 🔄 Flusso Dati

### User Journey
```
1. Intro → ProfileCreation
2. ProfileCreation → GameMap  
3. GameMap → Challenge
4. Challenge → GameMap (repeat)
5. All Complete → Victory
```

### Data Flow
```
localStorage ↔ useGameStore ↔ Components
     ↕
Remote Backend (optional sync)
```

## 🎯 Punti di Estensione

### 1. Nuove Sfide
**File da modificare**:
- `use-game-store.ts`: Aggiungere challenge al array
- `pages/challenges/`: Creare nuovo componente
- `App.tsx`: Aggiungere route

**Pattern da seguire**:
```typescript
// 1. Definire la sfida
const newChallenge: Challenge = {
  id: 'new-challenge',
  title: 'Titolo Sfida',
  emoji: '🎯',
  position: { top: '50%', left: '50%' },
  // ...
}

// 2. Creare componente
const NewChallengeComponent: React.FC = () => {
  const { completeChallenge } = useGameStore();
  // Logica sfida
  // Chiamare completeChallenge(challengeId) al completamento
}
```

### 2. Personalizzazione Mappa
**Terreno**: Modificare `generateTerrainTiles()` per nuovi pattern
**Grafica**: Aggiungere casi in `drawTileResponsive()` 
**Dimensioni**: Cambiare `MAP_WIDTH`/`MAP_HEIGHT` costanti

### 3. Nuove Funzionalità UI
**Modals**: Seguire pattern esistente con state in `useGameStore`
**Forms**: Usare `react-hook-form` + `zod` validation
**Styling**: Preferire componenti shadcn/ui esistenti

### 4. Integrazione Backend
**Local-first**: Implementare prima logica frontend
**API**: Aggiungere endpoint per sincronizzazione
**Validation**: Usare schemi Zod condivisi

## 🔍 Debugging

### Tool Utili
```bash
# Console browser per state
localStorage.getItem('ldc:gameState')

# Dev tools React
window.__REACT_DEVTOOLS_GLOBAL_HOOK__

# Canvas debugging
document.querySelector('[data-testid="terrain-canvas"]')
```

### Log Patterns
- Use `console.log` con prefix `[COMPONENT_NAME]`
- State changes: Loggare before/after
- Performance: `console.time()` per rendering

## 📝 Convenzioni Codice

### Naming
- **Componenti**: PascalCase (`CanvasMap`)
- **Hook**: camelCase con `use` prefix (`useGameStore`)
- **Tipi**: PascalCase (`TerrainType`)
- **CSS**: kebab-case (`.canvas-map`)

### Structure
- **1 componente per file**
- **Export default** per componenti
- **Named export** per utilities
- **JSDoc** per funzioni complesse

### Testing
- **data-testid**: Su tutti gli elementi interattivi
- **Pattern**: `{action}-{target}` o `{type}-{content}`
- **Esempio**: `button-start-game`, `text-user-name`

---

*Per domande tecniche specifiche, consulta i commenti inline nel codice o contatta il team di sviluppo.*