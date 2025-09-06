# Service Worker Cache Versioning

## Panoramica

Il sistema di cache versioning garantisce che gli utenti ricevano sempre la versione più aggiornata dell'applicazione dopo un deployment. Questo risolve i problemi comuni delle PWA dove il Service Worker può servire contenuti obsoleti dalla cache.

## Come Funziona

### 1. Placeholder System

Il file `public/sw.js` contiene un placeholder `%%CACHE_VERSION%%` che viene sostituito durante il build:

```javascript
const CACHE_VERSION = '%%CACHE_VERSION%%';
const CACHE_NAME = `ldc-game-v${CACHE_VERSION}`;
```

### 2. Build Script

Lo script `scripts/build-sw-version.js` gestisce la sostituzione:

- **Update**: Sostituisce il placeholder con un timestamp
- **Restore**: Ripristina il placeholder per lo sviluppo

### 3. Script NPM

I seguenti script sono disponibili:

```bash
# Build completo con versioning automatico
npm run build

# Solo aggiornamento della versione SW
npm run build:sw

# Ripristino del placeholder per development
npm run restore:sw
```

## Funzionalità del Service Worker

### Cache Invalidation

- **Automatic**: Cancella automaticamente le cache vecchie durante l'attivazione
- **Selective**: Mantiene solo la cache con la versione corrente
- **Force Update**: Possibilità di forzare l'aggiornamento via messaggio

### Client Communication

Il Service Worker comunica con il client tramite eventi:

```javascript
// Notifica di aggiornamento disponibile
{
  type: 'SW_UPDATED',
  payload: {
    version: '1234567890',
    message: 'Una nuova versione è disponibile!'
  }
}
```

### Message API

Il Service Worker risponde ai seguenti messaggi:

- `SKIP_WAITING`: Attiva immediatamente il nuovo SW
- `FORCE_UPDATE`: Cancella tutte le cache e ricarica
- `CHECK_VERSION`: Restituisce la versione corrente

## Hook React

### useServiceWorker

Hook personalizzato per gestire il Service Worker:

```tsx
import { useServiceWorker } from './hooks/useServiceWorker';

function App() {
  const {
    isUpdateAvailable,
    forceUpdate,
    checkForUpdates,
    currentVersion
  } = useServiceWorker();

  return (
    <div>
      {isUpdateAvailable && (
        <button onClick={forceUpdate}>
          Aggiorna App
        </button>
      )}
    </div>
  );
}
```

### Componente UpdateNotification

Componente UI per notificare gli aggiornamenti:

```tsx
import { UpdateNotification } from './components/ui/UpdateNotification';

<UpdateNotification
  isUpdateAvailable={isUpdateAvailable}
  onUpdate={forceUpdate}
  onDismiss={() => setDismissed(true)}
  isUpdating={isUpdating}
/>
```

## Development vs Production

### Development Mode

- Service Worker è **disabilitato** per evitare caching
- Hot Module Replacement funziona normalmente
- Nessuna interferenza con il development workflow

### Production Mode

- Service Worker attivo con caching intelligente
- Versioning automatico ad ogni build
- Update notification per gli utenti

## Cache Strategy

### Network First con Fallback

```javascript
// 1. Prova la rete per contenuti freschi
// 2. Fallback alla cache se offline
// 3. Aggiorna la cache in background
```

### Risorse Cachate

- **Core Files**: HTML, CSS, JS dell'app
- **Assets**: Immagini, icone, manifest
- **API Responses**: (con TTL appropriato)

## Workflow di Deployment

### 1. Pre-Build

```bash
# Il placeholder è presente nel repository
const CACHE_VERSION = '%%CACHE_VERSION%%';
```

### 2. Build Process

```bash
npm run build
# → Aggiorna SW version (timestamp)
# → Compila l'applicazione
# → Bundle per produzione
```

### 3. Post-Deployment

```bash
# Gli utenti ricevono notification di aggiornamento
# Cache vecchia viene invalidata automaticamente
```

## Testing

### Simulare Aggiornamenti

```javascript
// In browser console
navigator.serviceWorker.controller.postMessage({
  type: 'FORCE_UPDATE'
});
```

### Verificare Cache Version

```javascript
navigator.serviceWorker.controller.postMessage(
  { type: 'CHECK_VERSION' },
  [channel.port2]
);
```

## Troubleshooting

### Cache Bloccata

Se la cache non si aggiorna:

1. Controlla la console per errori del SW
2. Verifica che la versione sia cambiata
3. Usa "Force Update" dal componente UI
4. In caso estremo: cancella dati sito dal browser

### Service Worker Non Registrato

Verifica che:
- `import.meta.env.PROD` sia true in produzione
- Il file `sw.js` sia accessibile
- Non ci siano errori di registrazione

## Best Practices

### 1. Version Strategy

- Usa timestamp per versioni uniche
- Considera semantic versioning per release importanti
- Mantieni il placeholder nel repository

### 2. User Experience

- Mostra sempre notifiche di aggiornamento
- Permetti di rimandare l'aggiornamento
- Fornisci feedback durante l'update

### 3. Cache Management

- Cancella cache obsolete regolarmente
- Mantieni cache size ragionevole
- Usa TTL appropriati per API responses

## Sicurezza

### Content Security Policy

Assicurati che il CSP permetta il Service Worker:

```http
Content-Security-Policy: worker-src 'self'
```

### Origin Verification

Il Service Worker funziona solo su HTTPS (eccetto localhost).

## Performance

### Bundle Size

Il versioning automatico non impatta le dimensioni del bundle.

### Network Requests

- First load: Normale network request
- Subsequent loads: Cache-first strategy
- Updates: Background fetch
