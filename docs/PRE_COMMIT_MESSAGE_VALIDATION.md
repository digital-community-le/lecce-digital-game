# Pre-commit Message Validation

## Overview

Il progetto utilizza hook Git per validare il formato dei messaggi di commit secondo lo standard [Conventional Commits](https://www.conventionalcommits.org/).

## Formato Richiesto

```
type(scope): description
```

### Tipi Disponibili

- `feat`: Nuova funzionalità
- `fix`: Correzione di bug
- `docs`: Modifiche alla documentazione
- `style`: Modifiche di stile (formattazione, etc.)
- `refactor`: Refactoring del codice
- `test`: Aggiunta o modifica di test
- `chore`: Manutenzione e task di supporto

## Esempi Validi

```bash
feat(auth): add user login system
fix: resolve memory leak in game loop
docs(api): add endpoint examples
style: fix indentation in components
refactor(db): optimize query performance
test: add unit tests for auth service
chore: update dependencies
```

## Helper Script

Se ricevi un errore di formato commit, puoi consultare la guida completa:

```bash
npm run commit-help
```

## Regole

- La descrizione deve essere 1-50 caratteri
- Usa minuscole per tipo e descrizione
- Lo scope è opzionale ma raccomandato
- Usa il presente imperativo ("add" non "added")

## Eccezioni Automatiche

I seguenti tipi di commit vengono **automaticamente accettati** senza validazione del formato:

### Merge Commits
```bash
Merge branch 'feature/new-feature' into main
Merge pull request #123 from user/feature
```

### Revert Commits
```bash
Revert "feat: add new feature"
Revert "Previous commit message"
```

### Squash and Merge
```bash
feat: add new feature (#123)
```

### Altri Messaggi Automatici
- `Initial commit`
- `fixup!` commits
- `squash!` commits
- Messaggi che iniziano con `Merge`
- Messaggi che iniziano con `Revert`

Questi messaggi vengono generati automaticamente da Git o da piattaforme come GitHub e non richiedono il formato Conventional Commits.

## Come Correggere un Commit

Se il tuo commit viene rifiutato, puoi correggerlo con:

```bash
git commit --amend -m "nuovo messaggio corretto"
```

## File Coinvolti

- `.husky/commit-msg` - Hook per validazione del formato con eccezioni automatiche
- `scripts/commit-help.js` - Script di aiuto per i formati
- `package.json` - Script npm `commit-help`

## Bypass (Solo in Emergenza)

**⚠️ Sconsigliato**: In caso di emergenza puoi bypassare la validazione:

```bash
git commit -m "messaggio" --no-verify
```

Nota: Le eccezioni automatiche riducono la necessità di usare `--no-verify` per i merge e revert.

## Testing della Validazione

Per testare se un messaggio è valido senza fare commit:

```bash
echo "feat: test message" | .husky/commit-msg
```
