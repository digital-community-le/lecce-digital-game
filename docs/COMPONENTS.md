# Componenti - Documentazione Tecnica

## 🗺️ CanvasMap.tsx

### Panoramica
Componente principale per il rendering della mappa di gioco. Utilizza Canvas HTML5 per disegnare tile di terreno in stile pixel art con performance ottimali.

### Props
Nessuna prop - utilizza il game state globale tramite `useGameStore()`

### Funzionalità Principali

#### Generazione Procedurale Terreno
```typescript
generateTerrainTiles(): MapTile[]
```
- **Input**: Nessuno (usa costanti MAP_WIDTH/MAP_HEIGHT)
- **Output**: Array di 1728 tile (48x36)
- **Algoritmo**: Deterministico basato su coordinate (x,y)
- **Personalizzazione**: Modificare condizioni if/else per nuove distribuzioni

#### Sistema di Strade Dinamiche  
```typescript
generatePaths(canvasWidth: number, canvasHeight: number): PathSegment[]
```
- **Input**: Dimensioni canvas in pixel
- **Output**: Array di segmenti che collegano i nodi
- **Logica**: Converte posizioni % dei nodi in coordinate pixel
- **Allineamento**: Garantito su qualsiasi dimensione schermo

#### Rendering Canvas
```typescript
drawMap(): void
```
- **Responsiveness**: Calcola dimensioni dinamiche del canvas
- **Performance**: Disabilita smoothing per pixel-perfect
- **Layer**: Terreno → Strade → Nodi Challenge → Badge Challenge
- **Redraw**: Automatico su resize finestra

#### Challenge Badge Rendering
```typescript
drawChallengeBadge(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, maxWidth: number): void
```
- **Posizionamento**: Dinamico sotto ogni nodo challenge
- **Stile**: Retro 8-bit con bordi pixelati e colori contrastanti
- **Testo**: Titolo challenge leggibile con font serif
- **Dimensioni**: Adattive in base alla lunghezza del titolo
- **Colori**: Sfondo nero semi-trasparente, testo bianco, bordo grigio chiaro

### Configurazione

#### Costanti Modificabili
```typescript
const TILE_SIZE = 16;     // Dimensione tile (più piccolo = più dettaglio)
const MAP_WIDTH = 48;     // Larghezza griglia
const MAP_HEIGHT = 36;    // Altezza griglia
```

#### Tipi di Terreno
- `grass`: Verde con puntini random
- `forest`: Verde scuro con alberi stilizzati  
- `mountain`: Grigio con texture rocciosa
- `lake`: Blu con effetto water shimmer

### Estensioni Comuni

#### Nuovo Tipo Terreno
1. Aggiungere a `TerrainType`
2. Implementare caso in `drawTileResponsive()`
3. Aggiungere logica in `generateTerrainTiles()`

#### Modificare Pattern Terreno
```typescript
// Esempio: più laghi
else if ((x > 35 && y > 25) || (x < 10 && y < 8)) {
  tileType = 'lake';
}
```

---

## 👤 ProfileCreationForm.tsx

### Panoramica
Form per la creazione del profilo utente con validazione, selezione avatar e specializzazioni tecniche.

### Features
- **8 Avatar**: 4 maschili + 4 femminili in stile pixel art
- **Validazione**: Nome (3-20 caratteri), specializzazione obbligatoria
- **Auto-selezione**: Avatar pre-selezionato per UX ottimale
- **Responsive**: Layout adattivo mobile/desktop

### Props
```typescript
interface Props {
  onComplete: () => void; // Callback post-creazione profilo
}
```

### State Interno
```typescript
const [formData, setFormData] = useState({
  name: '',
  specialization: '',
  selectedAvatar: avatars[0] // Pre-selezione automatica
});
```

### Estensioni

#### Nuovi Campi Form
1. Aggiungere al `formData` state
2. Creare input con validazione Zod
3. Aggiornare `handleSubmit` per includere nuovo campo
4. Estendere `UserProfile` type se necessario

#### Nuove Specializzazioni
**File**: `client/src/lib/specializations.ts` (da creare)
```typescript
export const specializations = [
  'Frontend Developer',
  'Backend Developer', 
  'Nuova Specializzazione'
];
```

---

## 🎮 GameMap.tsx

### Panoramica
Pagina container principale per la modalità gioco. Gestisce il layout generale e i modals di overlay.

### Responsabilità
- **Layout**: Header + Mappa + FAB + Modals
- **Tema**: Applicazione classe CSS tema al document
- **Protezione**: Redirect a intro se manca profilo
- **Toast**: Sistema notifiche globale

### Modals Gestiti
- `ScannerView`: Scanner QR per networking
- `ScanPreviewModal`: Preview scansioni
- `CompletionModal`: Celebrazione completamento sfide

### Estensioni

#### Nuovo Modal
1. Importare componente modal
2. Aggiungere al JSX dopo altri modals
3. Gestire stato open/close tramite `useGameStore`

---

## 🔗 Header.tsx

### Panoramica
Header fisso con logo, titolo e controlli tema/accessibilità.

### Features
- **Branding**: Logo + titolo responsive
- **Theme Toggle**: Switch tra temi disponibili
- **Responsive**: Logo nascosto su mobile
- **Accessibilità**: Supporto high-contrast

### Personalizzazione

#### Aggiungere Controlli
```typescript
// Esempio: toggle audio
const { audioEnabled, toggleAudio } = useGameStore();

<button onClick={toggleAudio}>
  {audioEnabled ? '🔊' : '🔇'}
</button>
```

---

## 🎯 FloatingActionButton.tsx

### Panoramica
FAB per accesso rapido al QR personale e scanner.

### Azioni
- **Tap**: Mostra QR code personale
- **Long press**: Apre scanner (planned)

### Estensioni

#### Nuove Azioni FAB
```typescript
// Multi-action con menu
const [fabMenuOpen, setFabMenuOpen] = useState(false);

// Gestione azioni multiple
const fabActions = [
  { icon: '📱', action: showQR, label: 'Il tuo QR' },
  { icon: '📸', action: openScanner, label: 'Scansiona' }
];
```

---

## 🎪 Componenti Sfide

### Pattern Comune
Tutti i componenti sfida seguono questo pattern:

```typescript
const SfidaComponent: React.FC = () => {
  const { completeChallenge, setActiveView } = useGameStore();
  
  const handleSuccess = () => {
    completeChallenge('challenge-id');
    setActiveView('map'); // Torna alla mappa
  };
  
  return (
    <div className="challenge-container">
      {/* Logica specifica della sfida */}
    </div>
  );
};
```

### Networking Forest
- **QR Scanning**: Camera access + JSQr parsing
- **Validation**: Verifica formato QR e dati utente
- **Progress**: Traccia utenti scansionati

### Retro Puzzle  
- **Game Logic**: Memory/matching game
- **Timer**: Countdown con penalty
- **Scoring**: Basato su tempo e mosse

### Debug Dungeon
- **Quiz System**: Domande multiple choice
- **Code Samples**: Snippet con syntax highlighting
- **Progress**: Punteggio accumulativo

### Social Arena
- **Photo Upload**: Camera + file input
- **OCR Detection**: Tesseract.js per text recognition
- **Validation**: Verifica presenza keywords

## 📊 Estensibilità

### Aggiungere Funzionalità Cross-Component

#### Nuovo Sistema (es: Achievement)
1. **Types**: Definire in `types/game.ts`
2. **State**: Aggiungere a `use-game-store.ts`
3. **UI**: Creare componente in `components/`
4. **Integration**: Utilizzare nei componenti esistenti

#### Sistema Audio (esempio)
```typescript
// 1. State
interface GameState {
  // ...existing
  audio: {
    enabled: boolean;
    volume: number;
    currentTrack?: string;
  }
}

// 2. Actions  
const toggleAudio = () => { /* implementation */ };
const playSound = (soundId: string) => { /* implementation */ };

// 3. Integration
// Utilizzare in components per feedback audio
```

---

*Documentazione mantenuta aggiornata dal team di sviluppo*