# Guida ai Permessi GitHub Actions per Commenti

## Opzioni per garantire permessi di commento

### 1. Configurazione Repository Settings (RACCOMANDATO)

#### A. Permissions per GitHub Actions

1. Vai su **Repository Settings** → **Actions** → **General**
2. Nella sezione **Workflow permissions** seleziona:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

Questo darà al `GITHUB_TOKEN` i permessi necessari per:

- Commentare su issue e PR
- Creare e approvare PR
- Leggere e scrivere contenuti del repository

#### B. Verifica permessi fork

Se stai lavorando con fork:

- Assicurati che **"Allow actions and reusable workflows"** sia abilitato
- Verifica che **"Fork pull request workflows from outside collaborators"** sia configurato correttamente

### 2. Utilizzo di Personal Access Token (PAT)

#### Creazione PAT

1. Vai su **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Crea un nuovo token con questi scopes:
   ```
   repo                 # Full control of private repositories
   write:discussion     # Write access to discussions
   ```

#### Configurazione nel repository

1. Vai su **Repository Settings** → **Secrets and variables** → **Actions**
2. Aggiungi un nuovo **Repository secret**:
   ```
   Name: COMMENT_TOKEN
   Value: [il tuo PAT]
   ```

#### Modifica workflow per usare PAT

```yaml
- name: Comment on PR
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.COMMENT_TOKEN }} # Invece di GITHUB_TOKEN
    script: |
      await github.rest.issues.createComment({...});
```

### 3. GitHub App (Soluzione Enterprise)

#### Vantaggi

- Permessi più granulari
- Non legato a un utente specifico
- Migliore per organizzazioni

#### Setup

1. Crea una GitHub App nelle settings dell'organizzazione
2. Configura i permessi necessari:
   - Issues: Write
   - Pull requests: Write
   - Contents: Read
3. Installa l'app nel repository
4. Usa l'App ID e private key nei secrets

### 4. Verifica Stato Corrente

Per verificare i permessi attuali del tuo repository:

```bash
# Controlla le impostazioni via API (richiede autenticazione)
curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/repos/digital-community-le/lecce-digital-game
```

## Implementazione Immediata

### Soluzione Rapida: Repository Settings

1. **Vai alle impostazioni del repository**:

   ```
   https://github.com/digital-community-le/lecce-digital-game/settings/actions
   ```

2. **Configura Workflow permissions**:
   - [x] Read and write permissions
   - [x] Allow GitHub Actions to create and approve pull requests

3. **Salva le modifiche**

### Test della soluzione

Dopo aver applicato i permessi, testa con un commit minore:

```yaml
# Test workflow per verificare permessi
name: Test Permissions
on:
  workflow_dispatch:
jobs:
  test-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Test comment permission
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            console.log('Testing comment permissions...')
            // Testa i permessi senza creare effettivamente commenti
```

## Raccomandazione

**Per il tuo progetto**, consiglio di:

1. ✅ **Primo step**: Configurare "Read and write permissions" nelle repository settings
2. ✅ **Mantenere**: I try-catch che abbiamo implementato (per resilienza)
3. ✅ **Verificare**: Che i workflow funzionino correttamente dopo il cambio
4. ⚠️ **Fallback**: Se il primo step non funziona, passare a PAT

Questo approccio garantisce:

- ✅ Funzionalità completa dei commenti
- ✅ Resilienza in caso di problemi temporanei
- ✅ Semplicità di configurazione
- ✅ Sicurezza (permessi limitati al repository)
