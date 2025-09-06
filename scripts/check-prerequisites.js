#!/usr/bin/env node

/**
 * Script per verificare i prerequisiti del progetto
 * Controlla le versioni di Node.js e npm
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Verifying project prerequisites...\n');

try {
  // Leggi i requisiti dal package.json
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const engines = packageJson.engines || {};
  
  // Ottieni le versioni correnti
  const nodeVersion = process.version;
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  
  console.log('📊 Current Versions:');
  console.log(`   Node.js: ${nodeVersion}`);
  console.log(`   npm: ${npmVersion}\n`);
  
  console.log('📋 Required Versions:');
  console.log(`   Node.js: ${engines.node || 'Not specified'}`);
  console.log(`   npm: ${engines.npm || 'Not specified'}\n`);
  
  // Verifica Node.js
  const requiredNodeVersion = engines.node;
  if (requiredNodeVersion) {
    const currentNodeVersion = nodeVersion.replace('v', '');
    const requiredVersion = requiredNodeVersion.replace('>=', '');
    
    if (compareVersions(currentNodeVersion, requiredVersion) < 0) {
      console.log('❌ Node.js version is too old!');
      console.log(`   Required: ${requiredNodeVersion}`);
      console.log(`   Current: ${nodeVersion}`);
      console.log('\n💡 Solutions:');
      console.log('   - Update Node.js: https://nodejs.org/');
      console.log('   - Use nvm: nvm install 20 && nvm use 20');
      console.log('   - Use nvm with .nvmrc: nvm use');
      process.exit(1);
    } else {
      console.log('✅ Node.js version is compatible');
    }
  }
  
  // Verifica npm
  const requiredNpmVersion = engines.npm;
  if (requiredNpmVersion) {
    const requiredVersion = requiredNpmVersion.replace('>=', '');
    
    if (compareVersions(npmVersion, requiredVersion) < 0) {
      console.log('❌ npm version is too old!');
      console.log(`   Required: ${requiredNpmVersion}`);
      console.log(`   Current: ${npmVersion}`);
      console.log('\n💡 Solution: npm install -g npm@latest');
      process.exit(1);
    } else {
      console.log('✅ npm version is compatible');
    }
  }
  
  // Verifica Firebase CLI se disponibile
  try {
    const firebaseVersion = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Firebase CLI: ${firebaseVersion}`);
  } catch (error) {
    console.log('⚠️  Firebase CLI not installed (optional for local development)');
    console.log('   Install with: npm install -g firebase-tools');
  }
  
  console.log('\n🎉 All prerequisites are satisfied!');
  console.log('\n🚀 You can now run:');
  console.log('   npm install     # Install dependencies');
  console.log('   npm run dev     # Start development server');
  console.log('   npm run test    # Run tests');
  
} catch (error) {
  console.error('❌ Error checking prerequisites:', error.message);
  process.exit(1);
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  return 0;
}
