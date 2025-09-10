#!/usr/bin/env node

/**
 * Script per verificare lo stato dei workflow GitHub Actions
 * Esegui con: npm run check:workflows
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';

console.log('🔍 Verifica stato workflow GitHub Actions...\n');

const workflowsDir = '.github/workflows';

if (!existsSync(workflowsDir)) {
  console.log('❌ Directory .github/workflows non trovata');
  process.exit(1);
}

const workflows = readdirSync(workflowsDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

console.log(`📁 Trovati ${workflows.length} workflow:\n`);

const categories = {
  'Release & Deploy': ['release-please', 'deploy-on-release', 'auto-merge-release'],
  'CI/CD & Testing': ['ci', 'full-test', 'scheduled-tests'],
  'Documentation & Utils': ['docs-config-only', 'test-permissions']
};

// Analizza ogni workflow
for (const [category, patterns] of Object.entries(categories)) {
  console.log(`\n📋 **${category}:**`);

  const categoryWorkflows = workflows.filter(file =>
    patterns.some(pattern => file.includes(pattern))
  );

  for (const workflow of categoryWorkflows) {
    const filePath = path.join(workflowsDir, workflow);
    const content = readFileSync(filePath, 'utf8');

    // Estrai nome e trigger
    const nameMatch = content.match(/name:\s*['"`]?([^'"`\n]+)['"`]?/);
    const name = nameMatch ? nameMatch[1] : workflow;

    // Verifica se è disabilitato
    const isDisabled = content.includes('DISABLED') || content.includes('# on:');

    // Conta job
    const jobMatches = content.match(/^\s*[a-zA-Z-_]+:\s*$/gm) || [];
    const jobCount = jobMatches.length - 1; // -1 per rimuovere 'jobs:'

    const status = isDisabled ? '🔴 DISABLED' : '✅ ACTIVE';
    console.log(`  ${status} ${name}`);
    console.log(`    📄 File: ${workflow}`);
    console.log(`    🔧 Jobs: ${jobCount}`);
  }
}

// Verifica workflow non categorizzati
const uncategorized = workflows.filter(file =>
  !Object.values(categories).flat().some(pattern => file.includes(pattern))
);

if (uncategorized.length > 0) {
  console.log(`\n⚠️  **Workflow non categorizzati:**`);
  for (const workflow of uncategorized) {
    console.log(`  📄 ${workflow}`);
  }
}

console.log('\n📊 **Riassunto:**');
console.log(`  • Total workflow: ${workflows.length}`);
console.log(`  • Release & Deploy: ${categories['Release & Deploy'].filter(p => workflows.some(w => w.includes(p))).length}`);
console.log(`  • CI/CD & Testing: ${categories['CI/CD & Testing'].filter(p => workflows.some(w => w.includes(p))).length}`);
console.log(`  • Documentation & Utils: ${categories['Documentation & Utils'].filter(p => workflows.some(w => w.includes(p))).length}`);
console.log(`  • Non categorizzati: ${uncategorized.length}`);

console.log('\n📚 **Per maggiori dettagli:**');
console.log('  • docs/WORKFLOWS_STATUS.md - Documentazione completa');
console.log('  • docs/GITHUB_PERMISSIONS_GUIDE.md - Guida permessi');
console.log('');
