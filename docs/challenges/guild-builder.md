# Guild Builder 2.0 — La Taverna dei Compagni (final)

## Panoramica

Guild Builder 2.0 è una challenge finale pensata per creare sinergie tra partecipanti: l'utente deve comporre un gruppo di compagni (companions) che soddisfi un requisito dato (ruoli richiesti). La challenge rilascia la Gemma dell'Alleanza (`gem-of-alliance`) al completamento.

ID challenge: `guild-builder` (sostituisce `networking-forest` nel game-data)

## Meccanica di gioco

- Il giocatore riceve un requisito (es. "Crea una squadra con: 1 Designer, 1 Developer, 1 Social Wizard").
- Viene mostrata una pool randomica di companions (avatar + ruolo). L'utente seleziona i companions che ritiene corretti.
- Se la selezione soddisfa il requisito la challenge è completata e viene aggiornata `gameProgress.completedChallenges`.

## UX Flow

1. Apertura della challenge dalla mappa (nodo `guild-builder`).
2. Intro + requisito (card).
3. Griglia di companions (random pool) con filtro/ricerca per ruolo.
4. Conferma: validazione client-side, feedback (success/failure) e aggiornamento progresso.
5. Se completata: overlay "Challenge completata!" + animazione dell'avatar sulla mappa e rilascio della gemma.

## Requisiti tecnici e assets

- Gemma rilasciata: `gem-of-alliance` (public/assets/images/gem-of-alliance.png)
- ID challenge: `guild-builder`
- Assets richiesti: avatar pixel-art, ruolo-icone, card art.

## Dati e struttura (shape)

- Requirement: { id: string, text: string, roles: string[] }
- Companion: { id: string, name: string, role: string, description: string, avatarUrl: string }

Server/local persistence:
- Il risultato del round (successo) deve aggiornare `gameProgress.completedChallenges` e salvare profilo/achievements in storage.

## Criteri di accettazione (AC)

- AC1 — Il requisito viene presentato chiaramente e la pool di companions è riproducibile per testing.
- AC2 — La validazione client-side e server/local persistence aggiornano `gameProgress` correttamente.
- AC3 — Alla conferma, se la challenge è completata, viene mostrata la modale di completamento e l'app registra il completamento in `gameProgress.completedChallenges`.
- AC4 — L'animazione dell'avatar parte solo dopo la chiusura della modale e dopo 1s come da flow UX.

## Task suggeriti

1. Asset: preparare 6–10 avatar pixel + ruolo-icone.
2. Implementare UI: intro, requirement card, selection grid, confirmation flow.
3. Logic: validRoles mapping; random companion pool; validation.
4. Wire: integrare `guild-builder` in `game-data.json` e route.
5. Tests: unit tests per validation logic; e2e per UX happy/failure paths.

---

Document created to replace the previous `networking-forest` spec. Review and refine assets list before wiring into runtime.
