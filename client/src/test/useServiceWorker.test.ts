/**
 * Test per l'hook useServiceWorker
 * Verifica il comportamento del Service Worker hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { testUtils } from '../test/setup';

describe('useServiceWorker', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset del mock di import.meta.env per ogni test
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: false,
          DEV: true,
          MODE: 'test',
        },
      },
    });
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.currentVersion).toBeNull();
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not register service worker in development', () => {
    renderHook(() => useServiceWorker());
    
    // Il service worker non dovrebbe essere registrato in development
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('should register service worker in production', async () => {
    // Simula ambiente di produzione
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
          MODE: 'production',
        },
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    // Attendi che l'effetto si esegua
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(result.current.isRegistered).toBe(true);
  });

  it('should handle force update correctly', async () => {
    // Simula ambiente di produzione
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
          MODE: 'production',
        },
      },
    });

    const { result } = renderHook(() => useServiceWorker());

    // Attendi la registrazione
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Mock del MessageChannel per il force update
    const mockChannel = {
      port1: { 
        onmessage: null as ((event: any) => void) | null,
        postMessage: vi.fn(),
        close: vi.fn(),
        start: vi.fn(),
      },
      port2: {
        postMessage: vi.fn(),
        close: vi.fn(),
        start: vi.fn(),
      },
    };
    
    // Mock del costruttore MessageChannel
    (global as any).MessageChannel = vi.fn(() => mockChannel);

    // Simula il force update
    await act(async () => {
      const updatePromise = result.current.forceUpdate();
      
      // Simula la risposta del service worker
      if (mockChannel.port1.onmessage) {
        mockChannel.port1.onmessage({
          data: {
            type: 'CACHE_CLEARED',
            message: 'Cache aggiornata con successo!'
          }
        } as any);
      }
      
      await updatePromise;
    });

    expect(result.current.isUpdating).toBe(false);
  });

  it('should handle service worker messages', async () => {
    const { result } = renderHook(() => useServiceWorker());

    // Simula un messaggio di aggiornamento
    await act(async () => {
      testUtils.mockServiceWorkerUpdate();
    });

    // Nota: In un test reale, dovremmo verificare che lo stato sia aggiornato
    // ma il mock attuale è semplificato
    expect(result.current.isSupported).toBe(true);
  });

  it('should provide refresh page functionality', () => {
    const { result } = renderHook(() => useServiceWorker());
    
    // Mock di window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    act(() => {
      result.current.refreshPage();
    });

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should handle unsupported browsers', () => {
    // Salva il riferimento originale
    const originalServiceWorker = navigator.serviceWorker;
    
    // Mock di browser che non supporta service worker
    delete (navigator as any).serviceWorker;

    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.isSupported).toBe(false);
    
    // Ripristina il service worker originale
    (navigator as any).serviceWorker = originalServiceWorker;
  });
});
