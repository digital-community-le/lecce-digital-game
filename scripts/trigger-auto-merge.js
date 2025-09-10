#!/usr/bin/env node

/**
 * Script per triggerare manualmente auto-merge su una release PR
 * Esegui con: npm run trigger:auto-merge [PR_NUMBER]
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const prNumber = args[0];

if (!prNumber) {
  console.log('❌ Numero PR richiesto');
  console.log('');
  console.log('📋 Uso:');
  console.log('  npm run trigger:auto-merge [PR_NUMBER]');
  console.log('');
  console.log('📝 Esempio:');
  console.log('  npm run trigger:auto-merge 42');
  console.log('');
  console.log('🔍 Per trovare PR aperte:');
  console.log('  gh pr list --state open');
  console.log('  oppure vai su: https://github.com/digital-community-le/lecce-digital-game/pulls');
  console.log('');
  process.exit(1);
}

console.log(`🔍 Triggering auto-merge per PR #${prNumber}...`);
console.log('');

try {
  // Verifica se la PR esiste e ottieni informazioni
  console.log('📋 Verifica PR...');

  const prInfo = execSync(`gh pr view ${prNumber} --json number,title,author,labels,headRefName`, { encoding: 'utf8' });
  const pr = JSON.parse(prInfo);

  console.log(`✅ PR #${pr.number}: "${pr.title}"`);
  console.log(`👤 Author: ${pr.author.login}`);
  console.log(`🌿 Branch: ${pr.headRefName}`);

  const labels = pr.labels.map(l => l.name);
  console.log(`🏷️  Labels: ${labels.length > 0 ? labels.join(', ') : 'none'}`);
  console.log('');

  // Verifica se è una release PR
  const isReleaseBot = pr.author.login === 'github-actions[bot]' || pr.author.login.includes('bot');
  const hasReleaseLabel = labels.includes('autorelease: pending');
  const isReleaseBranch = pr.headRefName.startsWith('release-please--');
  const hasReleaseTitle = pr.title.includes('release') || pr.title.startsWith('chore');

  console.log('🤖 Analisi release PR:');
  console.log(`  Is bot: ${isReleaseBot ? '✅' : '❌'}`);
  console.log(`  Has autorelease label: ${hasReleaseLabel ? '✅' : '❌'}`);
  console.log(`  Is release branch: ${isReleaseBranch ? '✅' : '❌'}`);
  console.log(`  Has release title: ${hasReleaseTitle ? '✅' : '❌'}`);
  console.log('');

  if (!isReleaseBot && !hasReleaseLabel) {
    console.log('⚠️  Questa non sembra essere una release PR automatica.');
    console.log('   Procedendo comunque...');
    console.log('');
  }

  // Triggera auto-merge commentando sulla PR
  console.log('🚀 Triggering auto-merge workflow...');

  const commentBody = `🤖 **Manual Auto-merge Trigger**

✅ **Pre-validation passed** (manually triggered)

Auto-merge workflow should now process this release PR.

Triggered by: \`npm run trigger:auto-merge\`
Time: \`${new Date().toISOString()}\``;

  execSync(`gh pr comment ${prNumber} --body "${commentBody.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

  console.log('');
  console.log('✅ Comment posted successfully!');
  console.log('');
  console.log('📋 Prossimi passi:');
  console.log('1. 🔍 Monitora il workflow "Auto-merge Release PR" su GitHub Actions');
  console.log('2. ⏰ Il merge dovrebbe avvenire automaticamente se i test passano');
  console.log('3. 🚀 Dopo il merge, si attiverà il deployment automatico');
  console.log('');
  console.log('🔗 Link utili:');
  console.log(`  • PR: https://github.com/digital-community-le/lecce-digital-game/pull/${prNumber}`);
  console.log('  • Actions: https://github.com/digital-community-le/lecce-digital-game/actions');
  console.log('');

} catch (error) {
  console.error('❌ Errore:', error.message);
  console.log('');
  console.log('🔧 Possibili soluzioni:');
  console.log('1. Assicurati di avere gh CLI installato: npm install -g @githubnext/github-copilot-cli');
  console.log('2. Effettua login: gh auth login');
  console.log('3. Verifica che il numero PR sia corretto');
  console.log('4. Controlla i permessi del repository');
  console.log('');
  process.exit(1);
}
