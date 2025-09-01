# Debug Dungeon — Istruzioni per sviluppo

Questo documento raccoglie le istruzioni tecniche, UX e contratti per la challenge "Debug Dungeon".

## Scopo

Quiz multidisciplinare composto da domande fornite via `game-data.json`. L'utente risponde a una sequenza di domande e, se raggiunge la soglia, completa la challenge e avanza sulla mappa.

## Esperienza utente (flow end‑to‑end)

1. Entrata nella challenge

   - L'utente seleziona il nodo "Debug Dungeon" sulla mappa.
   - Viene mostrata la schermata con titolo, descrizione e CTA "Avvia Quiz"; mostra le regole sintetiche (numero di domande, soglia di passaggio).

2. Avvio del run

   - Il client carica il set di domande dal `game-data.json` e costruisce una istanza `QuizRun` (id, startedAt, questionsShuffled).
   - UI single-screen mobile-first: domanda + scelte + barra progresso (Q i / N).

3. Risposta e feedback

   - L'utente seleziona una scelta; il client fornisce feedback immediato corretto/errato con animazione pixel (verde/rosso).
   - Per `mcq` si accetta una sola scelta; per `multi` si possono selezionare più risposte e poi premere "Invia".
   - Dopo la risposta il client mostra la spiegazione (se presente) e tocca "Avanti" per la domanda successiva.

4. Fine run e valutazione

   - Al termine del run il sistema calcola il punteggio totale e determina pass/fail con la soglia `passThresholdPercent`.
   - Mostrare summary con score, dettagli per domanda (corrette/errate), tempo, e CTA "Completa" che aggiorna lo stato di progresso locale.

5. Persistenza e sincronizzazione
   - Salvataggio locale per ogni run in `ldc:quiz:{userId}:{challengeId}:{instanceId}` per ripristino in caso di refresh.
   - All'completion enqueue op verso `ldc:sync-queue` (solo se `remoteBackend === true`) per aggiornare `progress/{userId}` e leaderboard remote.

## Tipi e shape dati (suggeriti)

```ts
type QuizQuestion = {
  id: string;
  type: 'mcq' | 'multi';
  prompt: string;
  choices: { id: string; text: string }[];
  correct: string | string[]; // id or array
  explanation?: string;
  points?: number;
};

type QuizRun = {
  id: string; // run instance id
  challengeId: string;
  userId: string;
  questions: QuizQuestion[]; // shuffled for the run
  currentIndex: number;
  answers: Record<string, string | string[]>; // questionId -> answer(s)
  score: number;
  startedAt: string;
  finishedAt?: string;
};
```

## `game-data.json` snippet

```json
{
  "challenges": [
    {
      "id": "debug-dungeon",
      "type": "quiz",
      "settings": {
        "questionsPerRun": 10,
        "passThresholdPercent": 50,
        "shuffleQuestions": true,
        "allowRetakes": true,
        "maxAttempts": 3
      }
    }
  ]
}
```

## UX / UI details

- Mobile-first single-screen quiz: domanda, scelta(e), barra progresso, tasto avanti.
- Immediate feedback per ogni risposta, mostrare spiegazione breve (se presente).
- Indicare il numero di tentativi rimasti e bloccare nuove esecuzioni oltre `maxAttempts`.
- Supportare resume: se esiste `QuizRun` incompleto in localStorage, offrire "Riprendi" o "Nuovo Run".

## Persistenza e sync

- Local keys:
  - `ldc:quiz:{userId}:{challengeId}:{instanceId}` — stato del run in corso/completato
  - `ldc:progress:{userId}` — summary progress generale
  - `ldc:sync-queue` — queue per operazioni remoti (idempotenti con `opId`)
- Sync policy: enqueue op `{ opId, type: 'quiz-complete', payload: { runId, score, passed } }` solo se `remoteBackend` è true.

## Edge cases

- Pool di domande più piccolo di `questionsPerRun`: usare l'intero pool.
- Interruzione di sessione: riprendere dallo stato salvato o offrire restart.
- Tentativi multipli: rispettare `maxAttempts` per challenge.
- Question malformed: skipare la domanda e loggare warning (non bloccare l'esperienza)

## Acceptance criteria

- Il quiz presenta `questionsPerRun` domande (o meno se pool limitato).
- Le risposte sono valutate client-side e il punteggio è calcolato correttamente.
- Pass se `score >= maxPossible * passThresholdPercent / 100`.
- Completamento del run aggiorna `ldc:progress:{userId}` e aggiunge op in `ldc:sync-queue` quando `remoteBackend` è abilitato.
- Ripristino da run incompleto funziona correttamente.

## Contratto suggerito (UI e persistenza)

- Unità UI: `DebugDungeonView`

  - Stato: `currentRun: QuizRun | null`, `loading: boolean`, `attemptsLeft: number`
  - Metodi: `startRun()`, `submitAnswer(questionId: string, answer: string | string[])`, `nextQuestion()`, `completeRun()`

- Store / API di persistenza: `quizStore` (responsabile di salvataggio locale e enqueue per sync)
  - API suggerita: `createRun(challengeId: string): QuizRun`, `saveRun(run: QuizRun): void`, `loadRun(runId: string): QuizRun | null`, `completeRun(runId: string): void`

## Test suggeriti

- Happy path: completare un run, verificare score e progress aggiornati.
- Resume: iniziare run, ricaricare la pagina, riprendere dallo stato salvato.
- Attempts: superare `maxAttempts` e verificare blocco nuovo run.
- Malformed question: assicurarsi che il run continui e logghi warning.

## Priorità di implementazione

1. UI base + run lifecycle (start, answer, next, complete).
2. Persistenza locale e resume.
3. Scoring e blocking `maxAttempts`.
4. Sync worker per `ldc:sync-queue` (se `remoteBackend` abilitato).

---

File di riferimento: `INSTRUCTIONS.md` (sezione Debug Dungeon).
