# Task: Retro Puzzle — matching game

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.0d

## Descrizione

Implementare la UI unit `RetroPuzzleView` single-screen per match term→category. Caricare `pairs` dalla configurazione `game-data.json` (campo `settings.pairsCount`), gestire selection via tap, calcolare punteggio, supportare hint opzionale con penalty e salvare `PuzzleState` in `ldc:progress:{userId}`.

## Acceptance criteria

- Caricamento delle coppie funzionante.
- Matching tap→category aggiorna stato, incrementa score o applica penalty.
- Al completion lo stato viene salvato in `ldc:progress:{userId}` e la UI mostra summary.
- Al completion lo stato viene salvato in `ldc:progress:{userId}` e la UI mostra summary.
- Il summary deve presentare il modal celebrativo fullscreen con gemma e un pulsante "Continua l'avventura" che, una volta premuto, reindirizza l'utente alla mappa principale.
- Persistenza su reload: `PuzzleState` ripristinabile.

## Game-data fields

- `challenges[].settings.pairsCount`, `basePoints`, `penalty`, `hintPenalty`, `mode`

## Note tecniche

- Mobile-first layout; evitare drag&drop complessi.
- Usare un approccio reattivo per stato e persister per salvataggio.
- Applicare limitazioni di performance per device low-end (disattivare animazioni se necessario).
