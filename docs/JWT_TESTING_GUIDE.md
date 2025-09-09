# Testing JWT Persistence - Guida Rapida

## Come Testare le Fix del JWT

### 1. Testing Locale con Modalità Test

Aggiungi `?test=1` all'URL per testare localmente:

```
http://localhost:5000/?test=1
```

### 2. Testing con Token Reale

Simula un token JWT reale:

```
http://localhost:5000/?t=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MzQ1NjQ4MDAsImV4cCI6OTk5OTk5OTk5OX0.test-signature
```

### 3. Verifica della Persistenza

1. **Primo accesso**: Visita l'URL con token
2. **Crea profilo**: Completa la creazione del profilo
3. **Refresh**: Ricarica la pagina (senza parametri URL)
4. **Verifica**: L'app dovrebbe riconoscere l'utente

### 4. Debug Console

Apri DevTools Console e usa:

```javascript
// Informazioni complete
window.authDebug.info();

// Testa persistenza
window.authDebug.test();

// Pulisci dati (per test pulito)
window.authDebug.clear();

// Simula nuovo token
window.authDebug.simulate();
```

### 5. Scenari di Test

#### Scenario 1: Primo Accesso

- URL: `/?t=JWT_TOKEN`
- Risultato atteso: Login successful, profilo creato

#### Scenario 2: Refresh Durante Gioco

- Azione: F5 o Ctrl+R durante il gioco
- Risultato atteso: Utente rimane autenticato, gioco continua

#### Scenario 3: Nuovo Token

- URL: `/?t=NEW_JWT_TOKEN` (diverso dal primo)
- Risultato atteso: Nuova sessione riconosciuta

#### Scenario 4: Token Scaduto

- Usa un token con `exp` nel passato
- Risultato atteso: Errore di autenticazione mostrato

### 6. Logs da Monitorare

Nel Console DevTools dovresti vedere:

```
🚀 Initializing game store with auth...
🔐 Auth initialization: { hasUrlToken: true, isTestMode: false, urlParams: {...} }
✅ URL token is valid
💾 Token persisted for user: user123
👤 Found profile for token user: user123 ✅
🎮 Loading game for user: user123
```

### 7. Troubleshooting

Se il problema persiste:

1. Controlla il Console per errori
2. Usa `window.authDebug.info()` per diagnostica
3. Verifica che il token sia un JWT valido
4. Pulisci localStorage con `window.authDebug.clear()`

### 8. Testing in Produzione

L'app di produzione è su: https://lecce-digital-legends.web.app

Per testing in produzione, ricorda che serve un token JWT reale dalla piattaforma DevFest.

## Riferimenti

- Documentazione completa: `docs/JWT_PERSISTENCE_FIX.md`
- Implementazione JWT: `docs/JWT_IMPLEMENTATION.md`
- Debug utilities: `client/src/utils/auth-debug.ts`
