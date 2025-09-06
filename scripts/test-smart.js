#!/usr/bin/env node

/**
 * Sistema di Test Stratificato - Gestisce unit test, integration test e e2e test
 * 
 * Strategia:
 * - Unit tests: Solo file modificati (veloce feedback)
 * - Integration tests: Sempre eseguiti se ci sono cambiamenti significativi
 * - E2E tests: Solo per deploy in produzione o cambiamenti critici
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

// Configurazione tipi di test
const TEST_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration', 
  E2E: 'e2e'
};

// Pattern per identificare i tipi di test
const TEST_PATTERNS = {
  [TEST_TYPES.UNIT]: ['.test.', '.spec.', '__tests__'],
  [TEST_TYPES.INTEGRATION]: ['.integration.test.', '.integration.spec.', '__integration__'],
  [TEST_TYPES.E2E]: ['.e2e.test.', '.e2e.spec.', '__e2e__']
};

// File che richiedono sempre integration tests
const INTEGRATION_TRIGGER_PATTERNS = [
  'src/services/',
  'src/hooks/',
  'src/context/',
  'src/utils/',
  'server/',
  'shared/',
  'package.json',
  'vite.config.ts',
  'tsconfig.json'
];

// File che richiedono sempre e2e tests
const E2E_TRIGGER_PATTERNS = [
  'src/pages/',
  'src/App.tsx',
  'src/main.tsx',
  'server/routes.ts',
  'server/index.ts'
];

/**
 * Ottiene i file modificati
 */
function getChangedFiles(baseBranch = 'origin/main') {
  try {
    if (process.env.CI) {
      return execSync(`git diff --name-only ${baseBranch}...HEAD`, { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    }
    
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' });
    
    return [...staged.split('\n'), ...unstaged.split('\n')]
      .filter(Boolean)
      .filter((file, index, arr) => arr.indexOf(file) === index);
  } catch (error) {
    console.log('⚠️  Could not get changed files');
    return [];
  }
}

/**
 * Classifica un file di test per tipo
 */
function classifyTestFile(filePath) {
  for (const [type, patterns] of Object.entries(TEST_PATTERNS)) {
    if (patterns.some(pattern => filePath.includes(pattern))) {
      return type;
    }
  }
  return TEST_TYPES.UNIT; // default
}

/**
 * Trova tutti i file di test per tipo
 */
function findTestFilesByType() {
  try {
    // Usa glob pattern che funziona su tutti i sistemi
    const { globSync } = require('glob');
    const allTestFiles = [
      ...globSync('client/src/**/*.test.*'),
      ...globSync('client/src/**/*.spec.*')
    ];

    const testsByType = {
      [TEST_TYPES.UNIT]: [],
      [TEST_TYPES.INTEGRATION]: [],
      [TEST_TYPES.E2E]: []
    };

    allTestFiles.forEach(file => {
      const type = classifyTestFile(file);
      testsByType[type].push(file);
    });

    return testsByType;
  } catch (error) {
    console.log('⚠️  Could not scan test files, using manual discovery');
    
    // Fallback: lista manuale dei test esistenti
    return {
      [TEST_TYPES.UNIT]: [
        'client/src/test/basic.test.ts',
        'client/src/test/buildScript.test.ts',
        'client/src/test/useServiceWorker.test.ts',
        'client/src/test/UpdateNotification.test.tsx',
        'client/src/services/__tests__/testModeChecker.test.ts',
        'client/src/components/challenges/__tests__/GuildBuilder.test.tsx'
      ].filter(file => existsSync(file)),
      [TEST_TYPES.INTEGRATION]: [
        'client/src/__integration__/auth.integration.test.tsx',
        'client/src/__integration__/game-system.integration.test.tsx'
      ].filter(file => existsSync(file)),
      [TEST_TYPES.E2E]: [
        'client/src/__e2e__/user-journeys.e2e.test.tsx'
      ].filter(file => existsSync(file))
    };
  }
}

/**
 * Trova unit test correlati a un file sorgente
 */
function findRelatedUnitTests(sourceFile) {
  const testFiles = [];
  const dir = dirname(sourceFile);
  const name = basename(sourceFile, extname(sourceFile));
  const ext = extname(sourceFile);
  
  const testPatterns = [
    join(dir, `${name}.test${ext}`),
    join(dir, `${name}.spec${ext}`),
    join(dir, '__tests__', `${name}.test${ext}`),
    join(dir, '__tests__', `${name}.spec${ext}`)
  ];
  
  for (const testFile of testPatterns) {
    if (existsSync(testFile)) {
      testFiles.push(testFile);
    }
  }
  
  return testFiles;
}

/**
 * Determina se servono integration test
 */
function shouldRunIntegrationTests(changedFiles) {
  return changedFiles.some(file => 
    INTEGRATION_TRIGGER_PATTERNS.some(pattern => file.includes(pattern))
  );
}

/**
 * Determina se servono e2e test
 */
function shouldRunE2ETests(changedFiles) {
  return changedFiles.some(file => 
    E2E_TRIGGER_PATTERNS.some(pattern => file.includes(pattern))
  );
}

/**
 * Determina se un file è testabile
 */
function isTestableFile(file) {
  const testableExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  return file.startsWith('client/src/') && testableExtensions.some(ext => file.endsWith(ext));
}

/**
 * Esegue test per tipo
 */
async function runTestsByType(testType, testFiles, reason) {
  if (testFiles.length === 0) {
    console.log(`ℹ️  No ${testType} tests to run`);
    return true;
  }

  console.log(`\n🧪 Running ${testType} tests (${reason}):`);
  testFiles.forEach(file => console.log(`   ${file}`));
  
  const testFilesArg = testFiles.join(' ');
  let command;
  
  switch (testType) {
    case TEST_TYPES.UNIT:
      command = `npm run test:run -- ${testFilesArg} --reporter=basic`;
      break;
    case TEST_TYPES.INTEGRATION:
      command = `npm run test:run -- ${testFilesArg} --reporter=verbose`;
      break;
    case TEST_TYPES.E2E:
      command = `npm run test:run -- ${testFilesArg} --reporter=verbose --timeout=30000`;
      break;
    default:
      command = `npm run test:run -- ${testFilesArg}`;
  }

  try {
    console.log(`🚀 Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${testType} tests passed!`);
    return true;
  } catch (error) {
    console.error(`❌ ${testType} tests failed!`);
    return false;
  }
}

/**
 * Strategia di test principale
 */
async function executeTestStrategy(changedFiles, options = {}) {
  const { 
    forceUnit = false,
    forceIntegration = false, 
    forceE2E = false,
    skipUnit = false,
    skipIntegration = false,
    skipE2E = false
  } = options;

  console.log('🎯 Analyzing test strategy based on changed files...\n');

  const testsByType = findTestFilesByType();
  const results = {};

  // 1. UNIT TESTS - Solo per file modificati (a meno che non sia forzato)
  if (!skipUnit) {
    let unitTestsToRun = [];
    
    if (forceUnit) {
      unitTestsToRun = testsByType[TEST_TYPES.UNIT];
      console.log('🔄 Running ALL unit tests (forced)');
    } else {
      // Trova unit test per file modificati
      const testableFiles = changedFiles.filter(isTestableFile);
      
      for (const file of testableFiles) {
        if (TEST_PATTERNS[TEST_TYPES.UNIT].some(pattern => file.includes(pattern))) {
          // È già un unit test
          unitTestsToRun.push(file);
        } else {
          // Trova unit test correlati
          const relatedTests = findRelatedUnitTests(file);
          unitTestsToRun.push(...relatedTests);
        }
      }
      
      // Rimuovi duplicati
      unitTestsToRun = [...new Set(unitTestsToRun)];
    }
    
    results.unit = await runTestsByType(
      TEST_TYPES.UNIT, 
      unitTestsToRun, 
      forceUnit ? 'forced execution' : 'changed files'
    );
  }

  // 2. INTEGRATION TESTS - Sempre se ci sono cambiamenti significativi
  if (!skipIntegration) {
    let integrationTestsToRun = [];
    
    if (forceIntegration || shouldRunIntegrationTests(changedFiles)) {
      integrationTestsToRun = testsByType[TEST_TYPES.INTEGRATION];
      const reason = forceIntegration ? 'forced execution' : 'significant changes detected';
      
      results.integration = await runTestsByType(
        TEST_TYPES.INTEGRATION,
        integrationTestsToRun,
        reason
      );
    } else {
      console.log('ℹ️  No integration tests needed (no significant changes)');
      results.integration = true;
    }
  }

  // 3. E2E TESTS - Solo per cambiamenti critici o forzati
  if (!skipE2E) {
    let e2eTestsToRun = [];
    
    if (forceE2E || shouldRunE2ETests(changedFiles)) {
      e2eTestsToRun = testsByType[TEST_TYPES.E2E];
      const reason = forceE2E ? 'forced execution' : 'critical changes detected';
      
      results.e2e = await runTestsByType(
        TEST_TYPES.E2E,
        e2eTestsToRun,
        reason
      );
    } else {
      console.log('ℹ️  No e2e tests needed (no critical changes)');
      results.e2e = true;
    }
  }

  return results;
}

/**
 * Funzione principale
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Stratified Test Runner

Usage:
  npm run test:smart                    # Strategia automatica
  npm run test:smart -- --unit-only     # Solo unit test
  npm run test:smart -- --integration   # Forza integration test
  npm run test:smart -- --e2e          # Forza e2e test
  npm run test:smart -- --all          # Tutti i test
  
Options:
  --unit-only        Esegui solo unit test
  --integration     Forza integration test
  --e2e             Forza e2e test
  --all             Tutti i test (unit + integration + e2e)
  --skip-unit       Salta unit test
  --skip-integration Salta integration test
  --skip-e2e        Salta e2e test
  
Environment:
  CI=true           Modalità CI (confronta con origin/main)
  
Examples:
  npm run test:smart                    # Strategia basata sui file modificati
  npm run test:smart -- --all          # Esegue tutti i test
  npm run test:smart -- --unit-only    # Solo unit test veloci
`);
    return;
  }

  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0 && !args.some(arg => arg.startsWith('--force') || arg === '--all')) {
    console.log('ℹ️  No changed files detected, running basic unit tests for safety');
    execSync('npm run test:run -- src/test/basic.test.ts', { stdio: 'inherit' });
    return;
  }

  console.log('📝 Changed files:');
  changedFiles.forEach(file => console.log(`   ${file}`));
  console.log('');

  // Parse options
  const options = {
    forceUnit: args.includes('--all'),
    forceIntegration: args.includes('--integration') || args.includes('--all'),
    forceE2E: args.includes('--e2e') || args.includes('--all'),
    skipUnit: args.includes('--skip-unit'),
    skipIntegration: args.includes('--skip-integration') || args.includes('--unit-only'),
    skipE2E: args.includes('--skip-e2e') || args.includes('--unit-only')
  };

  const results = await executeTestStrategy(changedFiles, options);
  
  // Report finale
  console.log('\n📊 Test Results Summary:');
  Object.entries(results).forEach(([type, success]) => {
    const emoji = success ? '✅' : '❌';
    console.log(`   ${emoji} ${type} tests: ${success ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 All test strategies completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
