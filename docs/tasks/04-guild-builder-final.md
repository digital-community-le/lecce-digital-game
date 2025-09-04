# Task: Guild Builder 2.0 — La Taverna dei Compagni (final)

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.0d

## Descrizione

Implementare la view per la challenge finale `guild-builder-final` che presenta un requisito di ruolo e una pool di companions da selezionare. Validare la selezione e aggiornare il progresso locale (`gameProgress`).

## Acceptance criteria

- La view mostra il requisito e una pool selezionabile di companions.
- La conferma valida lato client e aggiorna `gameProgress.completedChallenges` se corretta.
- I risultati persistono localmente e sono idempotenti.

## Game-data fields

- `challenges[].id = "guild-builder-final"`
- `challenges[].requirements = { type: 'roles', roles: string[], minSelected: number }`

## Note tecniche

- Random seed per pool riproducibile in test.
- API per fetching di avatar/role assets (o uso statico `generated_images/`).
