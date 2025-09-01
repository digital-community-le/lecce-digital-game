# IndexedDB persistence (Dexie optional) — Persistenza blob e queue offline

Scopo: definire schema e API consigliate per salvare immagini (blob) e una coda di sincronizzazione append-only usando IndexedDB (Dexie opzionale come implementazione), mantenendo il vincolo "immagini client-only".

## Quando usare IndexedDB / Dexie

- Blob/immagini (screenshot) troppo grandi per localStorage.

- Queue retry per operazioni remote o future sync (claim badge, metadati da inviare).

## Schema proposto (concetto)

- Table: `blobs`

  - `id` (string, uuid)

  - `challengeId` (string)

  - `userId` (string)

  - `blob` (Blob)

  - `createdAt` (ISO string)

- Table: `syncQueue`

  - `id` (string, uuid)

  - `op` (string, es. `claimBadge`, `uploadProof`)

  - `payload` (object) — metadata-only, NON contiene blob

  - `status` (string: `pending` | `processing` | `done` | `failed`)

  - `createdAt` (ISO string)

- Table: `metadata`

  - `key` (string)

  - `value` (any)

## API recommended

- `saveBlob(userId, challengeId, blob): Promise<{ blobId }>`

- `getBlob(blobId): Promise<Blob>`

- `deleteBlob(blobId): Promise<void>`

- `enqueue(op, payload): Promise<queueId>` (payload should be metadata-only)

- `peekNext(): Promise<QueueItem | null>`

- `markProcessing(id)` / `markDone(id)` / `markFailed(id, reason)`

- `cleanupOldBlobs(maxAgeDays)`

## Best practices

- Non memorizzare immagini in localStorage; usare l'ID blob per referenziare la prova.

- Payload nella queue NON deve contenere la blob stessa (solo riferimento `blobId` quando strettamente necessario e se si prevede upload futuro).

- Limitare retention a N giorni e offrire UX per pulire dati.

- Gestire errori di quota/space: se IndexedDB lancia `QuotaExceededError`, mostrare messaggio e offrire rimozione dati vecchi.

## Snippet (IndexedDB / Dexie) (bozza)

```ts
// schema concept (esempio con Dexie)
const db = new Dexie('ldc');
db.version(1).stores({
  blobs: 'id, challengeId, userId, createdAt',
  syncQueue: 'id, status, createdAt',
  metadata: 'key',
});
```

## Acceptance criteria

- Blob salvati e recuperabili offline.

- Queue persistente across reloads e riavvii del browser.

- API documentata e usabile dal layer di persistenza (es. `socialProofStore`) e dai job di sync (futuro).

## Privacy

- Blob accessibile solo dal client; offri endpoint di rimozione e un'opzione "elimina tutte le prove".

## File correlati

- `docs/tesseract-integration.md`

- `docs/architettura-ocr.md`

- `docs/tasks/07-social-arena.md`
