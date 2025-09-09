#!/usr/bin/env node

/**
 * Script per iniettare informazioni di versione nel build
 * Legge dal package.json e crea le variabili di ambiente per Vite
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ottiene informazioni sulla versione corrente
 */
function getVersionInfo() {
  const packageJsonPath = path.join(__dirname, '../package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.0';

  // Ottieni informazioni Git se disponibili
  let gitCommit = '';
  let gitBranch = '';

  try {
    gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('⚠️ Git information not available');
  }

  const buildTime = new Date().toISOString();

  return {
    version,
    buildTime,
    gitCommit,
    gitBranch
  };
}

/**
 * Aggiorna il manifest.json con la versione corrente
 */
function updateManifest(versionInfo) {
  const manifestPath = path.join(__dirname, '../public/manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️ manifest.json not found, skipping update');
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = versionInfo.version;
    manifest.build_time = versionInfo.buildTime;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest updated with version:', versionInfo.version);
  } catch (error) {
    console.error('❌ Error updating manifest:', error);
  }
}

/**
 * Crea il file .env.production con le variabili di versione
 */
function createEnvFile(versionInfo) {
  const envPath = path.join(__dirname, '../.env.production');

  const envContent = `# Auto-generated version information
VITE_APP_VERSION=${versionInfo.version}
VITE_BUILD_TIME=${versionInfo.buildTime}
VITE_GIT_COMMIT=${versionInfo.gitCommit}
VITE_GIT_BRANCH=${versionInfo.gitBranch}
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created:', envPath);
}

/**
 * Genera un file TypeScript con le informazioni di versione
 */
function generateVersionFile(versionInfo) {
  const versionFilePath = path.join(__dirname, '../client/src/version.ts');

  const versionFileContent = `/**
 * Auto-generated version information
 * Generated at build time by scripts/inject-version.js
 */

export const VERSION_INFO = {
  version: '${versionInfo.version}',
  buildTime: '${versionInfo.buildTime}',
  gitCommit: '${versionInfo.gitCommit}',
  gitBranch: '${versionInfo.gitBranch}'
} as const;

export const APP_VERSION = VERSION_INFO.version;
export const BUILD_TIME = VERSION_INFO.buildTime;
export const GIT_COMMIT = VERSION_INFO.gitCommit;
export const GIT_BRANCH = VERSION_INFO.gitBranch;
`;

  // Crea la directory se non esiste
  const dir = path.dirname(versionFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(versionFilePath, versionFileContent);
  console.log('✅ Version TypeScript file generated:', versionFilePath);
}

/**
 * Funzione principale
 */
function main() {
  console.log('🔧 Injecting version information...\n');

  try {
    const versionInfo = getVersionInfo();

    console.log('📋 Version Information:');
    console.log(`   Version: ${versionInfo.version}`);
    console.log(`   Build Time: ${versionInfo.buildTime}`);
    console.log(`   Git Commit: ${versionInfo.gitCommit || 'N/A'}`);
    console.log(`   Git Branch: ${versionInfo.gitBranch || 'N/A'}\n`);

    // Aggiorna i vari file
    updateManifest(versionInfo);
    createEnvFile(versionInfo);
    generateVersionFile(versionInfo);

    console.log('\n✅ Version injection completed successfully!');

  } catch (error) {
    console.error('❌ Error during version injection:', error);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
