#!/usr/bin/env node

/**
 * Script per verificare i permessi GitHub Actions del repository
 * Esegui con: node scripts/check-permissions.js
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔍 Verifica permessi GitHub Actions...\n');

// Verifica se siamo in un repository Git
try {
  const repoUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
  console.log(`📍 Repository: ${repoUrl}`);
} catch (error) {
  console.log('❌ Non siamo in un repository Git valido');
  process.exit(1);
}

// Estrai informazioni del repository
const repoMatch = execSync('git config --get remote.origin.url', { encoding: 'utf8' })
  .match(/github\.com[:/]([^/]+)\/([^/.]+)/);

if (!repoMatch) {
  console.log('❌ Non riesco a estrarre owner/repo dall\'URL');
  process.exit(1);
}

const [, owner, repo] = repoMatch;
console.log(`👤 Owner: ${owner}`);
console.log(`📦 Repo: ${repo}\n`);

console.log('📋 Per verificare e configurare i permessi:');
console.log('');
console.log('1. 🌐 Vai alle impostazioni del repository:');
console.log(`   https://github.com/${owner}/${repo}/settings/actions`);
console.log('');
console.log('2. 🔧 Nella sezione "Workflow permissions":');
console.log('   ✅ Seleziona "Read and write permissions"');
console.log('   ✅ Abilita "Allow GitHub Actions to create and approve pull requests"');
console.log('');
console.log('3. 💾 Clicca "Save"');
console.log('');
console.log('4. 🧪 Testa i permessi eseguendo:');
console.log('   - Vai su Actions tab del repository');
console.log('   - Esegui manualmente il workflow "Test GitHub Permissions"');
console.log('   - Verifica che tutti i test passino');
console.log('');

// Verifica se abbiamo un workflow di test
const testWorkflowPath = '.github/workflows/test-permissions.yml';

if (existsSync(testWorkflowPath)) {
  console.log('✅ Workflow di test permessi trovato!');
  console.log(`   Esegui: https://github.com/${owner}/${repo}/actions/workflows/test-permissions.yml`);
} else {
  console.log('⚠️  Workflow di test permessi non trovato');
  console.log('   Considera di aggiungere il workflow di test che abbiamo creato');
}

console.log('');
console.log('📚 Per maggiori dettagli consulta:');
console.log('   docs/GITHUB_PERMISSIONS_GUIDE.md');
console.log('');
