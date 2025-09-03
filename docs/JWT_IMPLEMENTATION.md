# JWT Authentication Implementation

## Requisiti Implementati ✅

- [x] Salvataggio JWT token localmente per mantenere login
- [x] Se `test=1`: token opzionale, creazione token fake se mancante
- [x] Se `test=0/assente`: token richiesto, schermata errore se mancante/invalido
- [x] Predisposizione validazione JWT (struttura per verifica futura)
- [x] Schermata errore per token invalidi
- [x] **Integrazione piattaforma esterna**

## Flusso Integrazione Esterna 🔄

### Comportamento per Platform Integration
1. **Token URL presente** → Lo usa sempre (sessione corrente piattaforma esterna)
2. **Nessun token URL** → Fallback a token locale (evita perdite accidentali)
3. **Nessun token + test mode** → Genera token fake
4. **Nessun token + production** → Mostra errore

### Tipico Flusso Utente
```
Piattaforma Esterna → Gioco (?t=JWT) → Completa Sfide → POST risultati con stesso JWT → Ritorna alla Piattaforma
```

### Persistenza Locale
- **Scopo**: Evitare perdite se l'utente ricarica la pagina
- **Priorità**: Token URL è sempre autorativo se presente

## File Creati/Modificati

### Nuovi File
- `client/src/services/jwtService.ts` - Validazione e generazione token fake
- `client/src/components/TokenErrorScreen.tsx` - Schermata errore per token invalidi
- `client/src/components/AuthWrapper.tsx` - Wrapper per controllo autenticazione

### File Modificati
- `client/src/services/authService.ts` - Gestione completa autenticazione JWT
- `client/src/types/game.ts` - Aggiunto stato `auth` a GameState
- `client/src/hooks/use-game-store.tsx` - Integrazione autenticazione nello stato
- `client/src/App.tsx` - Wrapper AuthWrapper per controllo globale

## Come Funziona

### Modalità Test (`?test=1`)
- Token opzionale, se mancante ne viene generato uno fake
- Permette sviluppo locale senza token reale

### Modalità Production (`test=0` o assente)
- Token obbligatorio tramite parametro `?t=JWT_TOKEN`
- Se mancante o invalido: schermata di errore
- Token viene validato (struttura, scadenza)

### Validazione JWT
- Controllo struttura (header.payload.signature)
- Decodifica payload
- Verifica scadenza (`exp`)
- Predisposta per futura verifica firma

### Persistenza
- Token salvato in localStorage per mantere login
- Associato all'utente corrente (da payload JWT o ultimo profilo)

## Test

### Modalità Test
```
http://localhost:5000/?test=1
```

### Modalità Production con Token
```
http://localhost:5000/?t=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Test

### Modalità Test
```
http://localhost:5000/?test=1
```

### Modalità Production con Token (da piattaforma esterna)
```
http://localhost:5000/?t=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Test Errore (modalità production senza token)
```
http://localhost:5000/
```

## Casi d'Uso Platform Integration

### Scenario 1: Primo accesso da piattaforma
```
// URL: https://external-platform.com/launch?game=lecce&t=JWT_TOKEN
// Redirect: http://localhost:5000/?t=JWT_TOKEN
// Risultato: Usa JWT_TOKEN, lo salva localmente
```

### Scenario 2: Ricarica pagina durante il gioco
```
// URL originale: http://localhost:5000/?t=JWT_TOKEN
// Ricarica: http://localhost:5000/ (senza params)
// Risultato: Usa token locale salvato (evita perdita sessione)
```

### Scenario 3: Nuovo token da piattaforma
```
// Token locale: esistente
// URL: http://localhost:5000/?t=NEW_JWT_TOKEN
// Risultato: Usa NEW_JWT_TOKEN (sempre priorità URL per sessioni esterne)
```

## API Helper Functions

- `getCurrentTokenInfo()` - Info su token locale per debug
- `validateJWT(token)` - Validazione completa token
