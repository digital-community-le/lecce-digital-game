# Task: Map loader & basic node activation

- Owner: Coding Agent (CA)
- Priority: High
- Estimazione: 1.5d

## Descrizione

Implementare il parser per `public/game-data.json` e una unità UI (es. `MapView`) che legge `gridSize` e `nodes` per renderizzare una griglia discreta e marker cliccabili per i nodi. Al click su un nodo aprire la schermata della challenge corrispondente.

## Acceptance criteria

- Il `game-data.json` viene caricato e parsato correttamente.
- I nodi sono renderizzati come marker sulla mappa e sono tappabili/cliccabili.
- Click su nodo apre la challenge view (routing o event emit).
- Avatar marker visibile e aggiornabile quando lo stato `ldc:progress:{userId}` cambia (tramite lo store reattivo).

## Game-data fields

- `gridSize`, `nodes[]` (id, challengeId, title, pixelPosition?)

## Note tecniche

- Render minimale per MVP; considerare `pixelPosition` opzionale per posizionamenti precisi.
- Tenere rendering semplice per performance su mobile; evitare librerie pesanti.
- Fornire meccanismo di eventi/callback per integrazione con i `Progress completion hooks`.
