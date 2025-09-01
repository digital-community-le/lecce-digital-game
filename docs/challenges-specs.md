# Spec sintetiche — Challenge (Networking Forest, Retro Puzzle, Debug Dungeon, Social Arena)

Presa in carico: ho letto i documenti specifici delle challenge (`docs/**/*.md`) e sintetizzato qui i requisiti tecnici, UX, shape dati, acceptance criteria e task granulari per un MVP estendibile entro 9 giorni.

## Checklist iniziale (requisiti utente confermati)

- Profilo & QR: client-side, DataURL cached, modal + FAB + preview in `Profile`. ✅
- Persistenza local-first: store reattivo + `localStorage` keys (`ldc:*`). ✅
- `remoteBackend` opzionale via `game-data.json` (default false). ✅
- Quattro challenge: Networking Forest, Retro Puzzle, Debug Dungeon, Social Arena — ciascuna con doc dedicato. ✅
- No test richiesti; sviluppo eseguito da coding agent + human. ✅
- Deadline: 9 giorni. ✅

## Nuovi artefatti creati

Durante l'analisi e la preparazione del piano ho aggiunto i seguenti documenti utili allo sviluppo immediato:

- `docs/tesseract-integration.md` — guida rapida per l'integrazione di Tesseract.js (lazy-load, comandi di installazione, snippet di esempio).
- `docs/architettura-ocr.md` — architettura dettagliata OCR (flow dati, preprocessing, acceptance, privacy).
- `docs/dexie-persistence.md` — schema e best practices per salvare blob/queue in IndexedDB (Dexie).
- `src/app/services/ocr-worker.md` — bozza tecnica per l'OCR worker API (init/recognize/terminate).
- `src/app/services/dexie-adapter.md` — bozza tecnica per l'adapter IndexedDB (es. Dexie) (API consigliate per saveBlob/enqueue).
- `docs/tasks-board.md` — board aggregata delle task MVP e piano sprint consigliato.

Questi file sono pronti come reference per l'implementazione e vanno usati come contratto tecnico per le attività su `Social Arena` e per la persistenza delle immagini.

---

## Risultati della lettura dei singoli documenti

Ho estratto da ogni doc: flow UX, tipi dati suggeriti, snippet `game-data.json`, chiavi locali (localStorage), edge-case e acceptance criteria — vedi sezioni dedicate qui sotto.

### 1) Networking Forest — sintesi

- Scopo: acquisire scansioni QR di altri partecipanti; completamento quando raggiunto `minDistinctScans`.
- UX flow chiave:
  - Nodo mappa → schermata challenge con FAB scanner.
  - Fullscreen scanner camera (fallback: importa immagine).
  - Parse JSON del QR, preview modal (avatar, displayName, timestamp), conferma/annulla.
  - Self-scan bloccato; duplicate non incrementano conteggio.
  - Offline: append-only `UserScan` salvati localmente e enqueue sync se `remoteBackend` true.
- Shape dati (consigliati):
  - UserScan:
    - opId: string (uuid)
    - scannedUserId: string
    - scannedName?: string
    - scannedAvatarUrl?: string
    - scannedAt: string (ISO)
    - source: 'qr'
  - NetworkingProgress:
    - userId, scannedUserIds[], scannedCount, completed:boolean, lastUpdated, version
- `game-data.json` snippet consigliato:

```json
{
  "challenges": [
    {
      "id": "networking-forest",
      "type": "networking",
      "requirements": { "type": "scans", "minDistinctScans": 5 }
    }
  ]
}
```

- Local keys:
  - `ldc:scans:{userId}` — array di `UserScan`
  - `ldc:progress:{userId}` — `NetworkingProgress`
  - `ldc:sync-queue` — queue di operazioni (opt-in)
- Acceptance criteria (MVP):
  - Scanner apre e parse QR; preview modal; conferma crea `UserScan` append-only.
  - Duplicate/self-scan non incrementano progresso.
  - Persistenza locale funzionante; visuale progress aggiornata.

### 2) Retro Puzzle — sintesi

- Scopo: matching term→category su singola schermata mobile-first.
- UX flow:
  - Entrata → "Avvia Puzzle" → termini a sinistra e categorie a destra (tap-to-match).
  - Feedback istantaneo (correct/wrong), hint opzionale con penalty.
  - Completion: summary con score e "Torna alla mappa".
- Shape dati (suggerito):
  - PuzzlePair { id, term, category }
  - PuzzleState { id, pairs[], shuffledTerms[], matches, remaining, attempts, score }
- `game-data.json` snippet esempio:

```json
{
  "challenges": [
    {
      "id": "retro-puzzle",
      "type": "puzzle",
      "settings": { "pairsCount": 8, "mode": "relaxed", "basePoints": 10, "penalty": 2 }
    }
  ]
}
```

- Local keys:
  - `ldc:progress:{userId}` include `puzzleState` per run
- Acceptance criteria (MVP):
  - Caricamento di `pairsCount` dal `game-data.json`.
  - Matching click/tap aggiorna stato e score; completion aggiorna progress locale.
  - Persistenza su reload.

### 3) Debug Dungeon — sintesi

- Scopo: quiz (mcq / multi) caricato da `game-data.json`.
- UX flow:
  - Entrata → "Avvia Quiz" → single-screen domanda + scelte + barra progresso.
  - Feedback per ogni risposta, spiegazione opzionale, next question.
  - Alla fine calcolo punteggio e determinazione pass/fail con `passThresholdPercent`.
- Shape dati (suggerito):
  - QuizQuestion { id, type: 'mcq'|'multi', prompt, choices[], correct, explanation?, points? }
  - QuizRun { id, challengeId, userId, questions[], currentIndex, answers, score, startedAt }
- `game-data.json` snippet esempio:

```json
{
  "challenges": [
    {
      "id": "debug-dungeon",
      "type": "quiz",
      "settings": { "questionsPerRun": 10, "passThresholdPercent": 50 }
    }
  ]
}
```

- Local keys:
  - `ldc:quiz:{userId}:{challengeId}:{instanceId}` — run state
  - `ldc:progress:{userId}` — summary
- Acceptance criteria (MVP):
  - Quiz carica `questionsPerRun`; risposte valutate client-side.
  - Completamento aggiorna `ldc:progress:{userId}`; resume funzionante.

### 4) Social Arena — sintesi (aggiornata)

- Scopo: upload screenshot/post contenente tag della community; verifica client-side via OCR.
- UX flow:
  - Entrata → istruzioni → crea post (suggestions) → upload/shot → OCR client-side → preview modal con detected tags → conferma.
  - Opzione skip (configurabile) senza punti.
- Shape dati (suggerito):
  - SocialProof { opId, userId, imageLocalUrl, detectedTags[], detected:boolean, verified:boolean, attempts, createdAt }
- `game-data.json` snippet esempio:

```json
{
  "challenges": [
    {
      "id": "social-arena",
      "type": "social",
      "settings": {
        "requiredTag": "@lecce_digital_community",
        "verificationMode": "ocr-client",
        "maxAttempts": 3
      }
    }
  ]
}
```

- Local keys:
  - `ldc:social:{userId}` — array di `SocialProof`
  - `ldc:progress:{userId}`
- Acceptance criteria (MVP):
  - Upload image → OCR locale rileva `requiredTag` con confidence minima configurabile → `detected=true` e prova salvata localmente.
  - Nessuna immagine inviata al remoto per default.

> Nota importante: la versione MVP ora prevede integrazione Tesseract.js lato client (lazy-load) e salvataggio dei blob in IndexedDB (Dexie opzionale come implementazione) per rispettare il vincolo "immagini client-only". Vedi `docs/tesseract-integration.md`, `docs/architettura-ocr.md` e `docs/dexie-persistence.md` per i dettagli tecnici e le API consigliate.

---

## Backlog sintetico per MVP (entità: coding agent = CA, human developer = HD)

Nota: tempo totale disponibile = 9 giorni; lavoro svolto dal coding agent con supervisione umana. Non includiamo test automati.

Priorità alta (MVP core)

1. T1 — Profile & QR (CA) — avatar picker + displayName + generate QR DataURL + modal + FAB + cache DataURL in `ldc:profile:{userId}` — 1.5d
2. T2 — App store + persistence (CA) — implementare store reattivo + persister su `localStorage` e API `get/set` (keys: `ldc:profile:{userId}`, `ldc:progress:{userId}`, `ldc:sync-queue`) — 1d
3. T3 — Map loader & basic node activation (CA) — parse `game-data.json`, render grid, place node markers, avatar marker (no fancy pathing) — 1.5d
4. T4 — Networking Forest minimal (CA) — scanner view (camera + import), parse QR, preview modal, append `UserScan`, update progress. Persistenza in `ldc:scans:{userId}` — 1.0d
5. T5 — Retro Puzzle minimal (CA) — load pairs from `game-data.json`, simple tap-match, scoring, save state to `ldc:progress:{userId}` — 1.0d
6. T6 — Debug Dungeon minimal (CA) — load questions, run lifecycle (start/answer/next/complete), compute score, update progress — 1.0d
7. T7 — Social Arena minimal (CA) — upload screenshot (file input), OCR client-side (Tesseract.js lazy-load + worker), detect requiredTag, save `SocialProof` local-only (use IndexedDB — Dexie opzionale — for blob storage and queue) — 2.5d
8. T8 — Progress completion hooks (CA) — when challenge complete, mark node completed and move avatar to next node (simple jump animation) + call DevFest badge API mock (if configured) — 0.5d
9. T9 — Polish UI & themes (HD/CA) — apply `src/styles.scss` variables from `INSTRUCTIONS.md`, include NES.css baseline — 0.5d
10. T10 — Deliver build & smoke (CA) — build PWA, quick smoke check, produce README update — 0.5d

Totale stimato: 10.0 giorni (T7 aumenta la stima per integrare Tesseract.js + worker + Dexie). Le stime sono aggressive per rispettare la deadline ma ora riflettono la scelta di integrare OCR reale.

## Piano giornaliero (10 giorni aggiornati)

Distribuzione minima per rispettare consegna: coding agent esegue task, human developer fornisce review/asset e merge.

Giorno 1 (D1)

- T1 Profile & QR (inizio) — avatar picker, displayName UI, save in localStorage.
- T2 Store skeleton (inizio).

Giorno 2 (D2)

- T1 Profile & QR (completamento): QR generation + modal + FAB + cache DataURL.
- T2 Store persister (completamento).

Giorno 3 (D3)

- T3 Map loader & basic rendering.
- T8 Badge API mock (skeleton).

Giorno 4 (D4)

- T4 Networking Forest (scanner + preview modal + persist scans).

Giorno 5 (D5)

- T5 Retro Puzzle (matching + scoring + persist).

Giorno 6 (D6)

- T6 Debug Dungeon (quiz lifecycle + scoring + persist).

Giorno 7 (D7)

- T7 Social Arena (OCR integration: lazy-load Tesseract.js, worker init, basic OCR pass, IndexedDB (Dexie opzionale) blob save).

Giorno 8 (D8)

- T7 Social Arena (tuning confidenceThreshold, fallback manual proof) — completamento.

Giorno 9 (D9)

- T8 Progress hooks & avatar movement + integrate badge mock calls; fix regressions.
- T9 Theme variables apply.

Giorno 10 (D10)

- T10 Build & smoke, README, minor fixes, handover package for deployment.

Note: ogni giorno prevedere una breve revisione umana (30–60m) per acceptance visiva e merge.

---

## Task granulari immediatamente assegnabili (Markdown-ready)

Per ogni task fornisco titolo, descrizione, acceptance criteria e `game-data.json` fields rilevanti.

- Task: Profile & QR (CA)

  - Description: UI per avatar picker (preset images in `public/assets/avatars/`) e upload (convert to base64), input displayName, save profile object `{ userId, displayName, avatarDataUrl, createdAt }` in `ldc:profile:{userId}`; generate QR DataURL (payload: `{ userId, displayName, avatarUrl, timestamp }`), store cached DataURL `ldc:qr:{userId}`; show modal and FAB.
  - Acceptance: profile saved in storage; QR DataURL exists and fullscreen view shows avatar + copy/download actions.
  - Game-data: none.

- Task: Store reattivo + Persister locale (CA)

  - Description: implementare uno store reattivo e un persister che salva/ripristina le chiavi principali (`ldc:profile`, `ldc:progress`, `ldc:scans`, `ldc:social`, `ldc:sync-queue`). API consigliata: `store.get(key)`, `store.set(key, val)`, `store.append(key, item)`.
  - Acceptance: store ripristina stato dopo reload; operazioni append persistono.

- Task: Map loader (CA)

  - Description: parse `public/game-data.json` (o `public/assets/game-data.json`), leggere `gridSize`, `nodes`, render semplice con marker clickable.
  - Acceptance: nodes renderati, click apre challenge screen.

- Task: Networking Forest (CA)

  - Description: implementare una scanner view (camera + import fallback), preview modal, creare `UserScan` e aggiornare `NetworkingProgress` in `ldc:scans:{userId}` e `ldc:progress:{userId}`.
  - Acceptance: simulate scan adds `UserScan`; duplicate/self-scan blocked; progress UI updates.

- Task: Retro Puzzle (CA)

  - Description: single-screen matching, scoring, hint button (opt-out), persist `PuzzleState` to `ldc:progress:{userId}`.
  - Acceptance: matching funziona, completion triggers progress update.

- Task: Debug Dungeon (CA)

  - Description: quiz lifecycle with `QuizRun` persisted locally; compute pass/fail using `passThresholdPercent`.
  - Acceptance: run completes, `ldc:progress:{userId}` updated.

- Task: Social Arena (CA)

  - Description: file input for image, OCR client-side using Tesseract.js (lazy-load + worker) for MVP, preview modal, save `SocialProof` local-only. Use IndexedDB (Dexie opzionale) for blob storage and queue references; do not upload images remotely by default.
  - Acceptance: upload -> OCR -> detectedTag => `SocialProof` saved; no remote image upload.

- Task: Badge API mock + sync hooks (CA)

  - Description: local mock endpoint or service that emulates DevFest badge GET/POST; invoked on app load and challenge completion if configured.
  - Acceptance: calls made and responses handled (success/fail UI toast).

- Task: Theme variables (HD/CA)
  - Description: add CSS variables from `INSTRUCTIONS.md` into `src/styles.scss` and ensure `ldc-theme--dark` and `ldc-theme--high-contrast` classes available.
  - Acceptance: theme toggles visually, variables used by components.

---

## Decisioni di progetto e trade-off (MVP-oriented)

- OCR: per MVP abbiamo deciso di integrare Tesseract.js (client-side) ma con lazy-load e Web Worker per limitare l'impatto sul bundle e sull'UI. In alternativa lo stub heuristico rimane una opzione rapida per demo locali.
- Avatar upload: salvo in DataURL per coerenza con `INSTRUCTIONS.md` e per facilità di generazione QR.
- Sync remoto: `remoteBackend` rimane disabilitato per default; `ldc:sync-queue` predisposto per future integrazioni con Firestore.

---

## Rischi e mitigazioni rapide

- Rischio: OCR unreliable -> mitigazione: allow manual proof flow and lower confidence threshold for MVP.
- Rischio: camera permissions -> mitigazione: provide image import fallback immediately.
- Rischio: storage quota full on device -> mitigazione: detect quota error and provide purge UI for old proofs/scans.

---

## Output finale consegnato (entro 10 giorni aggiornati)

- `docs/challenges-specs.md` (questo file)
- Lista task pronta per import in issue tracker (posso generare i Markdown issue su richiesta)
- `docs/game-data.example.json` e snippet da includere nel file di configurazione principale
- `docs/tesseract-integration.md`, `docs/architettura-ocr.md`, `docs/dexie-persistence.md`, `src/app/services/ocr-worker.md`, `src/app/services/dexie-adapter.md` (bozze tecniche)
- Breve README operativo per deploy PWA (al termine dello sviluppo)
