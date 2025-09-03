# Sistema di Protezione delle Rotte

## Componenti di Protezione

### 1. AuthWrapper
- **Posizione**: App root level
- **Funzione**: Mostra `TokenErrorScreen` se l'autenticazione fallisce con errore
- **Test Mode**: Se `gameState.test` è true, salta tutti i controlli di auth
- **Scope**: Globale - avvolge tutta l'app

### 2. AuthProtectedRoute  
- **Funzione**: Verifica che l'utente sia autenticato
- **Redirect**: Invia a `/` (IntroPage) se non autenticato
- **Test Mode**: Se `gameState.test` è true, permette accesso senza autenticazione
- **Uso**: Per tutte le rotte che richiedono autenticazione

### 3. GameCompletionProtectedRoute
- **Funzione**: Reindirizza i giochi completati alla pagina di completamento
- **Redirect**: Invia a `/game-complete` se il gioco è completato
- **Uso**: Solo per le rotte di gioco attivo (non per completion/stats)

## Rotte Protette

### Solo Autenticazione
- `/game-complete` - Pagina di completamento
- `/statistics` - Pagine statistiche

### Autenticazione + Protezione Completamento
- `/game/map` - Mappa del gioco
- `/game/challenge/*` - Tutte le challenge
- `/game` - Default game route

### Rotte Pubbliche (Non Protette)
- `/` - IntroPage (landing/auth)
- `*` - NotFound page

## Flusso di Autenticazione

1. **URL con token** → `AuthService.initAuthFromUrl()` → `GameState.auth`
2. **Test mode (?test=1)** → Salta tutti i controlli di autenticazione
3. **Non autenticato** → `AuthProtectedRoute` → Redirect a `/`
4. **Auth error** → `AuthWrapper` → `TokenErrorScreen`
5. **Gioco completato** → `GameCompletionProtectedRoute` → Redirect a `/game-complete`

## Modalità Test

Con `?test=1` nell'URL:
- ✅ Tutti i controlli di autenticazione vengono saltati
- ✅ Accesso diretto a qualsiasi rotta senza token
- ✅ Utile per sviluppo e testing senza token esterni

## Sicurezza

✅ Tutte le rotte di gioco richiedono autenticazione  
✅ Pagine di completamento accessibili solo ad utenti autenticati  
✅ Errori di autenticazione mostrano schermata di errore appropriata  
✅ Accesso diretto a rotte protette reindirizza all'intro  
