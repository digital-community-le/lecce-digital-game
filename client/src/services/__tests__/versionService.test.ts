/**
 * Test per il sistema di version management client-side
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VersionService } from '../versionService';

// Mock delle API del browser
const mockServiceWorker = {
  controller: null as any,
  addEventListener: vi.fn()
};

const mockFetch = vi.fn();

// Mock MessageChannel più completo
const mockMessageChannel = vi.fn().mockImplementation(() => {
  const port1 = { onmessage: null };
  const port2 = {};
  return { port1, port2 };
});

// Setup mocks globali
Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  writable: true
});

Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true
});

Object.defineProperty(globalThis, 'MessageChannel', {
  value: mockMessageChannel,
  writable: true
});

// Mock setTimeout per controllare i timeout nei test
vi.useFakeTimers();

// Mock di import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_APP_VERSION: '1.0.0',
    VITE_BUILD_TIME: '2024-01-01T00:00:00.000Z',
    VITE_GIT_COMMIT: 'abc123'
  }
}));

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset service worker controller to null
    mockServiceWorker.controller = null;

    versionService = new VersionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('getCurrentVersion', () => {
    it('should return the current application version', () => {
      const version = versionService.getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
  });

  describe('checkForUpdates', () => {
    it('should return false when service worker is not available', async () => {
      // Ensure service worker is disabled
      mockServiceWorker.controller = null;

      // Mock fetch to fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const hasUpdate = await versionService.checkForUpdates('1.0.0');
      expect(hasUpdate).toBe(false);
    });

    it('should detect update via manifest when service worker unavailable', async () => {
      // Ensure service worker is completely disabled for this test
      const originalSW = (globalThis as any).navigator.serviceWorker;
      (globalThis as any).navigator.serviceWorker = null;

      // Mock fetch to return newer version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.1' })
      });

      const hasUpdate = await versionService.checkForUpdates('1.0.0');

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/manifest.json?t='),
        { cache: 'no-cache' }
      );

      expect(hasUpdate).toBe(true);

      // Restore
      (globalThis as any).navigator.serviceWorker = originalSW;
    });

    it('should return false when manifest has same version', async () => {
      // Ensure service worker is disabled
      mockServiceWorker.controller = null;

      // Mock fetch to return same version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' })
      });

      const hasUpdate = await versionService.checkForUpdates('1.0.0');
      expect(hasUpdate).toBe(false);
    });

    it('should handle service worker communication', async () => {
      // Setup service worker mock
      const mockController = { postMessage: vi.fn() };
      mockServiceWorker.controller = mockController;

      // For this test, we'll mock the private method behavior
      // Since checkServiceWorkerUpdate is complex, we'll test timeout scenario

      // Mock fetch as fallback
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' })
      });

      const hasUpdate = await versionService.checkForUpdates('1.0.0');

      // Should attempt SW communication then fallback to manifest
      expect(hasUpdate).toBe(false); // Same version
    });
  });

  describe('compareVersions', () => {
    it('should correctly compare semantic versions', () => {
      expect(versionService.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(versionService.compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(versionService.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(versionService.compareVersions('1.1.0', '1.0.9')).toBe(1);
      expect(versionService.compareVersions('2.0.0', '1.9.9')).toBe(1);
    });
  });

  describe('notifyServiceWorker', () => {
    it('should send update message to service worker when available', () => {
      // Setup service worker controller using the same mockServiceWorker reference
      const mockPostMessage = vi.fn();
      const originalServiceWorker = (globalThis as any).navigator.serviceWorker;

      // Replace with a fresh mock for this test
      (globalThis as any).navigator.serviceWorker = {
        controller: {
          postMessage: mockPostMessage
        }
      };

      versionService.notifyServiceWorker('CHECK_VERSION');

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'CHECK_VERSION'
      });

      // Restore original mock
      (globalThis as any).navigator.serviceWorker = originalServiceWorker;
    });

    it('should handle missing service worker gracefully', () => {
      // Ensure controller is null
      const originalServiceWorker = (globalThis as any).navigator.serviceWorker;

      (globalThis as any).navigator.serviceWorker = {
        controller: null
      };

      // Should not throw
      expect(() => {
        versionService.notifyServiceWorker('CHECK_VERSION');
      }).not.toThrow();

      // Restore
      (globalThis as any).navigator.serviceWorker = originalServiceWorker;
    });
  });

  describe('setupUpdateListener', () => {
    it('should setup listener for service worker update events', () => {
      const callback = vi.fn();
      const mockAddEventListener = vi.fn();

      // Replace with fresh mock for this test
      const originalServiceWorker = (globalThis as any).navigator.serviceWorker;
      (globalThis as any).navigator.serviceWorker = {
        addEventListener: mockAddEventListener
      };

      versionService.setupUpdateListener(callback);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );

      // Restore
      (globalThis as any).navigator.serviceWorker = originalServiceWorker;
    });

    it('should handle missing service worker in setupUpdateListener', () => {
      const callback = vi.fn();

      // Temporarily remove serviceWorker to test fallback
      const originalSW = (globalThis as any).navigator.serviceWorker;
      (globalThis as any).navigator.serviceWorker = undefined;

      expect(() => {
        versionService.setupUpdateListener(callback);
      }).not.toThrow();

      // Restore
      (globalThis as any).navigator.serviceWorker = originalSW;
    });
  });
});
