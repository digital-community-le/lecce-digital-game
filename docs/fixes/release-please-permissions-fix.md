# Fix Release Please Issues

## 🚨 Problemi Risolti

### 1. Action Deprecata

- ❌ **Prima**: `google-github-actions/release-please-action@v4` (deprecata)
- ✅ **Dopo**: `googleapis/release-please-action@v4` (ufficiale)

### 2. Permessi Insufficienti

**Aggiunto** nel workflow:

```yaml
permissions:
  contents: write
  pull-requests: write
  actions: write # ← Nuovo
  checks: write # ← Nuovo
  statuses: write # ← Nuovo
```

## 🔧 Configurazione Repository Required

**IMPORTANTE**: Devi anche verificare le impostazioni del repository GitHub:

### Passo 1: Repository Settings

1. Vai su **GitHub.com** → Repository → **Settings**
2. Scorri fino a **Actions** → **General**
3. Assicurati che sia selezionato:
   - ✅ **"Allow GitHub Actions to create and approve pull requests"**

### Passo 2: Branch Protection (se attive)

Se hai branch protection rules su `main`:

1. **Settings** → **Branches** → **main**
2. Verifica che **"Allow force pushes"** sia disabilitato
3. In **"Restrict pushes that create files"** aggiungi:
   - `CHANGELOG.md`
   - `package.json`
   - `package-lock.json`

## 🎯 Test del Fix

Una volta applicate le configurazioni:

```bash
# Test commit che dovrebbe triggerare release
git commit -m "feat: test release-please fix"
git push origin main
```

Il workflow dovrebbe ora:

1. ✅ Eseguire pre-validation
2. ✅ Creare/aggiornare PR di release
3. ✅ Non fallire con errori di permessi

## 🐛 Troubleshooting

### Se persiste "not permitted to create PR":

1. Controlla **Repository Settings** → **Actions** → **General**
2. Assicurati che **"Allow GitHub Actions to create and approve pull requests"** sia ✅
3. Verifica che il token `GITHUB_TOKEN` abbia i permessi giusti (automatico)

### Se fallisce "googleapis/release-please-action":

- Action aggiornata alla versione ufficiale
- Dovrebbe risolvere problemi di deprecazione

### Se ci sono conflitti di branch protection:

- Temporaneamente disabilita strict branch protection
- Oppure configura exceptions per release-please

---

_Fix applicato: 10 Settembre 2025_
