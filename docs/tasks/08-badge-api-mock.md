# Task: Badge API mock + sync hooks

- Owner: Coding Agent (CA)
- Priority: Medium
- Estimazione: 0.5d

## Descrizione

Creare un mock service locale che emuli le API DevFest per: GET /badges/:id e POST /badges/claim. Il servizio verrà chiamato all'avvio per caricare i metadati dei badge e su completion per notificare l'ottenimento.

## Acceptance criteria

- Mock risponde a GET/POST con payload plausibili.
- App chiama il mock all'avvio e alla completion (se `remoteBackend` configurato per testing).
 - App chiama il mock all'avvio e alla completion (se `remoteBackend` configurato per testing). Il flusso di completion prevede un modal fullscreen che notifica la conquista della gemma e, al click del pulsante "Continua l'avventura", l'app fa redirect verso la mappa: il mock dovrebbe supportare eventuali chiamate POST/claim durante questo evento.
- Il mock è facilmente sostituibile da un endpoint reale tramite variabile di configurazione.

## Game-data fields

- none (configurazione esterna opzionale)

## Note tecniche

- Implementare come service interno o JSON statico; offrire override via environment config.
- Risposte devono includere id, title, description e url immagine (locale).
- Fornire logica semplice per simulare errori di rete e delay per test di retry/backoff.
