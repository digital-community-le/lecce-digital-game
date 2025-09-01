# Task: Social Arena — upload + OCR (Tesseract.js)

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 2.5d (include integrazione Tesseract.js + tuning)

## Descrizione

Implementare il flow di upload screenshot (file input / camera), preview e verifica tramite OCR client-side usando Tesseract.js. Estrarre `detectedTags` e verificare la presenza di `requiredTag` (case-insensitive). Salvare `SocialProof` in `ldc:social:{userId}` come metadata-only (non caricare immagini al remoto). Usare IndexedDB (Dexie opzionale) per salvare i blob immagine e referenziarli tramite `blobId` nei metadata.

## Acceptance criteria

- Upload/shot funziona su mobile e desktop.
- Tesseract.js esegue OCR sull'immagine; se `requiredTag` rilevato sopra soglia configurabile (`confidenceThreshold`), `SocialProof` salvato con `detected=true`.
- Fallback manual proof disponibile quando OCR confidence bassa.
- Nessuna immagine inviata al remoto per default; solo metadata e `blobId` referenziati.

## Game-data fields

- `challenges[].settings.requiredTag`, `verificationMode`, `maxAttempts`, `confidenceThreshold`, `allowManualProof`, `allowSkipWithoutSocial`

## Note tecniche

- Lazy-load Tesseract.js e usare Web Worker per non bloccare UI (vedi `docs/tesseract-integration.md`).
- Salvare blob in IndexedDB (Dexie opzionale); salvare solo `blobId` nei metadata `ldc:social:{userId}`.
- Predisporre politica di retention e cleanup per i blob (es. purge dopo N giorni o su richiesta).
- Gestire errori di quota (consentire fallback di riduzione qualità dell'immagine o avviso all'utente).
- Non inviare immagini a servizi esterni senza esplicito consenso.
