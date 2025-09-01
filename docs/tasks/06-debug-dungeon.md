# Task: Debug Dungeon — quiz lifecycle

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.0d

## Descrizione

Implementare la UI unit `DebugDungeonView` con lifecycle di un run: `createRun` (shuffled), `answer` (mcq/multi), `nextQuestion`, `endRun`. Persistere `QuizRun` in `ldc:quiz:{userId}:{challengeId}:{instanceId}` e aggiornare `ldc:progress:{userId}` su completion.

## Acceptance criteria

- Il quiz carica `questionsPerRun` da `game-data.json` e crea una run persistente.
- Risposte valutate client-side e punteggio calcolato correttamente.
- Resume da run incompleto ripristina stato.
- Respect `maxAttempts` e `passThresholdPercent` per determinare pass/fail.

## Game-data fields

- `challenges[].settings.questionsPerRun`, `passThresholdPercent`, `maxAttempts`, `shuffleQuestions`

## Note tecniche

- Supportare sia `mcq` che `multi`.
- Salvare progress incrementale per consentire resume dopo reload.
- Enqueue op in `ldc:sync-queue` su completion solo se `remoteBackend === true`.
