# JWT Persistence Fix - Documentazione

## Problema Identificato

L'applicazione aveva un problema di persistenza del JWT token al refresh della pagina. Nonostante il sistema di autenticazione JWT fosse implementato correttamente, l'app non riconosceva l'utente quando si ricaricava la pagina senza parametri URL.

## Causa Principale

Il problema era nella logica di collegamento tra:

1. **Token JWT salvato nel localStorage**
2. **Profilo utente salvato nel localStorage**
3. **Logica di riconoscimento al refresh**

### Problemi Specifici

1. **Disconnessione token-profilo**: Quando il token veniva ricevuto via URL ma non conteneva un userId valido, veniva salvato per l'ultimo profilo ma il collegamento non era sempre garantito.

2. **Fallback inadeguato**: Al refresh, la logica non riusciva sempre a recuperare il token locale associato al profilo dell'utente.

3. **Mancanza di debug**: Non c'erano strumenti per tracciare il flusso di autenticazione e identificare dove si perdeva il token.

## Soluzioni Implementate

### 1. Miglioramento della Logica di Recupero Token

**File:** `client/src/hooks/use-game-store.tsx`

**Modifiche:**

- Aggiunta priorità nel recupero del profilo: prima cerca di estrarre l'userId dal token, poi fallback al profilo salvato
- Migliorata la persistenza del token per garantire il collegamento token-profilo
- Aggiunto logging dettagliato per tracciare il flusso

```typescript
// Try to get userId from token first, then fallback to last profile
if (authResult.token) {
  const tokenUserId = getUserIdFromToken(authResult.token);
  if (tokenUserId) {
    profile = storage.getProfile(tokenUserId);
  }
}

// Fallback to last profile if no token userId or profile not found
if (!profile) {
  profile = storage.getLastProfile();

  // If we have a token but no associated profile, ensure token is persisted for the last profile
  if (authResult.token && profile?.userId && authResult.tokenSource === 'url') {
    persistTokenForUser(profile.userId, authResult.token);
  }
}
```

### 2. Aggiunta di Logging Dettagliato

**File:** `client/src/services/authService.ts`

**Modifiche:**

- Aggiunto logging dettagliato in `initAuthFromUrl()` per tracciare ogni step del processo di autenticazione
- Aggiunta funzione `debugAuthState()` per debug completo

```typescript
console.log('🔐 Auth initialization:', {
  hasUrlToken: !!token,
  isTestMode,
  urlParams: params,
});
```

### 3. Strumenti di Debug Completi

**File:** `client/src/utils/auth-debug.ts`

**Funzionalità:**

- `testJwtPersistence()`: Testa la persistenza del token
- `clearAuthData()`: Pulisce tutti i dati di autenticazione
- `simulateUrlToken()`: Simula la ricezione di un token via URL
- `debugAuthInfo()`: Mostra informazioni complete sullo stato dell'autenticazione

**Utilizzo in console:**

```javascript
// Informazioni complete di debug
window.authDebug.info();

// Testa la persistenza
window.authDebug.test();

// Pulisce i dati per test
window.authDebug.clear();

// Simula un token URL
window.authDebug.simulate();
```

### 4. Miglioramento della Funzione di Debug

**File:** `client/src/services/authService.ts`

**Aggiunta:**

```typescript
export function debugAuthState(): void {
  const params = readUrlAuthParams();
  const tokenInfo = getCurrentTokenInfo();
  const lastProfile = gameStorage.getLastProfile();

  console.log('🔍 Debug Auth State:', {
    urlParams: params,
    lastProfile: lastProfile
      ? {
          userId: lastProfile.userId,
          displayName: lastProfile.displayName,
        }
      : null,
    tokenInfo,
    currentJwt: getCurrentJwtToken() ? 'present' : 'missing',
  });
}
```

## Flusso di Autenticazione Corretto

### Al Primo Accesso (con token URL)

1. `initAuthFromUrl()` rileva il token nei parametri URL
2. Valida il token JWT
3. Estrae l'userId dal token (se disponibile)
4. Persiste il token nel localStorage associato all'userId
5. Carica o crea il profilo utente
6. Salva il profilo come "ultimo profilo"

### Al Refresh (senza parametri URL)

1. `initAuthFromUrl()` non trova token URL
2. Recupera l'ultimo profilo salvato
3. Cerca il token salvato per quell'utente
4. Valida il token locale
5. Se valido, procede con l'autenticazione
6. Carica il profilo e lo stato del gioco

### Al Nuovo Token URL (aggiornamento sessione)

1. Il nuovo token URL ha sempre priorità
2. Valida il nuovo token
3. Aggiorna la persistenza locale
4. Mantiene la continuità della sessione

## Testing e Verifica

### Testing Manuale

1. Accesso con token URL: `?t=JWT_TOKEN`
2. Refresh della pagina (senza parametri)
3. Verifica che l'utente rimanga autenticato
4. Verifica che il gioco continui dallo stato salvato

### Debug Console

```javascript
// Verifica lo stato corrente
window.authDebug.info();

// Testa persistence
window.authDebug.test();
```

### Modalità Test

Per testing locale, utilizzare: `?test=1`
Questo bypassa l'autenticazione e genera token fake.

## File Modificati

1. `client/src/hooks/use-game-store.tsx` - Logica principale di recupero token/profilo
2. `client/src/services/authService.ts` - Miglioramento logging e debug
3. `client/src/utils/auth-debug.ts` - Nuovi strumenti di debug

## Commit e Deploy

Le modifiche sono pronte per essere committate. Il deploy avverrà automaticamente tramite GitHub Actions.

```bash
git add .
git commit -m "fix: improve JWT persistence and add debugging tools

- Enhanced token-profile linking logic in game store
- Added comprehensive logging for auth flow debugging
- Created debug utilities for manual testing
- Fixed refresh issue where app didn't recognize authenticated users
- Improved fallback logic for token recovery without URL params"
```
