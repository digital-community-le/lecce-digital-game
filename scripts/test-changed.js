#!/usr/bin/env node

/**
 * Script per eseguire test solo sui file modificati
 * Analizza i file cambiati e esegue solo i test correlati
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const TEST_PATTERNS = ['.test.', '.spec.', '__tests__'];

/**
 * Ottiene i file modificati dalla base branch
 */
function getChangedFiles(baseBranch = 'origin/main') {
  try {
    // Per CI, usa il diff con la base branch
    if (process.env.CI) {
      return execSync(`git diff --name-only ${baseBranch}...HEAD`, { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    }
    
    // Per sviluppo locale, usa staged + unstaged files
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' });
    
    return [...staged.split('\n'), ...unstaged.split('\n')]
      .filter(Boolean)
      .filter((file, index, arr) => arr.indexOf(file) === index); // rimuovi duplicati
  } catch (error) {
    console.log('⚠️  Could not get changed files, running all tests');
    return [];
  }
}

/**
 * Trova i file di test correlati a un file sorgente
 */
function findRelatedTestFiles(sourceFile) {
  const testFiles = [];
  const dir = dirname(sourceFile);
  const name = basename(sourceFile, extname(sourceFile));
  const ext = extname(sourceFile);
  
  // Pattern possibili per i test
  const testPatterns = [
    // Test nella stessa directory
    join(dir, `${name}.test${ext}`),
    join(dir, `${name}.spec${ext}`),
    
    // Test in subdirectory __tests__
    join(dir, '__tests__', `${name}.test${ext}`),
    join(dir, '__tests__', `${name}.spec${ext}`),
    
    // Test in directory test parallela
    join(dir.replace('/src/', '/test/'), `${name}.test${ext}`),
    join(dir.replace('/src/', '/test/'), `${name}.spec${ext}`),
  ];
  
  for (const testFile of testPatterns) {
    if (existsSync(testFile)) {
      testFiles.push(testFile);
    }
  }
  
  return testFiles;
}

/**
 * Determina se un file è un file di test
 */
function isTestFile(file) {
  return TEST_PATTERNS.some(pattern => file.includes(pattern));
}

/**
 * Filtra solo i file che possono avere test
 */
function filterTestableFiles(files) {
  return files.filter(file => {
    // Include file TypeScript/JavaScript nel src
    if (file.startsWith('client/src/') && SUPPORTED_EXTENSIONS.some(ext => file.endsWith(ext))) {
      return true;
    }
    
    // Include file di test direttamente
    if (isTestFile(file)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Principale logica di esecuzione
 */
async function main() {
  console.log('🔍 Analyzing changed files for targeted testing...\n');
  
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️  No changed files detected, running full test suite');
    execSync('npm run test:run', { stdio: 'inherit' });
    return;
  }
  
  console.log('📝 Changed files:');
  changedFiles.forEach(file => console.log(`   ${file}`));
  console.log('');
  
  const testableFiles = filterTestableFiles(changedFiles);
  
  if (testableFiles.length === 0) {
    console.log('ℹ️  No testable files changed, skipping tests');
    console.log('✅ No tests needed for this change');
    return;
  }
  
  console.log('🎯 Testable files:');
  testableFiles.forEach(file => console.log(`   ${file}`));
  console.log('');
  
  // Trova tutti i test correlati
  const testFilesToRun = new Set();
  
  for (const file of testableFiles) {
    if (isTestFile(file)) {
      // È già un file di test
      testFilesToRun.add(file);
    } else {
      // Trova i test correlati
      const relatedTests = findRelatedTestFiles(file);
      relatedTests.forEach(test => testFilesToRun.add(test));
    }
  }
  
  if (testFilesToRun.size === 0) {
    console.log('⚠️  No test files found for changed files');
    console.log('💡 Consider adding tests for:');
    testableFiles
      .filter(f => !isTestFile(f))
      .forEach(file => console.log(`   ${file}`));
    
    // Esegui almeno i test base per sicurezza
    console.log('\n🔄 Running basic tests for safety...');
    execSync('npm run test:run -- src/test/basic.test.ts', { stdio: 'inherit' });
    return;
  }
  
  console.log('🧪 Test files to run:');
  Array.from(testFilesToRun).forEach(file => console.log(`   ${file}`));
  console.log('');
  
  // Costruisci il comando per Vitest
  const testFiles = Array.from(testFilesToRun).join(' ');
  const command = `npm run test:run -- ${testFiles}`;
  
  console.log('🚀 Running targeted tests...');
  console.log(`Command: ${command}\n`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Targeted tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed!');
    process.exit(1);
  }
}

// Gestione degli argomenti della command line
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎯 Targeted Test Runner

Usage:
  npm run test:changed              # Test only changed files
  npm run test:changed -- --full    # Force full test suite
  
Environment Variables:
  CI=true                          # Use CI mode (diff against origin/main)
  
Examples:
  npm run test:changed             # Local development
  CI=true npm run test:changed     # CI environment
`);
  process.exit(0);
}

if (process.argv.includes('--full')) {
  console.log('🔄 Running full test suite (--full flag)');
  execSync('npm run test:run', { stdio: 'inherit' });
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
