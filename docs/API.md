# API Documentation - Il Sigillo di Lecce

## 🔄 Panoramica API

L'applicazione utilizza un'architettura **local-first** dove i dati sono gestiti principalmente in localStorage. L'API backend è opzionale e utilizzata per:
- Sincronizzazione dati tra dispositivi
- Leaderboard globale
- Analytics di utilizzo (anonimizzati)

## 🛠️ Endpoints Disponibili

### Profili Utente

#### `POST /api/profile`
Sincronizza profilo utente con backend.

**Request Body:**
```typescript
{
  userId: string;           // ID unico utente
  displayName: string;      // Nome visualizzato (2-30 caratteri)
  avatar: string;           // URL avatar selezionato
  specialization?: string;  // Specializzazione tecnica (opzionale)
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    userId: string;
    syncedAt: string;       // Timestamp ultima sincronizzazione
  }
}
```

### Progresso di Gioco

#### `POST /api/progress`
Sincronizza progresso sfide con backend.

**Request Body:**
```typescript
{
  userId: string;
  gameProgress: {
    completedChallenges: string[];    // Array ID sfide completate
    totalScore: number;               // Punteggio totale
    gameCompleted: boolean;           // Tutte le sfide completate
    lastActivity: string;             // Timestamp ultima attività
  }
}
```

#### `GET /api/leaderboard`
Ottiene classifica globale partecipanti.

**Query Parameters:**
- `limit?: number` - Numero risultati (default: 100)
- `offset?: number` - Offset paginazione (default: 0)

**Response:**
```typescript
{
  leaderboard: Array<{
    userId: string;
    displayName: string;
    totalScore: number;
    completedChallenges: number;
    rank: number;
  }>;
  meta: {
    total: number;
    page: number;
    hasMore: boolean;
  }
}
```

### Networking e Scansioni

#### `POST /api/scan`
Registra scansione QR tra utenti.

**Request Body:**
```typescript
{
  scannerUserId: string;    // ID utente che ha scansionato
  scannedUserId: string;    // ID utente scansionato  
  location?: {              // Coordinate GPS opzionali
    lat: number;
    lng: number;
  };
  timestamp: string;        // ISO timestamp della scansione
}
```

### Social Arena

#### `POST /api/social-proof`
Carica prova sociale (foto + OCR).

**Request Body (multipart/form-data):**
```typescript
{
  userId: string;           // ID utente
  image: File;              // Immagine da analizzare
  description?: string;     // Descrizione opzionale
}
```

**Response:**
```typescript
{
  success: boolean;
  ocrResults?: {
    text: string;           // Testo estratto da OCR
    confidence: number;     // Livello di confidenza (0-1)
    keywords: string[];     // Keywords rilevate
  };
  approved: boolean;        // Se la prova è approvata
  message: string;
}
```

## 🔐 Autenticazione

### Sistema di Identificazione
L'app non utilizza autenticazione tradizionale ma un sistema bassu su:

1. **URL Parameters**: `?userId=abc123` dal QR DevFest
2. **LocalStorage**: Persistenza locale del profilo
3. **QR Codes**: Scambio ID tra partecipanti

### Generazione QR Personale
```typescript
// QR contiene oggetto JSON
{
  userId: string;           // ID unico partecipante
  name: string;             // Nome per display
  event: 'devfest-lecce-2025';
  timestamp: number;        // Unix timestamp generazione
}
```

## 📊 Schema Dati

### UserProfile
```typescript
interface UserProfile {
  userId: string;           // ID univoco (nanoid)
  displayName: string;      // Nome visualizzato
  avatar: string;           // URL avatar
  specialization?: string;  // Campo tecnico opzionale
  createdAt: Date;         // Data creazione profilo
}
```

### GameProgress  
```typescript
interface GameProgress {
  completedChallenges: string[];  // Array ID sfide completate
  totalScore: number;             // Punteggio totale accumulato
  gameCompleted: boolean;         // Flag completamento gioco
  scannedUsers?: string[];        // ID utenti scansionati (networking)
  socialProofs?: SocialProof[];   // Prove sociali caricate
}
```

### Challenge
```typescript
interface Challenge {
  id: string;               // ID sfida ('guild-builder', etc.)
  title: string;            // Titolo breve per UI
  emoji: string;            // Emoji rappresentativa
  description: string;      // Descrizione completa
  position: Position;       // Coordinate sulla mappa
  status: ChallengeStatus;  // locked/available/completed
  progress: number;         // Progresso corrente (0-total)
  total: number;            // Objective totale sfida
}
```

## 🌐 Configurazione Sync Remoto

### Abilitazione Backend
**File**: `client/src/config/game.ts`
```typescript
export const gameConfig = {
  remoteBackend: true,      // Abilita sync remoto
  apiBaseUrl: '/api',       // Base URL per chiamate API
  syncInterval: 30000,      // Intervallo sync automatica (ms)
  offlineMode: false        // Forza modalità offline
};
```

### Headers Automatici
Tutte le chiamate API includono automaticamente:
```typescript
{
  'Content-Type': 'application/json',
  'X-Game-Version': '1.0.0',
  'X-Device-Id': deviceId,        // ID dispositivo persistente
  'X-Session-Id': sessionId       // ID sessione corrente
}
```

## 🚨 Error Handling

### Codici di Errore Standard
- `400` - Dati richiesta invalidi
- `404` - Risorsa non trovata (utente, sfida)
- `409` - Conflitto (sfida già completata, etc.)
- `429` - Rate limiting
- `500` - Errore server interno

### Gestione Offline
```typescript
// Auto-fallback a storage locale
try {
  const response = await fetch('/api/endpoint');
  // Gestione response...
} catch (error) {
  console.log('Offline mode - using local storage');
  // Fallback automatico a localStorage
}
```

## 📈 Analytics e Metriche

### Eventi Tracciati (Anonimizzati)
- `profile_created` - Creazione nuovo profilo
- `challenge_started` - Inizio sfida
- `challenge_completed` - Completamento sfida
- `qr_scan_success` - Scansione QR riuscita
- `game_completed` - Gioco completato
- `pwa_installed` - App installata su device

### Privacy
- **Anonimizzazione**: Nessun dato personale nei log
- **GDPR Compliant**: Consensi gestiti tramite localStorage
- **Minimal Data**: Solo metriche essenziali per miglioramento UX

---

*Documentazione API aggiornata: Settembre 2025*