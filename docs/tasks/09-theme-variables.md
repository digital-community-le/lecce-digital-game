# Task: Theme variables in `src/styles.scss`

- Owner: Human Developer (HD) / CA
- Priority: Medium
- Estimazione: 0.5d

## Descrizione

Aggiungere le variabili CSS indicate in `docs/INSTRUCTIONS.md` sotto `:root` e le classi `.ldc-theme--dark` e `.ldc-theme--high-contrast` in `src/styles.css`. Assicurarsi che NES.css sia caricato come base e che componenti possano usare le variabili.

## Acceptance criteria

- Variabili presenti in `src/styles.css` e applicabili tramite classi tema.
- Documentazione breve (1 paragrafo) su come abilitare il tema nel DOM (aggiunta della classe root).

## Game-data fields

- none

## Note tecniche

- Usare i nomi di variabili proposti in `docs/INSTRUCTIONS.md` (`--ldc-primary`, `--ldc-accent`, `--ldc-background`, ecc.).
- Fornire override per `.ldc-theme--dark` e `.ldc-theme--high-contrast`.
- Verificare che componenti esistenti usino le variabili (es. bottoni, input).
