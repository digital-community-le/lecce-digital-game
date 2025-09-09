# GitHub Actions Workflows

Questo repository utilizza una strategia ottimizzata di GitHub Actions per eliminare ridondanze e migliorare l'efficienza.

## 🚀 Quick Start

### Per Sviluppatori

```bash
# PR normale
git checkout -b feature/my-feature
git commit -m "feat: add new component"
gh pr create

# PR con test completi
gh pr create --label "comprehensive-test"

# PR con preview deploy
gh pr create --label "preview-deploy"

# Release (automatic con conventional commits)
git commit -m "feat: major feature"
git push origin main  # → Release Please gestisce tutto
```

### Labels Utili

- `comprehensive-test` - Test completi + coverage
- `preview-deploy` - Deploy preview Firebase
- `docs-only` - Auto-rilevato per docs

## 📋 Workflows

| Workflow                            | Trigger          | Scopo            | Durata    |
| ----------------------------------- | ---------------- | ---------------- | --------- |
| `release-please.yml`                | Push main        | Release + Deploy | 1-6 min   |
| `ci.yml`                            | PR               | Validation       | 2-5 min   |
| `docs-config-only.yml`              | Docs changes     | Fast validation  | 30s-2 min |
| `firebase-hosting-pull-request.yml` | PR (auto)        | Preview deploy   | 3-4 min   |
| `full-test.yml`                     | Manual/Scheduled | Complete testing | 8-12 min  |

## 🎯 Benefici

- **-67% pipeline ridondanti** eliminati
- **Deploy controllati** solo su release
- **Feedback veloce** per PR standard
- **Test approfonditi** on-demand

## 📚 Documentazione Completa

- [Strategia Workflows](./WORKFLOWS_STRATEGY.md)
- [Ottimizzazione Pipeline](./GITHUB_ACTIONS_OPTIMIZATION.md)
- [Release Management](./AUTOMATIC_VERSIONING.md)

---

_Per dettagli tecnici completi, vedi la documentazione nella cartella `/docs`._
