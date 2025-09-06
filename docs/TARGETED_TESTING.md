# Test Stratificati e Ottimizzazioni CI

Questo documento spiega come il progetto utilizza una strategia di test stratificata per ottimizzare qualità e performance.

## 🎯 Strategia dei Test Stratificati

### Principi Fondamentali
Il sistema distingue tra tre livelli di test con scopi e trigger diversi:

1. **🔧 Unit Tests**: Test isolati per singoli componenti/funzioni
2. **🔗 Integration Tests**: Test per verificare interazioni tra componenti
3. **🌐 E2E Tests**: Test completi del flusso utente end-to-end

### Benefici della Stratificazione
- ⚡ **Feedback graduale**: Unit test veloci → Integration → E2E completi
- 🎯 **Testing mirato**: Ogni livello ha trigger specifici
- � **Ottimizzazione risorse**: Esegue solo ciò che serve
- 🛡️ **Sicurezza progressiva**: Più livelli = più protezione

## � Matrice dei Test per Tipologia

### 🔧 Unit Tests
| Trigger | Quando | Cosa Testa |
|---------|---------|------------|
| File modificati | Sempre | Solo test correlati ai file cambiati |
| Pre-commit | Sempre | Unit test per file staged |
| PR Review | Sempre | Unit test mirati per diff |

### 🔗 Integration Tests  
| Trigger | Quando | Cosa Testa |
|---------|---------|------------|
| Servizi modificati | `src/services/`, `src/hooks/`, `src/context/` | Tutti gli integration test |
| Config changes | `package.json`, `vite.config.ts`, etc. | Tutti gli integration test |
| Forced execution | `--integration` flag | Tutti gli integration test |
| Production deploy | Merge to main | Tutti gli integration test |

### 🌐 E2E Tests
| Trigger | Quando | Cosa Testa |
|---------|---------|------------|
| Pages modificate | `src/pages/`, `src/App.tsx` | Tutti gli E2E test |
| API changes | `server/routes.ts`, `server/index.ts` | Tutti gli E2E test |
| Forced execution | `--e2e` flag | Tutti gli E2E test |
| Production deploy | Merge to main | Tutti gli E2E test |

## 🏗️ Struttura delle Directory

```
client/src/
├── components/
│   └── __tests__/              # Unit tests per componenti
├── services/
│   └── __tests__/              # Unit tests per servizi
├── __integration__/            # Integration tests
│   ├── auth.integration.test.tsx
│   ├── game-system.integration.test.tsx
│   └── api.integration.test.tsx
└── __e2e__/                   # End-to-end tests
    ├── user-journeys.e2e.test.tsx
    ├── pwa-features.e2e.test.tsx
    └── offline-sync.e2e.test.tsx
```

## 📋 Script Disponibili

### Smart Test Runner (Raccomandato)
| Script | Descrizione | Uso |
|--------|-------------|-----|
| `npm run test:smart` | Strategia automatica basata su file modificati | Sviluppo quotidiano |
| `npm run test:smart:unit` | Solo unit tests per file modificati | Feedback veloce |
| `npm run test:smart:integration` | Forza tutti gli integration tests | Verifica integrazioni |
| `npm run test:smart:e2e` | Forza tutti gli E2E tests | Test flussi completi |
| `npm run test:smart:all` | Tutti i test (unit + integration + e2e) | Deploy produzione |

### Legacy Scripts (Ancora disponibili)
| Script | Descrizione |
|--------|-------------|
| `npm run test:changed` | Solo unit test per file modificati |
| `npm run test:run` | Tutti i test senza stratificazione |

## 🔄 Workflow CI/CD Ottimizzati

### Pull Request Strategy
```yaml
- name: Run smart test strategy (PR optimization)
  run: CI=true npm run test:smart
```
**Comportamento**:
- Unit tests: Solo per file modificati
- Integration tests: Solo se ci sono cambiamenti a servizi/config
- E2E tests: Solo se ci sono cambiamenti a pagine/API

### Production Deploy Strategy
```yaml
- name: Run complete test suite (production deployment)
  run: npm run test:smart:all
```
**Comportamento**:
- Unit tests: TUTTI
- Integration tests: TUTTI  
- E2E tests: TUTTI

### Development Strategy (Local)
```bash
# Pre-commit hook
npm run test:smart -- --unit-only  # Solo unit test veloci

# Before push
npm run test:smart                  # Strategia automatica

# Before release
npm run test:smart:all             # Tutti i test
```

## 💡 Esempi Pratici

### Modifica un Componente
```bash
# Modifichi: src/components/Button.tsx
# Il sistema trova e esegue: src/components/__tests__/Button.test.tsx
npm run test:changed
```

### Modifica solo CSS
```bash
# Modifichi: src/index.css
# Nessun test da eseguire, skip automatico
npm run test:changed
# Output: "No testable files changed, skipping tests"
```

### Aggiungi nuovo Test
```bash
# Modifichi: src/components/__tests__/NewComponent.test.tsx
# Esegue direttamente il nuovo test
npm run test:changed
```

## 📊 Monitoraggio Performance

### Visualizza Statistiche
```bash
npm run test:perf:report
```

Output esempio:
```
📈 Performance Report:
   Targeted tests avg: 1,200ms
   Full tests avg: 8,500ms
   Speedup: 7.08x faster
   Time saved: 7,300ms per run
```

### Raccogli Nuovi Dati
```bash
# Test entrambi i metodi e confronta
npm run test:perf

# Solo test mirati
npm run test:perf -- --targeted

# Solo test completi
npm run test:perf -- --full
```

## 🛠️ Configurazione Avanzata

### Forzare Test Completi
Se sospetti che i test mirati abbiano mancato qualcosa:

```bash
# Locale
npm run test:changed:full

# CI (tramite environment variable)
FORCE_FULL_TESTS=true npm run test:changed
```

### Debug Test Mirati
```bash
# Vedere quali file vengono analizzati
DEBUG=true npm run test:changed
```

### Personalizzare Pattern di Test
Modifica `scripts/test-changed.js`:
```javascript
const TEST_PATTERNS = ['.test.', '.spec.', '__tests__', '.e2e.'];
```

## 🔧 Integrazione con Editor

### VS Code Tasks
Aggiungi a `.vscode/tasks.json`:
```json
{
  "label": "Test Changed Files",
  "type": "shell",
  "command": "npm run test:changed",
  "group": "test",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared"
  }
}
```

### Pre-commit Hook
Il sistema è integrato automaticamente:
```bash
git commit -m "feat: new component"
# Esegue automaticamente test mirati sui file staged
```

## 🎯 Best Practices

### ✅ Quando Usare Test Mirati
- Sviluppo quotidiano
- Pull Request reviews
- Feedback rapido durante coding
- Iterazioni frequenti

### ✅ Quando Usare Test Completi
- Deploy in produzione
- Release candidate
- Dopo merge di feature importanti
- Verification periodica (scheduled)

### ⚠️ Limitazioni
- **Dipendenze indirette**: Potrebbe non rilevare test che dipendono indirettamente dai file modificati
- **File di configurazione**: Modifiche a config files potrebbero richiedere test completi
- **Refactoring massicci**: Meglio usare test completi

### 💡 Raccomandazioni
1. **Struttura test chiara**: Mantieni test vicini al codice sorgente
2. **Naming convention**: Usa `.test.` o `.spec.` nei nomi file
3. **Test isolati**: Evita dipendenze tra test files
4. **Monitoring regolare**: Controlla le performance con `npm run test:perf:report`

## 🐛 Troubleshooting

### Test Mirati Non Trova File
```bash
# Verifica pattern di ricerca
DEBUG=true npm run test:changed

# Forza test completi come fallback
npm run test:changed:full
```

### Performance Degradate
```bash
# Analizza le statistiche
npm run test:perf:report

# Verifica se i test sono diventati più lenti
npm run test:perf
```

### False Positives/Negatives
Se i test mirati non rilevano cambiamenti importanti:
1. Verifica la struttura delle directory
2. Controlla i pattern di test
3. Usa test completi per verification critica
