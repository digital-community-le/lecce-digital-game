# Task: Build, smoke & README

- Owner: Coding Agent (CA)
- Priority: Medium
- Estimazione: 0.5d

## Descrizione

Eseguire build PWA (production), verificare che l'app si avvii localmente e che i flussi critici (profile→map→challenge) siano navigabili. Aggiornare `README.md` con istruzioni di build e deploy minimali.

## Acceptance criteria

- Build completata senza errori critici.
- Smoke test manuale: avviare app, creare profilo, aprire scanner (simulato), giocare un puzzle, vedere progress aggiornato.
- README aggiornato con comandi di build e note su `remoteBackend` toggle.

## Comandi utili

```powershell
npm install
npm run build
npm run start
```

## Note tecniche

Assicurarsi che il service worker e la configurazione dello sw (se presente) siano coerenti con la PWA.

- Documentare eventuali variabili di environment utili per toggle `remoteBackend` e mock endpoints.
