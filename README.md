# Il Sigillo di Lecce - Documentazione Sviluppatori

## 🎮 Panoramica

**Il Sigillo di Lecce** è una Progressive Web App (PWA) in stile retro 8-bit sviluppata per il DevFest Lecce 2025. L'app presenta un'esperienza di gioco interattiva con quattro sfide sequenziali ambientate in un mondo fantasy RPG.

### 🎯 Obiettivi Principali
- Coinvolgere i partecipanti dell'evento attraverso il gaming
- Facilitare il networking e la community building
- Fornire un'esperienza PWA offline-first
- Mantenere uno stile retro 8-bit accattivante

## 📋 Prerequisiti

- **Node.js**: >=20.0.0 (richiesto da Firebase CLI v14+)
- **npm**: >=10.0.0
- **Git**: Per il versioning e i pre-commit hooks

> **Nota**: Se usi nvm, puoi utilizzare `nvm use` per impostare automaticamente la versione corretta di Node.js (specificata in `.nvmrc`).

## 🏗️ Architettura

### Stack Tecnologico
- **Frontend**: React + TypeScript + Vite
- **Styling**: NES.css + Tailwind CSS + shadcn/ui
- **State Management**: Custom React hook con localStorage
- **Routing**: Wouter (lightweight)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL con Drizzle ORM

### Struttura del Progetto

```
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Componenti riutilizzabili
│   │   │   ├── CanvasMap.tsx           # Mappa principale (canvas-based)
│   │   │   ├── ProfileCreationForm.tsx # Form creazione profilo
│   │   │   ├── Header.tsx              # Header dell'app
│   │   │   └── ...
│   │   ├── pages/           # Pagine principali
│   │   │   ├── Intro.tsx               # Pagina introduttiva
│   │   │   ├── GameMap.tsx             # Pagina mappa di gioco
│   │   │   └── ...
│   │   ├── hooks/           # Custom hooks
│   │   │   └── use-game-store.ts       # State management globale
│   │   ├── lib/             # Utility e configurazioni
│   │   │   └── avatars.ts              # Gestione avatar
│   │   └── types/           # Definizioni TypeScript
│   │       └── game.ts                 # Tipi di gioco
├── server/                  # Backend Express
├── shared/                  # Codice condiviso
└── attached_assets/         # Assets statici (avatar, immagini)
```

## 🗺️ Sistema Mappa Canvas

### Componente CanvasMap.tsx

Il cuore visivo dell'applicazione è il componente `CanvasMap` che utilizza Canvas HTML5 per renderizzare una mappa procedurale in stile retro.

#### Caratteristiche Tecniche
- **Griglia**: 48x36 tile (1728 tile totali)
- **Tile Size**: 16px per forme più smussate
- **Rendering**: Pixel-perfect con `imageRendering: 'pixelated'`
- **Responsiveness**: Si adatta dinamicamente alle dimensioni dello schermo

#### Tipi di Terreno
1. **Prati (`grass`)**: Sfondo verde con pattern punteggiato
2. **Bosco (`forest`)**: Verde scuro con texture alberi stilizzati
3. **Montagne (`mountain`)**: Grigio con pattern roccioso geometrico
4. **Laghi (`lake`)**: Blu con effetto shimmer animato

#### Sistema di Strade
- Le strade collegano automaticamente i nodi delle sfide in sequenza
- Calcolate dinamicamente dalle posizioni percentuali dei nodi
- Rendering con bordo scuro e centro marrone (stile sterrato)
- Larghezza responsive basata sulle dimensioni schermo

## 🎯 Sfide di Gioco

### Sequenza Obbligatoria
1. **Networking Forest** 🌲 - Scansione QR per networking
2. **Retro Puzzle** 🧩 - Gioco di abbinamento
3. **Debug Dungeon** 🐛 - Quiz di debugging
4. **Social Arena** 📱 - Condivisione foto con OCR

### Progressione
- **Sequenziale**: Ogni sfida si sblocca solo dopo aver completato la precedente
- **Tracking**: Progress salvato in localStorage con chiave `ldc:*`
- **Avatar**: Si muove sulla mappa seguendo i progressi

## 🎨 Sistema di Styling

### Palette Colori LDC
```css
--ldc-primary: #86257b    /* Viola principale */
--ldc-secondary: #442c80  /* Viola secondario */
--ldc-accent: #c93880     /* Rosa accento */
--ldc-background: #f7f7f7 /* Sfondo chiaro */
```

### Temi Supportati
- **Default**: Tema chiaro LDC
- **Dark**: Tema scuro per condizioni di scarsa illuminazione
- **High Contrast**: Accessibilità migliorata

## 📱 PWA Features

### Funzionalità Offline
- Service Worker per caching delle risorse
- Dati persistiti in localStorage
- Funzionamento completo senza connessione

### Installabilità
- Web App Manifest configurato
- Icone per diverse dimensioni schermo
- Nome app: "LDC Game - Il Sigillo di Lecce"

## 🔧 Dove Intervenire

### Aggiungere Nuove Sfide
1. **Definire la sfida** in `client/src/hooks/use-game-store.ts`
2. **Creare il componente** in `client/src/pages/challenges/`
3. **Aggiungere la rotta** in `client/src/App.tsx`
4. **Posizionare sulla mappa** modificando le coordinate in `gameState.challenges`

### Modificare la Mappa
- **Terreno**: Modificare `generateTerrainTiles()` in `CanvasMap.tsx`
- **Strade**: Aggiustare `generatePaths()` e `drawRoadResponsive()`
- **Stile**: Modificare le funzioni `drawTileResponsive()` per ogni tipo

### Gestione Stato
- **Store globale**: `client/src/hooks/use-game-store.ts`
- **Persistenza**: Automatica con localStorage (prefix `ldc:`)
- **Tipi**: Definiti in `client/src/types/game.ts`

### Styling e Temi
- **Variabili globali**: `client/src/index.css` (sezione `:root`)
- **Componenti**: Utilizzano sistema shadcn/ui + NES.css
- **Responsive**: Media queries in `@media (max-width: 768px)`

## 🚀 Quick Start per Sviluppatori

### Setup Locale
```bash
npm install
npm run dev
```

### Struttura Dati Principali
```typescript
// Profilo utente
currentUser: {
  userId: string,
  name: string,
  avatar: string,
  specialization: string
}

// Progresso di gioco
gameProgress: {
  completedChallenges: string[],
  scannedUsers: string[],
  socialProofs: SocialProof[]
}
```

### File Chiave da Conoscere
- `CanvasMap.tsx` - Rendering mappa canvas
- `use-game-store.ts` - State management
- `ProfileCreationForm.tsx` - Onboarding utenti
- `index.css` - Styling globale e temi
- `App.tsx` - Routing principale

## 🎨 Personalizzazione Visiva

### Aggiungere Nuovi Tipi di Terreno
1. Estendere il tipo `TerrainType`
2. Aggiungere caso nel `switch` di `drawTileResponsive()`
3. Creare pattern CSS corrispondente
4. Aggiornare logica in `generateTerrainTiles()`

### Modificare Avatar
- **Directory**: `attached_assets/avatars/`
- **Formato**: PNG trasparente, 64x64px
- **Stile**: Pixel art full-body
- **Gestione**: `client/src/lib/avatars.ts`

## 🧩 Estensibilità

### Aggiungere Nuove Funzionalità
1. **Backend API**: Aggiungere endpoint in `server/routes.ts`
2. **Frontend**: Creare componenti in `client/src/components/`
3. **State**: Estendere `use-game-store.ts`
4. **Tipi**: Aggiornare `types/game.ts`

### Pattern Architetturali
- **Local-first**: Dati in localStorage, sync opzionale
- **Component-based**: Riutilizzo massimo dei componenti
- **Type-safe**: TypeScript ovunque
- **Progressive**: Migliore esperienza su dispositivi moderni

---

*Documentazione aggiornata al: Settembre 2025*
*Versione: DevFest Lecce 2025*