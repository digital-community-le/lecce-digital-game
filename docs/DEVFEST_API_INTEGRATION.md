# DevFest API Integration

## Configurazione

La configurazione dell'API DevFest è definita in `game-data.json`:

```json
{
  "gameConfig": {
    "api": {
      "badgeEndpoint": "https://api.devfest.gdglecce.it/badges/@scan",
      "gameCompletionSecret": "community"
    }
  }
}
```

## API Endpoint

- **URL**: `https://api.devfest.gdglecce.it/badges/@scan`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

### Request Payload

```json
{
  "secret": "LECCE_DIGITAL_QUEST_2025_SIGILLO_MASTER_KEY_DEVFEST_COMPLETION_BADGE_ULTIMATE_SEAL"
}
```

### Response (Status 201)

```json
{
  "id": 1,
  "name": "Sigillo di Lecce - Master Quest",
  "description": "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
  "picture": "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
  "owned": true
}
```

## Servizi

### devfestApiService.ts

- `claimGameCompletionBadge()`: Chiama l'API DevFest per ottenere il badge
- `handleGameCompletion()`: Wrapper che gestisce errori e restituisce risultato strutturato

### completionService.ts

- `submitGameCompletion()`: Funzione principale per il completamento del gioco
- Integrata nella pagina `GameComplete.tsx`

## Modalità Test

Con `?test=1`:

- ✅ L'API call viene simulata e loggata in console
- ✅ Viene restituito un badge mock per testing
- ✅ Nessuna chiamata HTTP reale viene effettuata

## Integrazione UI

La pagina `GameComplete.tsx` mostra:

1. **Animazione Sigillo**: Animazione del sigillo completato
2. **Titolo e Descrizione**: Testi di completamento
3. **Badge DevFest**: Visualizzazione del badge ottenuto dall'API (se disponibile)
4. **Pulsante Statistiche**: Navigazione alle statistiche finali

## Gestione Errori

- API non disponibile: Errore loggato, gioco completa comunque
- Badge già ottenuto (409): Badge esistente viene mostrato
- Configurazione mancante: Errore di configurazione

## Log Console

In modalità test vengono mostrati:

- URL chiamato
- Payload inviato
- Response mock ricevuta

In produzione:

- Conferma chiamata API
- Risultato badge ricevuto
- Eventuali errori
