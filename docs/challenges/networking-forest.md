# Networking Forest — Istruzioni per sviluppo

Questo documento raccoglie tutte le istruzioni tecniche e UX per la challenge "Networking Forest".

## Scopo

L'utente scansiona il QR-code personale di altri partecipanti; la challenge è completata quando il numero minimo di scansioni distinte è raggiunto (configurabile via `game-data.json`). In questa versione non si raccolgono o conteggiano skill.

## Esperienza utente (flow end-to-end)

1. Entrata nella challenge

   - L'utente seleziona il nodo "Networking Forest" sulla mappa.
   - Viene mostrata la schermata della challenge con titolo, descrizione breve, progresso corrente (es. 2/5) e la lista/griglia dei partecipanti già scansionati.

2. Visuale principale

   - Lista/griglia (responsive) di entry scansionate: card compatta con avatar, displayName, timestamp e icona stato (✔ confermato, ⚠ offline).
   - CTA persistente per aggiungere/scansionare un nuovo player: FAB con icona QR e `aria-label="Scansiona QR partecipante"`.
   - Empty state: invito a scansionare il primo partecipante.

3. Avvio scansione

   - Tocco su FAB apre viewfinder a schermo intero (camera) o dialog per importare immagine se camera non disponibile.
   - Visual helpers (outline del QR, microcopy "Punta il codice QR del partecipante").

4. Parse e preview

   - Al riconoscimento del QR il client tenta il parse JSON.
   - Se malformato: mostrare "QR non valido" con opzioni Riprova/Importa.
   - Se OK: mostrare modal preview con avatar, displayName, timestamp e bottoni "Conferma" / "Annulla".
   - Self-scan: bloccare con messaggio "Non puoi scansionare il tuo QR".
   - Duplicate: indicare "Hai già scansionato questo partecipante" (possibile bottone "Aggiorna metadati").

5. Conferma e update locale

   - Alla conferma creare `UserScan` con `opId` (uuid), `scannedUserId`, `scannedName`, `scannedAvatarUrl`, `scannedAt`, `source:'qr'`.
   - Logica idempotente: se `scannedUserId` già presente non incrementare `scannedCount`.
   - Aggiornare `NetworkingProgress` (scannedUserIds, scannedCount, completed, lastUpdated, version).
   - Persistere:
     - append `UserScan` in `ldc:scans:{userId}`
     - aggiornare `ldc:progress:{userId}`
   - Enqueue op di sincronizzazione in `ldc:sync-queue` solo se `remoteBackend` è abilitato.

6. Feedback e completamento

   - Mostrare conferma visiva (animazione pixel + toast) e aggiornare la barra progresso.
   - Se `minDistinctScans` raggiunto: overlay "Challenge completata!" e animazione dell'avatar sulla mappa.

7. Offline & sync
   - Se offline, salvare localmente e mostrare "Salvato offline — sincronizzerò quando sei online".
   - Sync worker elabora `ldc:sync-queue` (idempotenza tramite `opId`) quando la connessione ritorna.

## Contract tecnico

### Payload QR (client-side)

```json
{
  "userId": "string",
  "displayName": "string",
  "avatarUrl": "https://example.org/avatar.png",
  "timestamp": "ISO8601"
}
```

### Tipi principali (TypeScript)

```ts
type UserScan = {
  opId: string; // uuid cliente per idempotenza
  scannedUserId: string;
  scannedName?: string;
  scannedAvatarUrl?: string;
  scannedAt: string; // ISO
  source: 'qr';
  verified?: boolean;
};

type NetworkingProgress = {
  userId: string;
  scannedUserIds: string[]; // userId unici
  scannedCount: number; // alias di scannedUserIds.length
  completed: boolean;
  lastUpdated: string;
  version: number;
};
```

### `game-data.json` snippet

```json
"challenges": [
  {
    "id": "networking-forest",
    "title": "Networking Forest",
    "type": "networking",
    "requirements": {
      "type": "scans",
      "minDistinctScans": 5
    }
  }
]
```

### Local keys / persistence

- `ldc:scans:{userId}` — array di `UserScan` (append-only client-side)
- `ldc:progress:{userId}` — `NetworkingProgress` summary
- `ldc:sync-queue` — coda di operazioni idempotenti da inviare al backend (se `remoteBackend === true`)

## Suggested contracts (neutral)

- UI unit: `NetworkingForestView`
  - State/props: `scans: UserScan[]`, `progress: NetworkingProgress`, `config` (minDistinctScans)
  - Methods: `openScanner()`, `onScanResult(payload)`, `confirmScan(userScan)`, `removeScan(opId)`
  - Children: `ScannerView` (camera/import), `ScanPreviewModal`, `ScansList` (virtual scroll)

## Messaggi e microcopy

- Loading camera: "Apro la fotocamera…"
- QR non valido: "QR non valido — riprova o importa immagine."
- Self-scan: "Non puoi scansionare il tuo QR."
- Duplicate: "Hai già scansionato questo partecipante."
- Salvato offline: "Scansione salvata offline. Sincronizzerò quando sarai online."
- Challenge completata: "Challenge completata!" + CTA "Torna alla mappa"

## Edge cases

- Self-scan: bloccare subito.
- Duplicate scans: non incrementare il conteggio.
- Timestamp fuori range: rifiutare (o loggare come suspicious).
- Permessi camera negati: mostrare fallback "Importa immagine".
- Multi-scan rapido: debounced confirm per evitare doppi insert.
- Aggiornamento avatar/name per stesso provider: consentire sovrascrittura metadata ma non duplicare id.

## Acceptance criteria

- Dopo conferma, `ldc:scans:{userId}` contiene il nuovo `UserScan`.
- `NetworkingProgress.scannedUserIds` riflette only unique userId e `scannedCount` è corretto.
- UI mostra aggiornamento progresso immediato.
- Self-scan rifiutato e non altera stato.
- Offline: scansioni persistono e sync avviene quando online (se backend abilitato).

## Note di implementazione e priorità

1. Implementare `ScannerView` + `ScanPreviewModal` (UX critici).
2. Implementare `scanStore` (persistence API) che si occupa di creare `UserScan`, aggiornare progress e persistere/local-enqueue.
3. Aggiungere gestione `ldc:sync-queue` (solo se `remoteBackend` abilitato) con retry/backoff e idempotenza via `opId`.
4. Coprire con unit test: happy path + self-scan + duplicate + offline enqueue.

---

File di riferimento: `INSTRUCTIONS.md` (sezione Networking Forest).

Se vuoi, posso ora generare i file TypeScript dei tipi e il `public/game-data.example.json` basato su queste istruzioni.
