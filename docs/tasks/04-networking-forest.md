# Task: Networking Forest — scanner & persistence

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.0d

## Descrizione

Implementare la view scanner (camera + fallback import), modal di preview per il payload QR (avatar, displayName, timestamp), creazione di `UserScan` con `opId` (uuid) e salvataggio in `ldc:scans:{userId}`. Aggiornare `NetworkingProgress` in `ldc:progress:{userId}`.

## Acceptance criteria

- Scanner apre e riconosce QR; preview modal mostra i dati corretti.
- Conferma crea `UserScan` append-only su `ldc:scans:{userId}`.
- Self-scan bloccato e duplicate non incrementano `scannedCount`.
- Progress UI si aggiorna immediatamente.

## Game-data fields

- `challenges[].requirements.minDistinctScans` (numero minimo scans per completare)

## Note tecniche

- Idempotenza tramite `opId`.
- Enqueue in `ldc:sync-queue` solo se `remoteBackend === true`.
- Debounce scans per evitare inserimenti doppi su scansione rapida.
- Gestire permessi camera negati mostrando fallback "Importa immagine".
