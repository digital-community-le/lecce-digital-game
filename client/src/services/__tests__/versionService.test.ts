/**
 * Test per il sistema di version management client-side
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VersionService } from '../versionService';

// Mock delle API del browser
const mockServiceWorker = {
  controller: {
    postMessage: vi.fn()
  },
  addEventListener: vi.fn()
};

const mockFetch = vi.fn();
const mockMessageChannel = vi.fn(() => ({
  port1: { onmessage: null },
  port2: {}
}));

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
    versionService = new VersionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentVersion', () => {
    it('should return the current application version', () => {
      const version = versionService.getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
  });

  describe('checkForUpdates', () => {
    it('should return false when service worker is not available', async () => {
      // Disable service worker
      (mockServiceWorker as any).controller = null;

      // Mock fetch to fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const hasUpdate = await versionService.checkForUpdates('1.0.0');
      expect(hasUpdate).toBe(false);
    });

    it('should detect update via manifest when service worker unavailable', async () => {
      // Disable service worker
      (mockServiceWorker as any).controller = null;

      // Mock fetch to return newer version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.1' })
      });

      const hasUpdate = await versionService.checkForUpdates('1.0.0');
      expect(hasUpdate).toBe(true);
    });

    it('should return false when manifest has same version', async () => {
      // Disable service worker
      (mockServiceWorker as any).controller = null;

      // Mock fetch to return same version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' })
      });

      const hasUpdate = await versionService.checkForUpdates('1.0.0');
      expect(hasUpdate).toBe(false);
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
      // Ensure service worker controller is available
      (mockServiceWorker as any).controller = {
        postMessage: vi.fn()
      };

      versionService.notifyServiceWorker('CHECK_VERSION');

      expect((mockServiceWorker as any).controller.postMessage).toHaveBeenCalledWith({
        type: 'CHECK_VERSION'
      });
    });

    it('should handle missing service worker gracefully', () => {
      (mockServiceWorker as any).controller = null;

      // Should not throw
      expect(() => {
        versionService.notifyServiceWorker('CHECK_VERSION');
      }).not.toThrow();
    });
  });

  describe('setupUpdateListener', () => {
    it('should setup listener for service worker update events', () => {
      const callback = vi.fn();
      versionService.setupUpdateListener(callback);

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });
});
