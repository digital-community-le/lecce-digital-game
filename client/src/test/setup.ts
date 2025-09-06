/**
 * Setup file per i test con Vitest
 * Configura l'ambiente di testing e le utilità globali
 */

import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

// Mock del Service Worker per i test
beforeAll(() => {
  // Mock di navigator.serviceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn(() => Promise.resolve({
        addEventListener: vi.fn(),
        installing: null,
        waiting: null,
        active: null,
        update: vi.fn(() => Promise.resolve()),
        postMessage: vi.fn(),
      })),
      controller: {
        postMessage: vi.fn(),
      },
      addEventListener: vi.fn(),
    },
    writable: true,
  });

  // Mock di window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      reload: vi.fn(),
    },
    writable: true,
  });

  // Mock di import.meta.env
  vi.stubGlobal('import', {
    meta: {
      env: {
        PROD: false,
        DEV: true,
        MODE: 'test',
      },
    },
  });

  // Mock di console per test più puliti (opzionale)
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

// Funzioni di utilità per i test
export const testUtils = {
  /**
   * Simula un aggiornamento del Service Worker
   */
  mockServiceWorkerUpdate: () => {
    const mockEvent = new MessageEvent('message', {
      data: {
        type: 'SW_UPDATED',
        payload: {
          version: '1234567890',
          message: 'Una nuova versione è disponibile!'
        }
      }
    });
    
    const listeners = (navigator.serviceWorker.addEventListener as any).mock.calls;
    const messageListener = listeners.find(([event]: [string, any]) => event === 'message');
    if (messageListener) {
      messageListener[1](mockEvent);
    }
  },

  /**
   * Pulisce tutti i mock tra i test
   */
  clearAllMocks: () => {
    vi.clearAllMocks();
  },

  /**
   * Attende che tutti i timer siano completati
   */
  flushTimers: async () => {
    vi.runAllTimers();
    await new Promise(resolve => setTimeout(resolve, 0));
  },
};
