# Retro Puzzle — Istruzioni per sviluppo

Questo documento raccoglie le istruzioni tecniche e UX per la challenge "Retro Puzzle".

## Scopo

Gioco di matching parola → categoria in una singola schermata (mobile-first). L'utente deve completare tutte le coppie definite per sbloccare la progressione sulla mappa.

## Esperienza utente (flow end-to-end)

1. Entrata nella challenge

   - L'utente seleziona il nodo "Retro Puzzle" sulla mappa.
   - Viene mostrata la schermata della challenge con titolo, descrizione breve, progresso corrente e CTA "Avvia Puzzle".

2. Schermata di gioco (single-screen)

   - Layout a due colonne (o righe su mobile): termini a sinistra, categorie a destra; entrambe le colonne sono visibili nello stesso viewport senza navigazioni aggiuntive.
   - L'utente tocca un termine e poi tocca la categoria corrispondente per segnare una coppia.
   - Feedback immediato per corretto/errato: animazione pixel (pop) e suono per corretto; shake/flash rosso per errato.
   - Pulsante "Hint" opzionale che risolve una coppia ma applica penalità punti (configurabile).
   - Barra di progresso che mostra coppie rimanenti e punteggio attuale.

3. Fine partita e persistenza
   - Quando tutte le coppie sono abbinate, mostrare summary con score, tempo, e pulsante "Completa" che aggiorna lo stato di progress.
   - Salvataggio locale di `PuzzleState` in `ldc:progress:{userId}` per ripristino in caso di reload.

## Regole di gioco e configurazione

- `pairsCount`: numero di coppie (es. 8)
- `mode`: `relaxed` (no timer) o `timed` (opzionale)
- `hints`: abilitazione hint e penalty (es. hintPenalty: 5 punti)
- punti: `basePoints` per coppia corretta, `penalty` per errore, `hintPenalty` per hint

Esempio `game-data.json` snippet:

```json
{
  "challenges": [
    {
      "id": "retro-puzzle",
      "type": "puzzle",
      "settings": {
        "pairsCount": 8,
        "mode": "relaxed",
        "basePoints": 10,
        "penalty": 2,
        "hintPenalty": 5,
        "streakBonus": 0
      }
    }
  ]
}
```

## Shape dati (TypeScript suggerito)

```ts
type PuzzlePair = { id: string; term: string; category: string };

type PuzzleState = {
  id: string; // instance id
  pairs: PuzzlePair[]; // definitive pairs for this run
  shuffledTerms: string[]; // terms order
  shuffledCategories: string[]; // categories order
  matches: Record<string, string>; // termId -> categoryId
  remaining: number;
  attempts: number; // number of user attempts (including wrong ones)
  startedAt?: string;
  finishedAt?: string;
  score?: number;
};
```

## Persistenza e sincronizzazione

- Stato locale: salvare `PuzzleState` in `ldc:progress:{userId}` per ripristino su reload.
- All'completion: aggiornare lo stato `progress` esclusivamente in locale (es. `ldc:progress:{userId}`). Non viene effettuata alcuna scrittura su remote store per questa challenge in versione iniziale.

## UX / UI details

- Mobile-first: evitare drag&drop complessi; preferire touch-tap per accoppiare.
- Animazioni leggere in stile 8-bit; fornire opzione per disattivarle su device low-end.
- Feedback sonoro opzionale, disattivabile dalle impostazioni.
- Pulsanti chiari: "Hint" (se disponibile), "Restart" (riavvia puzzle), "Esci".

## Messaggi e microcopy

- On empty/initial: "Completa tutte le coppie per sbloccare il prossimo nodo sulla mappa." (CTA: "Avvia Puzzle")
- On correct: "Giusto! +{points}" (breve animazione)
- On wrong: "Sbagliato — riprova" (shake + penalty text)
- On hint: "Usato hint — penalty {hintPenalty} punti"
- On completion: "Puzzle completato!" con summary e pulsante "Torna alla mappa"

## Edge cases

- Pool di coppie più piccolo di `pairsCount`: usare l'intero pool disponibile.
- Refresh o crash: ripristinare `PuzzleState` salvato (stesso `PuzzleState.id`).
- Duplicati nelle coppie: garantire id univoci per termini e categorie.
- Device low-end: fallback per animazioni e disattivazione su impostazioni per migliorare performance.

## Acceptance criteria

- La challenge carica `pairsCount` coppie dal `game-data.json` (o meno se pool minore).
- L'interazione click/tap aggiorna immediatamente lo stato e decrementa `remaining` sulle coppie corrette.
- Penalità e punti hint vengono applicati come specificato.
- Completamento aggiorna `progress` localmente e l'avatar sulla mappa può avanzare.

## Suggested contract (neutral)

- UI unit: `RetroPuzzleView`

  - Inputs: `settings` (pairsCount, mode, points config), `pairsPool` (lista possibile)
  - State: `puzzleState: PuzzleState`
  - Methods: `start()`, `selectTerm(termId)`, `selectCategory(categoryId)`, `useHint()`, `restart()`

- Persistence API: `puzzleStore` — genera `PuzzleState` iniziale, persiste in `ldc:progress:{userId}`, calcola score e applica penalty.

## Test suggeriti (minimi)

- Happy path: completare tutte le coppie => `ldc:progress:{userId}` aggiornato e punteggio calcolato correttamente.
- Wrong answers: punteggio diminuisce come da `penalty`.
- Hint: usa hint riduce la possibilità e applica `hintPenalty`.
- Refresh: ripristino dallo stato salvato.

## Prioritizzazione implementazione

1. UI skeleton e logica di matching (selection + verifica).
2. Persistenza `PuzzleState` e ripristino.
3. Scoring, hint e penalità.
4. Tests unitari per scoring e restore.

---

File di riferimento: `INSTRUCTIONS.md` (sezione Retro Puzzle).
