# Task: Profile & QR

- Owner: Coding Agent (CA)
- Priority: High (Blocked by Task 02 - Store reattivo + Persister locale)
- Estimazione: 1.5d

## Descrizione

Implementare la UI di creazione profilo e le utility correlate:

- Avatar picker con preset in `public/assets/avatars/` e upload (convertire l'immagine in DataURL / base64 per conservazione offline).
- Input `displayName` e generazione di `userId` (uuid) al primo salvataggio.
- Salvataggio del profilo client-side in `ldc:profile:{userId}` con shape { userId, displayName, avatarDataUrl, createdAt }.
- Generazione QR client-side (payload JSON: { userId, displayName, avatarUrl, timestamp }) e caching della DataURL del QR in `ldc:qr:{userId}`.
- Modal di conferma al submit con CTA "Mostra il mio QR"; FAB persistente nell'HUD che apre la vista fullscreen del QR con azioni "Scarica immagine" e "Copia dati (JSON)".

> Nota: Questo task è bloccato fino al completamento del Task 02 — `Store reattivo + Persister locale`. È possibile sviluppare gli skeleton UI e mockare le chiamate di salvataggio (`store.set/append`) ma non finalizzare il salvataggio persistente fino a che lo store non è pronto.

## Acceptance criteria

- Profilo salvato in `ldc:profile:{userId}` con avatar DataURL.
- QR DataURL generato e salvato in `ldc:qr:{userId}`; la vista fullscreen mostra avatar, displayName e pulsanti per scaricare/copiare.
- Funzionalità offline: il QR e il profilo sono disponibili dopo reload senza backend (dopo che Task 02 è completato).
- Nessuna immagine inviata a server remoti per default; il flag `remoteBackend` abilita solo enqueue metadata.

## Game-data fields

- none

## Note tecniche

- Usare libreria client-side per QR (es. `qrcode`) e lazy-generate la DataURL per minimizzare CPU al submit.
- Conservare le immagini come DataURL solo per avatar (piccole); per proof più grandi usare IndexedDB (Dexie) — vedi `docs/dexie-persistence.md`.
- UX: mostrare warning su quota storage se il salvataggio fallisce.
- Fornire API di store (`store.get/set/append`) per interazione con lo store reattivo.
