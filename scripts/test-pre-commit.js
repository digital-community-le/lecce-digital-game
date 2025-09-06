#!/usr/bin/env node

/**
 * Script per testare manualmente i Git hooks
 * Simula l'esecuzione del pre-commit hook senza fare un commit reale
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🧪 Testing pre-commit hooks...\n');

try {
  // Verifica se ci sono file staged
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
  
  if (!stagedFiles) {
    console.log('⚠️  No staged files found. Staging some test files...');
    // Stage alcuni file per il test
    execSync('git add package.json', { stdio: 'inherit' });
  }

  console.log('📋 Staged files:');
  console.log(execSync('git diff --cached --name-only', { encoding: 'utf8' }));

  // Esegui type checking
  console.log('🔍 Running type checking...');
  execSync('npm run check', { stdio: 'inherit' });
  console.log('✅ Type checking passed!\n');

  // Esegui test
  console.log('🧪 Running tests...');
  execSync('npm run test:run --reporter=basic', { stdio: 'inherit' });
  console.log('✅ Tests passed!\n');

  // Esegui lint-staged
  console.log('🎯 Running lint-staged...');
  execSync('npm run lint-staged', { stdio: 'inherit' });
  console.log('✅ Lint-staged checks passed!\n');

  console.log('🎉 All pre-commit checks passed! Your commit would be successful.');

} catch (error) {
  console.error('❌ Pre-commit checks failed!');
  console.error('Error:', error.message);
  process.exit(1);
}
