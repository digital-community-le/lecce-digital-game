#!/usr/bin/env node

/**
 * Script per mostrare esempi di messaggi di commit validi
 * Uso: npm run commit-help
 */

console.log(`
🚀 COMMIT MESSAGE HELPER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 FORMATO RICHIESTO:
   type(scope): description

🏷️  TIPI DISPONIBILI:

   • feat     - Nuova funzionalità
              Esempio: feat(auth): add user login system
              Esempio: feat(ui): implement dark mode toggle

   • fix      - Correzione di bug  
              Esempio: fix: resolve memory leak in game loop
              Esempio: fix(api): handle null user response

   • docs     - Modifiche alla documentazione
              Esempio: docs: update installation guide
              Esempio: docs(api): add endpoint examples

   • style    - Modifiche di stile (formattazione, etc.)
              Esempio: style: fix indentation in components
              Esempio: style(css): improve button hover effects

   • refactor - Refactoring del codice
              Esempio: refactor: simplify user validation logic
              Esempio: refactor(db): optimize query performance

   • test     - Aggiunta o modifica di test
              Esempio: test: add unit tests for auth service
              Esempio: test(e2e): improve game flow testing

   • chore    - Manutenzione e task di supporto
              Esempio: chore: update dependencies
              Esempio: chore(ci): improve build pipeline

📏 REGOLE:
   • La descrizione deve essere 1-50 caratteri
   • Usa minuscole per tipo e descrizione  
   • Lo scope è opzionale ma raccomandato
   • Usa il presente imperativo ("add" non "added")

✅ ESEMPI SPECIFICI PER QUESTO PROGETTO:
   feat(challenges): add new guild builder challenge
   fix(ui): resolve button styling in dark mode
   docs(readme): update development setup guide
   refactor(game): simplify state management logic
   test(challenges): add comprehensive test suite
   chore(deps): update react and typescript versions

🔄 PER CORREGGERE UN COMMIT:
   git commit --amend -m "nuovo messaggio corretto"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
