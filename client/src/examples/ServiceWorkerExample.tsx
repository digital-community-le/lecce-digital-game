/**
 * Esempio di utilizzo del Service Worker Hook
 * Dimostra come integrare il sistema di cache versioning nell'app
 */

import React, { useState } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { UpdateNotification } from '../components/ui/UpdateNotification';

export function ServiceWorkerExample() {
  const [dismissed, setDismissed] = useState(false);
  
  const {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    currentVersion,
    isUpdating,
    error,
    checkForUpdates,
    forceUpdate,
    skipWaiting,
    refreshPage
  } = useServiceWorker();

  const handleUpdate = async () => {
    try {
      await forceUpdate();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Rimostra la notifica dopo 30 minuti
    setTimeout(() => setDismissed(false), 30 * 60 * 1000);
  };

  if (!isSupported) {
    return (
      <div className="nes-container is-warning">
        <p>⚠️ Service Worker non supportato in questo browser</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>🔧 Service Worker Status</h2>
      
      <div className="nes-container">
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Supportato:</strong> {isSupported ? '✅' : '❌'}</p>
          <p><strong>Registrato:</strong> {isRegistered ? '✅' : '❌'}</p>
          <p><strong>Versione Corrente:</strong> {currentVersion || 'N/A'}</p>
          <p><strong>Aggiornamento Disponibile:</strong> {isUpdateAvailable ? '🔄' : '✅'}</p>
        </div>

        {error && (
          <div className="nes-container is-error">
            <p>❌ Errore: {error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="nes-btn"
            onClick={checkForUpdates}
            disabled={isUpdating}
          >
            {isUpdating ? 'Controllo...' : 'Controlla Aggiornamenti'}
          </button>

          <button 
            className="nes-btn is-primary"
            onClick={handleUpdate}
            disabled={isUpdating || !isUpdateAvailable}
          >
            {isUpdating ? 'Aggiornamento...' : 'Forza Aggiornamento'}
          </button>

          <button 
            className="nes-btn is-warning"
            onClick={skipWaiting}
            disabled={!isUpdateAvailable}
          >
            Salta Attesa
          </button>

          <button 
            className="nes-btn is-error"
            onClick={refreshPage}
          >
            Ricarica Pagina
          </button>
        </div>
      </div>

      {/* Notifica di aggiornamento */}
      {!dismissed && (
        <UpdateNotification
          isUpdateAvailable={isUpdateAvailable}
          onUpdate={handleUpdate}
          onDismiss={handleDismiss}
          isUpdating={isUpdating}
        />
      )}

      {/* Debug info */}
      <details style={{ marginTop: '2rem' }}>
        <summary>🐛 Debug Info</summary>
        <div className="nes-container is-dark">
          <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
            {JSON.stringify({
              isSupported,
              isRegistered,
              isUpdateAvailable,
              currentVersion,
              isUpdating,
              error,
              userAgent: navigator.userAgent,
              online: navigator.onLine,
              serviceWorkerController: !!navigator.serviceWorker?.controller
            }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
