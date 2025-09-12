// Debug script per analizzare i dati nel localStorage
// Apri la console del browser e incolla questo codice

console.log('🧪 ===== DEBUGGING BADGE PAGE =====');

// 1. Controlla tutti i dati LDC nel localStorage
console.log('📦 Tutti i dati LDC nel localStorage:');
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('ldc:')) {
    console.log(`   ${key}:`, JSON.parse(localStorage.getItem(key) || '{}'));
  }
});

// 2. Trova l'ultimo profilo
const lastUserId = localStorage.getItem('ldc:profile:last');
console.log('👤 Ultimo user ID:', lastUserId);

// 3. Controlla il progresso di gioco per l'utente corrente
if (lastUserId) {
  const progressKey = `ldc:progress:${lastUserId}`;
  const progressData = localStorage.getItem(progressKey);
  console.log('🎮 Progresso di gioco:', JSON.parse(progressData || '{}'));

  // 4. Controlla specificamente la submission DevFest
  if (progressData) {
    const progress = JSON.parse(progressData);
    console.log('🏆 DevFest API Submission:', progress.devfestApiSubmission);

    if (progress.devfestApiSubmission?.badge) {
      console.log('🎖️ Badge Details:', progress.devfestApiSubmission.badge);
      console.log('✅ Badge.owned:', progress.devfestApiSubmission.badge.owned, typeof progress.devfestApiSubmission.badge.owned);
    }
  }
}

// 5. Testa le funzioni helper
try {
  // Importa le funzioni se possibile (questo potrebbe non funzionare dalla console)
  console.log('🔧 Tentativo di testare le funzioni helper...');

  // Simula getCurrentUserId
  const lastProfile = localStorage.getItem('ldc:profile:last');
  const currentUserId = lastProfile || 'anonymous';

  // Simula getDevFestBadge
  const progressKey = `ldc:progress:${currentUserId}`;
  const progressData = localStorage.getItem(progressKey);
  const progress = progressData ? JSON.parse(progressData) : null;

  const badge = progress?.devfestApiSubmission?.success ? progress.devfestApiSubmission.badge : null;
  console.log('🎯 Risultato simulato getDevFestBadge():', badge);

  // Verifica la condizione della BadgePage
  const condition = badge && badge.owned;
  console.log('🧮 Condizione BadgePage (badge && badge.owned):', condition);

} catch (error) {
  console.error('❌ Errore nel test delle funzioni:', error);
}

console.log('🧪 ===== FINE DEBUG =====');