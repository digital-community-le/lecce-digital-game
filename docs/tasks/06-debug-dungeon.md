# Task: Debug Dungeon — quiz lifecycle

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.0d

## Descrizione

Implementare la UI unit `DebugDungeonView` con lifecycle di un run: `createRun` (shuffled), `answer` (mcq/multi), `nextQuestion`, `endRun`. Persistere `QuizRun` in `ldc:quiz:{userId}:{challengeId}:{instanceId}` e aggiornare `ldc:progress:{userId}` su completion.

## Acceptance criteria

 Risultati: punteggio finale, calcolo percentuale, pass/fail basato su `passThresholdPercent`.
 Al termine del run, la UI deve mostrare il modal celebrativo fullscreen (gemma + messaggio). Il pulsante "Continua l'avventura" all'interno del modal chiude il dialog e reindirizza l'utente alla mappa principale.
## Game-data fields

- `challenges[].settings.questionsPerRun`, `passThresholdPercent`, `maxAttempts`, `shuffleQuestions`

## Note tecniche

- Supportare sia `mcq` che `multi`.
- Salvare progress incrementale per consentire resume dopo reload.
- Enqueue op in `ldc:sync-queue` su completion solo se `remoteBackend === true`.
