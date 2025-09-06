/**
 * Hook per gestire il Service Worker e la cache versioning
 * Fornisce funzionalità per controllare aggiornamenti e forzare refresh
 */

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  currentVersion: string | null;
  isUpdating: boolean;
  error: string | null;
}

interface ServiceWorkerActions {
  checkForUpdates: () => Promise<void>;
  forceUpdate: () => Promise<void>;
  skipWaiting: () => void;
  refreshPage: () => void;
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    currentVersion: null,
    isUpdating: false,
    error: null
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  /**
   * Controlla se sono disponibili aggiornamenti
   */
  const checkForUpdates = useCallback(async () => {
    if (!registration) return;

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));
      
      // Forza il controllo per aggiornamenti
      await registration.update();
      
      // Controlla la versione corrente
      if (registration.active) {
        const messageChannel = new MessageChannel();
        
        const versionPromise = new Promise<string>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'VERSION_INFO') {
              resolve(event.data.version);
            }
          };
        });

        registration.active.postMessage(
          { type: 'CHECK_VERSION' },
          [messageChannel.port2]
        );

        const version = await versionPromise;
        setState(prev => ({ ...prev, currentVersion: version }));
      }

    } catch (error) {
      console.error('Error checking for updates:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }));
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [registration]);

  /**
   * Forza l'aggiornamento della cache
   */
  const forceUpdate = useCallback(async () => {
    if (!registration?.active) return;

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));
      
      const messageChannel = new MessageChannel();
      
      const updatePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout durante l\'aggiornamento'));
        }, 10000);

        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          if (event.data.type === 'CACHE_CLEARED') {
            resolve();
          } else {
            reject(new Error('Risposta inaspettata dal Service Worker'));
          }
        };
      });

      registration.active.postMessage(
        { type: 'FORCE_UPDATE' },
        [messageChannel.port2]
      );

      await updatePromise;
      
      // Refresh della pagina dopo l'aggiornamento
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error forcing update:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Errore durante l\'aggiornamento'
      }));
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [registration]);

  /**
   * Salta l'attesa e attiva il nuovo service worker
   */
  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  /**
   * Ricarica la pagina
   */
  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  /**
   * Setup del Service Worker e listeners
   */
  useEffect(() => {
    if (!state.isSupported) return;

    const registerSW = async () => {
      try {
        // Registra il service worker solo in produzione
        if (import.meta.env.PROD) {
          const reg = await navigator.serviceWorker.register('/sw.js');
          setRegistration(reg);
          setState(prev => ({ ...prev, isRegistered: true }));

          // Listener per aggiornamenti
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });

          // Listener per messaggi dal SW
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SW_UPDATED') {
              setState(prev => ({ 
                ...prev, 
                isUpdateAvailable: true,
                currentVersion: event.data.payload.version
              }));
            }
          });

        } else {
          console.log('Service Worker disabled in development');
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Registrazione fallita'
        }));
      }
    };

    registerSW();
  }, [state.isSupported]);

  return {
    ...state,
    checkForUpdates,
    forceUpdate,
    skipWaiting,
    refreshPage
  };
}

/**
 * Interface per le props del componente di notifica aggiornamenti
 */
export interface UpdateNotificationProps {
  isUpdateAvailable: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
  isUpdating?: boolean;
}
