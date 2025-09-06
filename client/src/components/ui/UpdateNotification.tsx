/**
 * Componente per notificare gli aggiornamenti disponibili del Service Worker
 */

import React from 'react';
import { UpdateNotificationProps } from '../../hooks/useServiceWorker';

export function UpdateNotification({ 
  isUpdateAvailable, 
  onUpdate, 
  onDismiss, 
  isUpdating = false 
}: UpdateNotificationProps) {
  if (!isUpdateAvailable) return null;

  return (
    <div className="nes-container is-rounded is-dark" 
         style={{ 
           position: 'fixed', 
           top: '20px', 
           right: '20px', 
           zIndex: 9999,
           maxWidth: '300px'
         }}>
      <p className="title">🎮 Aggiornamento Disponibile!</p>
      <p>Una nuova versione del gioco è disponibile.</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          className="nes-btn is-primary" 
          onClick={onUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Aggiornamento...' : 'Aggiorna'}
        </button>
        <button 
          className="nes-btn" 
          onClick={onDismiss}
          disabled={isUpdating}
        >
          Più tardi
        </button>
      </div>
    </div>
  );
}
