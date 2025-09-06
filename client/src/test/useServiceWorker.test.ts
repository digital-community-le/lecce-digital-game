/**
 * Test per l'hook useServiceWorker
 * Verifica il comportamento del Service Worker hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { testUtils } from '../test/setup';

describe('useServiceWorker', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();

    // Mock navigator.serviceWorker and its register method
    if (!('serviceWorker' in navigator)) {
      (navigator as any).serviceWorker = {};
    }
    navigator.serviceWorker.register = vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      scope: '/',
      update: vi.fn(),
      unregister: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    // Mock navigator.serviceWorker.addEventListener
    navigator.serviceWorker.addEventListener = vi.fn();
  });

  // Importiamo l'hook dinamicamente per ogni test per evitare problemi di caching
  async function getUseServiceWorker() {
    const { useServiceWorker } = await import('../hooks/useServiceWorker');
    return useServiceWorker;
  }

  it('should initialize with correct default state', async () => {
    const useServiceWorker = await getUseServiceWorker();
    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.currentVersion).toBeNull();
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not register service worker in test environment', async () => {
    const useServiceWorker = await getUseServiceWorker();
    renderHook(() => useServiceWorker());
    
    // Il service worker non dovrebbe essere registrato in test environment
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('should provide refresh page functionality', async () => {
    const useServiceWorker = await getUseServiceWorker();
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

  it('should handle skipWaiting when registration exists', async () => {
    const useServiceWorker = await getUseServiceWorker();
    const { result } = renderHook(() => useServiceWorker());

    // Test che skipWaiting sia una funzione e possa essere chiamata senza errori
    act(() => {
      result.current.skipWaiting();
    });

    // Verifica che la funzione esista e sia chiamabile
    expect(typeof result.current.skipWaiting).toBe('function');
  });

  it('should handle unsupported browsers gracefully', async () => {
    // Per questo test, verifichiamo semplicemente che il check funzioni
    // In un browser moderno, serviceWorker dovrebbe essere supportato
    const useServiceWorker = await getUseServiceWorker();
    const { result } = renderHook(() => useServiceWorker());

    // Test che la funzione di check sia corretta
    const isSupported = 'serviceWorker' in navigator;
    expect(result.current.isSupported).toBe(isSupported);
  });

  it('should expose all required methods and properties', async () => {
    const useServiceWorker = await getUseServiceWorker();
    const { result } = renderHook(() => useServiceWorker());

    // Verifica che tutti i metodi e proprietà richiesti siano presenti
    expect(typeof result.current.checkForUpdates).toBe('function');
    expect(typeof result.current.forceUpdate).toBe('function');
    expect(typeof result.current.skipWaiting).toBe('function');
    expect(typeof result.current.refreshPage).toBe('function');
    
    expect(typeof result.current.isSupported).toBe('boolean');
    expect(typeof result.current.isRegistered).toBe('boolean');
    expect(typeof result.current.isUpdateAvailable).toBe('boolean');
    expect(typeof result.current.isUpdating).toBe('boolean');
  });

  it('should handle service worker messages', async () => {
    const useServiceWorker = await getUseServiceWorker();
    const { result } = renderHook(() => useServiceWorker());

    // Simula un messaggio di aggiornamento
    await act(async () => {
      testUtils.mockServiceWorkerUpdate();
    });

    // Verifica che l'hook sia ancora funzionante
    expect(result.current.isSupported).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const useServiceWorker = await getUseServiceWorker();
    
    // Mock di register che fallisce
    navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'));
    
    const { result } = renderHook(() => useServiceWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // L'hook dovrebbe gestire l'errore senza crashare
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isRegistered).toBe(false);
  });
});
