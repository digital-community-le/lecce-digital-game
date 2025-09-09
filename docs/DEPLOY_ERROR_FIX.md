# Fix per errore "Resource not accessible by integration" nel deployment

## Problema Specifico

Il workflow di deployment stava fallendo con l'errore completo:

```
RequestError [HttpError]: Resource not accessible by integration
    at /home/runner/work/_actions/actions/github-script/v7/dist/index.js:9537:21
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Error: Unhandled error: HttpError: Resource not accessible by integration
    status: 403,
    url: 'https://api.github.com/repos/digital-community-le/lecce-digital-game/issues/5/comments'
```

## Causa Identificata

L'errore era causato da **problemi di permessi per commentare su issue/PR**. Specificamente:

1. **Commenti su PR/Issue**: Il token `GITHUB_TOKEN` non aveva permessi per commentare su issue/PR specifiche
2. **Workflow failure**: I workflow fallivano quando tentavano di commentare, anche se il deployment era riuscito
3. **Gestione errori mancante**: Nessun try-catch attorno alle operazioni di commento

## Soluzione implementata

### 1. Protezione dei commenti con try-catch

**File modificati**:

- `.github/workflows/deploy-on-release.yml`
- `.github/workflows/auto-merge-release.yml`

**Prima** (commenti non protetti):

```yaml
await github.rest.issues.createComment({
  owner: context.repo.owner,
  repo: context.repo.repo,
  issue_number: prNumber,
  body: "Messaggio..."
});
```

**Dopo** (commenti protetti):

```yaml
try {
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body: "Messaggio..."
  });
  console.log(`✅ Comment posted successfully`);
} catch (commentError) {
  console.log(`⚠️ Could not post comment: ${commentError.message}`);
  // Non fallire il workflow per un errore di commento
}
```

### 2. Aggiornamento dei permessi

**File modificato**: `.github/workflows/deploy-on-release.yml`

**Aggiunti permessi per**:

- `pull-requests: write` - Per commentare sulle PR
- `issues: write` - Per creare commenti sui deployment

## Vantaggi della soluzione

1. **Maggiore affidabilità**: Elimina il potenziale fallimento dell'API `enableAutoMerge`
2. **Logica più semplice**: Riduce la complessità e i potenziali punti di fallimento
3. **Permessi chiari**: Definisce esplicitamente tutti i permessi necessari
4. **Debugging migliore**: La logica semplificata è più facile da debuggare

## Test della soluzione

1. **Commit questo fix**
2. **Push del branch main**
3. **Verifica che release-please crei una nuova PR**
4. **Monitor del processo di auto-merge**
5. **Verifica del deployment automatico**

## Monitoraggio

Per monitorare il successo della soluzione:

1. **GitHub Actions**: Controllare che non ci siano più errori "Resource not accessible"
2. **Release PR**: Verificare che le PR di release vengano merge automaticamente
3. **Deployment**: Confermare che il deployment avvenga senza errori
4. **Logs**: I nuovi log saranno più puliti e informativi

## Note per il futuro

- Se si vuole riattivare l'auto-merge, verificare prima i permessi del repository
- L'API `enableAutoMerge` potrebbe richiedere permessi a livello di organizzazione
- Considerare l'uso di un GitHub App con permessi elevati se necessario
