# Test Mirati e Ottimizzazioni CI

Questo documento spiega come il progetto utilizza test mirati per ottimizzare i tempi di esecuzione nella CI/CD pipeline.

## 🎯 Strategia dei Test Mirati

### Principio
Invece di eseguire tutti i test per ogni modifica, il sistema identifica e esegue solo i test correlati ai file modificati.

### Benefici
- ⚡ **Feedback più veloce**: Riduce i tempi di CI/CD
- 💰 **Costi ridotti**: Meno utilizzo di risorse CI
- 🔄 **Iterazioni più rapide**: Sviluppo più fluido
- 🎯 **Test mirati**: Focus sui cambiamenti effettivi

## 🔍 Come Funziona

### Rilevamento File Modificati
1. **Sviluppo locale**: Analizza file staged + unstaged
2. **CI/CD**: Confronta con la branch di base (origin/main)
3. **Filtraggio**: Include solo file testabili (*.ts, *.tsx, test files)

### Ricerca Test Correlati
Per ogni file modificato, cerca test in:
- Stessa directory: `Component.test.tsx`
- Subdirectory `__tests__/`: `__tests__/Component.test.tsx`
- Directory parallela: `test/components/Component.test.tsx`

## 📋 Script Disponibili

| Script | Descrizione | Uso |
|--------|-------------|-----|
| `npm run test:changed` | Test solo file modificati | Sviluppo quotidiano |
| `npm run test:changed:full` | Forza test completi | Quando servono tutti i test |
| `npm run test:perf` | Analizza performance test | Monitoraggio ottimizzazioni |
| `npm run test:perf:report` | Report performance | Visualizza statistiche |

## 🔄 Workflow CI/CD

### Pull Request (Ottimizzato)
```yaml
- name: Run targeted tests (PR optimization)
  run: CI=true npm run test:changed
```
- ✅ Esegue solo test correlati ai file modificati
- ⚡ Feedback rapido per sviluppatori
- 🔄 Ideale per iterazioni frequenti

### Merge to Main (Completo)
```yaml
- name: Run full test suite (production deployment)
  run: npm run test:run
```
- ✅ Esegue TUTTI i test prima del deploy
- 🛡️ Sicurezza massima per produzione
- 🎯 Zero compromessi sulla qualità

### Full Test Workflow
- 📅 **Schedule**: Ogni domenica alle 2 AM
- 🔧 **Manual trigger**: Workflow_dispatch
- 🧪 **Comprehensive**: Test su Node.js 20.x e 22.x

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
