#!/usr/bin/env node

/**
 * Build script per aggiornare la versione della cache nel Service Worker
 * Sostituisce il placeholder %%CACHE_VERSION%% con timestamp corrente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function updateServiceWorkerVersion() {
  const swPath = path.join(__dirname, '../public/sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.error('❌ Service Worker file not found:', swPath);
    process.exit(1);
  }

  try {
    // Leggi il contenuto del Service Worker
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Genera una versione basata su timestamp
    const version = Date.now().toString();
    
    // Sostituisci il placeholder con la versione attuale
    const updatedContent = swContent.replace(/%%CACHE_VERSION%%/g, version);
    
    // Scrivi il file aggiornato
    fs.writeFileSync(swPath, updatedContent, 'utf8');
    
    console.log('✅ Service Worker version updated:', version);
    console.log('📁 File updated:', swPath);
    
  } catch (error) {
    console.error('❌ Error updating Service Worker version:', error);
    process.exit(1);
  }
}

// Funzione per ripristinare il placeholder (per development)
function restoreServiceWorkerPlaceholder() {
  const swPath = path.join(__dirname, '../public/sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.error('❌ Service Worker file not found:', swPath);
    process.exit(1);
  }

  try {
    // Leggi il contenuto del Service Worker
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Sostituisci qualsiasi versione numerica con il placeholder
    const restoredContent = swContent.replace(/const CACHE_VERSION = '[0-9]+';/g, "const CACHE_VERSION = '%%CACHE_VERSION%%';");
    
    // Scrivi il file ripristinato
    fs.writeFileSync(swPath, restoredContent, 'utf8');
    
    console.log('✅ Service Worker placeholder restored');
    console.log('📁 File updated:', swPath);
    
  } catch (error) {
    console.error('❌ Error restoring Service Worker placeholder:', error);
    process.exit(1);
  }
}

// Esegui in base agli argomenti
const command = process.argv[2];

switch (command) {
  case 'update':
    updateServiceWorkerVersion();
    break;
  case 'restore':
    restoreServiceWorkerPlaceholder();
    break;
  default:
    console.log('Usage:');
    console.log('  node build-sw-version.js update   - Update SW version for production');
    console.log('  node build-sw-version.js restore  - Restore placeholder for development');
    process.exit(1);
}
