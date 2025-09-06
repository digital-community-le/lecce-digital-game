# Git Hooks e Pre-commit Testing

Questo progetto utilizza Git hooks per garantire la qualità del codice prima di ogni commit.

## � Requisiti

- **Node.js**: >=20.0.0 (richiesto da Firebase CLI v14+)
- **npm**: >=10.0.0

## �🚀 Configurazione Automatica

I Git hooks sono configurati automaticamente quando installi le dipendenze grazie a Husky:

```bash
npm install
```

## 🔍 Cosa viene verificato prima di ogni commit

### Pre-commit Hook
- **Type checking**: Verifica la correttezza dei tipi TypeScript
- **Test execution**: Esegue tutti i test con Vitest
- **File staging**: Controlla solo i file modificati (lint-staged)

### Commit Message Hook
- **Format validation**: Verifica che il messaggio segua il formato conventional commits
- **Accepted formats**:
  - `feat(scope): description` - Nuove funzionalità
  - `fix(scope): description` - Bug fix
  - `docs(scope): description` - Documentazione
  - `style(scope): description` - Formatting, stili
  - `refactor(scope): description` - Refactoring del codice
  - `test(scope): description` - Aggiunta/modifica test
  - `chore(scope): description` - Manutenzione, build

## 🧪 Testing dei Pre-commit Hooks

Puoi testare i pre-commit hooks senza fare un commit reale:

```bash
# Test completo del pre-commit
npm run test:pre-commit

# Test manuale veloce
npm run pre-commit:quick

# Solo type checking
npm run check

# Solo test
npm run test:run
```

## 📋 Script Disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run pre-commit` | Esegue type checking + test completi |
| `npm run pre-commit:quick` | Versione veloce con reporter basic |
| `npm run test:pre-commit` | Simula il pre-commit hook |
| `npm run lint-staged` | Esegue controlli sui file staged |

## 🔧 Configurazione Lint-staged

La configurazione in `package.json` specifica cosa viene controllato:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "npm run check",
      "npm run test:run --passWithNoTests --reporter=basic"
    ]
  }
}
```

## 🚨 Bypassing dei Hooks (Non raccomandato)

In casi eccezionali, puoi saltare i pre-commit hooks:

```bash
# Salta TUTTI gli hooks (non raccomandato)
git commit --no-verify -m "emergency fix"

# Salta solo il pre-commit (mantiene commit-msg)
git commit --no-verify -m "feat: emergency fix"
```

## 🐛 Troubleshooting

### Hook non funziona
```bash
# Reinstalla Husky
npm run prepare

# Verifica permissions (Unix/Mac)
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Test falliscono durante commit
```bash
# Esegui test in isolamento
npm run test:run

# Controlla errori TypeScript
npm run check

# Test specifico del pre-commit
npm run test:pre-commit
```

### Messaggio commit rifiutato
Assicurati che il messaggio segua il formato:
```
tipo(scope): descrizione

# Esempi validi:
feat: add user authentication
fix(auth): resolve login bug
docs: update API documentation
test(utils): add validation tests
```

## 🎯 Best Practices

1. **Commit frequenti**: Fai commit piccoli e frequenti
2. **Test locali**: Esegui `npm run test:pre-commit` prima di committare
3. **Messaggi chiari**: Usa messaggi commit descrittivi e nel formato corretto
4. **Fix immediati**: Se i test falliscono, fixali subito
5. **No bypass**: Evita di saltare i hooks a meno che non sia un'emergenza

## 📊 Integrazione CI/CD

I test vengono anche eseguiti nelle GitHub Actions:
- **Pull Request**: Test su ogni PR
- **Push to main**: Test + deploy
- **Scheduled**: Test quotidiani automatici

Questo garantisce doppia protezione:
1. **Local**: Pre-commit hooks
2. **Remote**: CI/CD pipeline
