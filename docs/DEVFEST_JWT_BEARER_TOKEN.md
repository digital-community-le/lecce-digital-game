# DevFest API JWT Bearer Token Implementation

## Overview

Il sistema DevFest API ora utilizza il JWT token passato nell'URL per autenticare le chiamate API. Il token viene estratto dall'URL e incluso come Bearer token nell'header `Authorization` delle richieste.

## Architettura

### Componenti Coinvolti

1. **AuthService** (`authService.ts`)
   - Gestisce l'estrazione del JWT dall'URL (?t=JWT_TOKEN)
   - Persiste il token nel localStorage
   - Funzione `getCurrentJwtToken()` per ottenere il token corrente

2. **AuthServiceWrapper** (`implementations/authServiceWrapper.ts`)
   - Wrapper che implementa l'interfaccia `IAuthService`
   - Espone il token JWT per l'injection nel DevFestApiService

3. **DevFestApiService** (`implementations/devfestApiService.ts`)
   - Utilizza l'`IAuthService` per ottenere il JWT token
   - Include automaticamente il token nell'header `Authorization: Bearer {token}`

## Flusso di Autenticazione

### 1. Estrazione del Token

```
URL: https://game.devfest.gdglecce.it/?t=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
↓
authService.getCurrentJwtToken() → JWT token
```

### 2. Inclusione nelle API Calls

```typescript
// DevFestApiService automaticamente include il token:
const headers = {};
const jwtToken = this.authService.getCurrentJwtToken();
if (jwtToken) {
  headers['Authorization'] = `Bearer ${jwtToken}`;
}

// API call con headers
await this.httpClient.post(url, payload, headers);
```

## Modalità di Funzionamento

### Test Mode (`?test=1`)

- Non viene estratto o utilizzato il JWT token
- Le chiamate API ritornano mock responses
- Bypass completo dell'autenticazione

### Production Mode (default)

- **Con JWT Token**: Include `Authorization: Bearer {token}` in tutte le chiamate API
- **Senza JWT Token**: Effettua chiamate API senza header di autenticazione
- Il server API può decidere se accettare o rifiutare richieste non autenticate

## Priorità del Token

Il sistema segue questa priorità per la selezione del token:

1. **URL Token** (`?t=JWT_TOKEN`) - Priorità massima (sessione esterna)
2. **Local Storage Token** - Fallback per evitare perdite su reload
3. **Nessun Token** - API calls senza autenticazione

## Test Coverage

### Test Unitari

- `devfestApiService.jwt.test.ts`: Verifica inclusione Bearer token
- `authServiceWrapper.test.ts`: Test del wrapper dell'auth service

### Test di Integrazione

- `devfest.integration.test.ts`: Test del flusso completo URL → JWT → API

### Scenari Testati

- ✅ Token JWT valido presente nell'URL
- ✅ Token JWT assente (chiamate senza Authorization header)
- ✅ Token JWT vuoto (stringa vuota)
- ✅ Modalità test (bypass completo autenticazione)
- ✅ Gestione errori API con contesto JWT
- ✅ Flusso completamento gioco con autenticazione

## Utilizzo

### Dependency Injection

```typescript
const authService = new AuthServiceWrapper();
const devfestApi = new DevFestApiService(
  config,
  testModeChecker,
  httpClient,
  authService // <-- JWT token provider
);
```

### API Call con JWT

```typescript
// Automatico - il servizio gestisce l'inclusione del token
const badge = await devfestApiService.claimGameCompletionBadge();
```

## Sicurezza

- ✅ Token JWT validato prima dell'uso (struttura, scadenza)
- ✅ Token persistito localmente solo per fallback
- ✅ Priorità sempre al token URL (sessioni esterne)
- ✅ Gestione sicura di token nulli/vuoti
- ✅ Bypass completo in modalità test

## Debugging

### Log Console

```javascript
// In modalità production
🚀 Calling DevFest API for game completion badge...
✅ DevFest badge claimed successfully: {badge}

// In caso di errore
❌ DevFest API error: {error}
```

### Verificare Token Corrente

```typescript
import { getCurrentTokenInfo } from '@/services/authService';

const tokenInfo = getCurrentTokenInfo();
console.log('Token status:', tokenInfo);
// Output: { hasLocal: boolean, localValid: boolean, userId: string | null }
```
