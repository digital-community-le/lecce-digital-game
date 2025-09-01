# Task: Store reattivo + Persister locale

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1d

## Descrizione

Implementare uno store reattivo con persister su `localStorage` e API semplici per l'app (framework-agnostico):

- API: `store.get(key)`, `store.set(key, value)`, `store.append(key, item)`, `store.subscribe(key, callback)`.
- Chiavi supportate (esempi): `ldc:profile:{userId}`, `ldc:progress:{userId}`, `ldc:scans:{userId}`, `ldc:social:{userId}`, `ldc:sync-queue`.
- Persister resiliente: gestione errori di quota e fallback (es. riduzione retention, notifica UX).

## Acceptance criteria

- Lo store ripristina stato dopo reload del browser.
- `append` lavora in modalità append-only e persiste l'elemento (no duplicati non intenzionali).
  -- Fornita breve documentazione (README o commenti) su come usare l'API dello store.

## Game-data fields

- none

## Note tecniche

- Serializzare dati con `JSON.stringify` e usare prefisso `ldc:` per tutte le chiavi.
- Per payload grandi (blob) usare IndexedDB (Dexie opzionale) e salvare solo riferimenti/ids nello store.
- Gestire `QuotaExceededError`: offrire API `cleanup(key, options)` per liberare spazio e notificare l'utente.
- Predisporre hook per enqueue in `ldc:sync-queue` quando `remoteBackend === true` senza mandare immagini raw.
