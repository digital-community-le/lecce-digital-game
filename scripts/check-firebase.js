#!/usr/bin/env node

/**
 * Script per verificare la configurazione Firebase e secrets GitHub
 * Esegui con: npm run check:firebase
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Verifica configurazione Firebase...\n');

// 1. Verifica firebase.json
console.log('📋 **Firebase Configuration:**');
if (existsSync('firebase.json')) {
  try {
    const firebaseConfig = JSON.parse(readFileSync('firebase.json', 'utf8'));
    console.log('✅ firebase.json trovato');

    if (firebaseConfig.hosting) {
      console.log(`📁 Public directory: ${firebaseConfig.hosting.public}`);
      console.log(`📄 Index fallback: ${firebaseConfig.hosting.rewrites ? 'configured' : 'not configured'}`);
    }
  } catch (error) {
    console.log('❌ Errore parsing firebase.json:', error.message);
  }
} else {
  console.log('❌ firebase.json non trovato');
}

// 2. Verifica se dist/public esiste
console.log('\n📁 **Build Output:**');
const buildPath = 'dist/public';
if (existsSync(buildPath)) {
  console.log(`✅ Directory build trovata: ${buildPath}`);
  try {
    const files = execSync(`ls -la ${buildPath}`, { encoding: 'utf8' });
    const fileCount = files.split('\n').length - 3; // -3 per rimuovere ., .. e riga vuota
    console.log(`📄 Files in build: ${fileCount} items`);
  } catch (error) {
    console.log('⚠️ Non riesco a listare files di build');
  }
} else {
  console.log(`❌ Directory build non trovata: ${buildPath}`);
  console.log('💡 Esegui: npm run build');
}

// 3. Informazioni sui secrets
console.log('\n🔐 **GitHub Secrets Configuration:**');
console.log('');
console.log('Il deployment Firebase richiede questi secrets:');
console.log('1. 🔑 FIREBASE_SERVICE_ACCOUNT_LECCE_DIGITAL_GAME');
console.log('');
console.log('📋 **Per configurare il secret:**');
console.log('');
console.log('1. 🌐 Vai su Firebase Console:');
console.log('   https://console.firebase.google.com/project/lecce-digital-game/settings/serviceaccounts/adminsdk');
console.log('');
console.log('2. 🔑 Genera una nuova chiave privata:');
console.log('   - Clicca "Generate new private key"');
console.log('   - Scarica il file JSON');
console.log('');
console.log('3. 📝 Aggiungi il secret su GitHub:');
console.log('   https://github.com/digital-community-le/lecce-digital-game/settings/secrets/actions');
console.log('   - Name: FIREBASE_SERVICE_ACCOUNT_LECCE_DIGITAL_GAME');
console.log('   - Value: [tutto il contenuto del file JSON]');
console.log('');
console.log('4. 🧪 Testa il deployment:');
console.log('   - Triggera manualmente il workflow deploy-on-release');
console.log('   - Oppure merge una release PR');
console.log('');

// 4. Verifica connessione Firebase (se firebase CLI è installato)
console.log('🔧 **Firebase CLI Status:**');
try {
  const firebaseVersion = execSync('firebase --version', { encoding: 'utf8' });
  console.log(`✅ Firebase CLI installato: ${firebaseVersion.trim()}`);

  try {
    const projects = execSync('firebase projects:list', { encoding: 'utf8' });
    if (projects.includes('lecce-digital-game')) {
      console.log('✅ Progetto lecce-digital-game trovato');
    } else {
      console.log('⚠️ Progetto lecce-digital-game non trovato in Firebase CLI');
    }
  } catch (error) {
    console.log('⚠️ Non loggato su Firebase CLI (firebase login)');
  }

} catch (error) {
  console.log('❌ Firebase CLI non installato');
  console.log('💡 Installa con: npm install -g firebase-tools');
}

console.log('\n📚 **Link utili:**');
console.log('• Firebase Console: https://console.firebase.google.com/project/lecce-digital-game');
console.log('• GitHub Secrets: https://github.com/digital-community-le/lecce-digital-game/settings/secrets/actions');
console.log('• GitHub Actions: https://github.com/digital-community-le/lecce-digital-game/actions');
console.log('');
