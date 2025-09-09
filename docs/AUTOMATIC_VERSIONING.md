# Sistema di Versionamento Automatico

## Panoramica

Il sistema di versionamento automatico dell'applicazione utilizza **release-please** per gestire automaticamente versioni semantic e release notes, completamente integrato lato client senza dipendenze server.

## Componenti del Sistema

### 1. Release-Please Integration

- **File**: `.github/workflows/release-please.yml`
- **Configurazione**: `.release-please-config.json`
- **Funzionalità**:
  - Generazione automatica release notes
  - Versionamento semantic basato su conventional commits
  - Creazione tag Git automatici
  - Deploy automatico al rilascio

### 2. Version Injection Build Process

- **Script**: `scripts/inject-version.js`
- **Comandi NPM**:
  - `npm run inject:version` - Inject manuale delle versioni
  - `npm run build` - Build con version injection
  - `npm run build:prod` - Build production con versioning completo

#### Cosa viene generato:

- **`.env.production`**: Variabili ambiente per Vite
- **`client/src/version.ts`**: File TypeScript con informazioni versione
- **`public/manifest.json`**: Manifest PWA aggiornato

### 3. VersionService Client-Side

- **File**: `client/src/services/versionService.ts`
- **Funzionalità**:
  - Rilevamento versione corrente
  - Controllo aggiornamenti tramite Service Worker
  - Controllo aggiornamenti tramite manifest fetch
  - Gestione applicazione aggiornamenti

### 4. Hook React

- **File**: `client/src/hooks/useVersionCheck.ts`
- **Caratteristiche**:
  - Controllo automatico periodico
  - Gestione stato aggiornamenti
  - Notifiche callback
  - Dismissione temporanea

### 5. Componenti UI

- **UpdateNotification**: Dialog per notificare aggiornamenti
- **VersionManager**: Provider React per context globale
- **VersionInfo**: Componente per mostrare versione corrente
- **CheckUpdateButton**: Pulsante controllo manuale

### 6. Service Worker Integration

- **File**: `public/sw.js`
- **Nuove funzionalità**:
  - `CHECK_VERSION`: Controllo versione tramite SW
  - `VERSION_CHECK_RESULT`: Risposta controllo versione
  - `checkForAppUpdate()`: Funzione controllo manifest

## Workflow di Versionamento

### Sviluppo

1. Commit con conventional commits format
2. Build locale: `npm run build` (mantiene placeholder SW)
3. Test e sviluppo normale

### Release Automatico

1. Push su `main` branch
2. Release-please analizza commit dalla last release
3. Se trova commit `feat/fix/etc`, crea PR di release
4. Merge PR → trigger deploy automatico con versioning

### Deploy Process

1. `scripts/inject-version.js` - Estrae info da package.json e Git
2. Aggiorna manifest.json, crea .env.production e version.ts
3. `scripts/build-sw-version.js update` - Aggiorna Service Worker
4. Build Vite con variabili ambiente iniettate
5. Deploy Firebase con versione completa

## Configurazione Release-Please

### Tipi di Commit Supportati

- `feat`: Nuove funzionalità → minor version bump
- `fix`: Bug fixes → patch version bump
- `perf`: Performance improvements → patch version bump
- `docs`: Documentazione → no version bump
- `style`: Stili → no version bump
- `refactor`: Refactoring → no version bump
- `test`: Test → no version bump
- `chore`: Manutenzione → no version bump

### Generazione Changelog

Changelog automatico organizzato per sezioni:

- Features
- Bug Fixes
- Performance Improvements
- Documentation
- Code Refactoring
- Tests
- Miscellaneous

## Utilizzo Client-Side

### Provider Setup

```tsx
import { VersionManagerProvider } from '@/components/VersionManager';

function App() {
  return (
    <VersionManagerProvider
      options={{
        autoCheck: true,
        checkInterval: 60000,
      }}
    >
      <YourApp />
    </VersionManagerProvider>
  );
}
```

### Hook Usage

```tsx
import { useVersionManager } from '@/components/VersionManager';

function MyComponent() {
  const { currentVersion, updateAvailable, checkForUpdates, applyUpdate } =
    useVersionManager();

  return (
    <div>
      <p>Versione: {currentVersion}</p>
      {updateAvailable && (
        <button onClick={applyUpdate}>Aggiorna Applicazione</button>
      )}
    </div>
  );
}
```

### Manual Version Check

```tsx
import { CheckUpdateButton, VersionInfo } from '@/components/VersionManager';

function Settings() {
  return (
    <div>
      <VersionInfo showBuildInfo showGitInfo />
      <CheckUpdateButton>Controlla Aggiornamenti</CheckUpdateButton>
    </div>
  );
}
```

## Rilevamento Aggiornamenti

### Metodi di Controllo

1. **Service Worker**: Controllo cache version change
2. **Manifest Fetch**: Confronto versione nel manifest.json
3. **Periodico**: Check automatico ogni 60 secondi (configurabile)
4. **Event-Based**: Listener Service Worker per nuovi deploy

### Strategia Fallback

1. Primo tentativo: Service Worker communication
2. Secondo tentativo: Manifest fetch con cache-busting
3. Gestione errori: Fallback graceful senza crash

## Testing

### Unit Tests

- `versionService.test.ts`: Test servizio versioning
- `useVersionCheck.test.ts`: Test hook React
- `UpdateNotification.test.tsx`: Test componenti UI

### Test Commands

```bash
npm run test src/services/__tests__/versionService.test.ts
npm run test src/hooks/__tests__/useVersionCheck.test.ts
npm run test src/components/__tests__/UpdateNotification.test.tsx
```

## Sicurezza e Performance

### Considerazioni Sicurezza

- Fetch con cache-busting per evitare cache stale
- Controllo origine per Service Worker
- Graceful degradation se SW non disponibile

### Performance

- Controlli non-blocking in background
- Timeout configurabili (5s default)
- Cache-busting solo quando necessario
- Minimal bundle impact

## Troubleshooting

### Debug Service Worker

```javascript
// In browser console
navigator.serviceWorker.controller?.postMessage({
  type: 'CHECK_VERSION',
});
```

### Debug Version Info

```javascript
// Check current version
console.log(window.__VERSION_INFO__);

// Force version check
versionService.checkForUpdates().then(console.log);
```

### Common Issues

1. **Service Worker non disponibile**: Sistema fallback su manifest
2. **Network error**: Graceful failure senza notifiche spam
3. **Version parsing error**: Fallback a version di default

## Estensioni Future

### Possibili Miglioramenti

- **Progressive Update**: Download in background
- **Release Notes**: Visualizzazione changelog nel UI
- **Rollback**: Meccanismo rollback a versione precedente
- **A/B Testing**: Support per feature flags basate su versione
- **Analytics**: Tracking adoption rate nuove versioni

### Hooks per Estensioni

- `onUpdateAvailable`: Callback custom per notifiche
- `onUpdateApplied`: Callback post-aggiornamento
- `onVersionMismatch`: Handling conflitti versione
