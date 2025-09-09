# Fix per errore "Resource not accessible by integration" nel deployment

## Problema

Il workflow di deployment stava fallendo con l'errore:

```
Unhandled error: HttpError: Resource not accessible by integration
```

## Causa

L'errore era causato da problemi di permessi GitHub Actions nel workflow `auto-merge-release.yml`. Specificamente:

1. **API `enableAutoMerge`**: Questa API richiede permessi speciali che potrebbero non essere sempre disponibili
2. **Permessi insufficienti**: Il workflow aveva permessi limitati per alcune operazioni
3. **Logica complessa**: Il fallback tra auto-merge e merge diretto creava potenziali race conditions

## Soluzione implementata

### 1. Semplificazione della logica di merge

**File modificato**: `.github/workflows/auto-merge-release.yml`

**Prima** (logica complessa con fallback):

```yaml
# 2. Enable auto-merge
try {
  await github.rest.pulls.enableAutoMerge({...});
  // commenti di successo
} catch (autoMergeError) {
  // 3. Fallback: Direct merge
  await github.rest.pulls.merge({...});
  // commenti di fallback
}
```

**Dopo** (logica diretta):

```yaml
# 2. Direct merge (simplified approach)
await github.rest.pulls.merge({
  owner: context.repo.owner,
  repo: context.repo.repo,
  pull_number: prNumber,
  merge_method: 'squash',
  commit_title: `🚀 Release: ${prInfo.title}`,
  commit_message: 'Automatically merged by Release workflow'
});
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
