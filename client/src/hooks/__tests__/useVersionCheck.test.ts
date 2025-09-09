/**
 * Test per l'hook useVersionCheck
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionCheck } from '../useVersionCheck';
import { VersionService } from '../../services/versionService';

// Mock del VersionService
vi.mock('../../services/versionService');

const mockVersionService = {
  getCurrentVersion: vi.fn(),
  getBuildInfo: vi.fn(),
  checkForUpdates: vi.fn(),
  setupUpdateListener: vi.fn(),
  applyUpdate: vi.fn()
};

// Setup fake timers
vi.useFakeTimers();

describe('useVersionCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    (VersionService as any).mockImplementation(() => mockVersionService);

    mockVersionService.getCurrentVersion.mockReturnValue('1.0.0');
    mockVersionService.getBuildInfo.mockReturnValue({
      version: '1.0.0',
      buildTime: '2024-01-01T00:00:00.000Z'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it('should initialize with current version info', () => {
    const { result } = renderHook(() => useVersionCheck());

    expect(result.current.currentVersion).toBe('1.0.0');
    expect(result.current.buildInfo).toEqual({
      version: '1.0.0',
      buildTime: '2024-01-01T00:00:00.000Z'
    });
    expect(result.current.isCheckingForUpdates).toBe(false);
    expect(result.current.updateAvailable).toBe(false);
  });

  it('should check for updates when checkForUpdates is called', async () => {
    mockVersionService.checkForUpdates.mockResolvedValue(true);

    const { result } = renderHook(() => useVersionCheck());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(mockVersionService.checkForUpdates).toHaveBeenCalled();
    expect(result.current.updateAvailable).toBe(true);
  });

  it('should handle update check failures gracefully', async () => {
    mockVersionService.checkForUpdates.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVersionCheck());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.isCheckingForUpdates).toBe(false);
  });

  it('should apply updates when applyUpdate is called', () => {
    const { result } = renderHook(() => useVersionCheck());

    act(() => {
      result.current.applyUpdate();
    });

    expect(mockVersionService.applyUpdate).toHaveBeenCalled();
  });

  it('should setup update listener on mount', () => {
    renderHook(() => useVersionCheck());

    expect(mockVersionService.setupUpdateListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should handle automatic update notifications', () => {
    let updateCallback: (updateAvailable: boolean) => void;

    mockVersionService.setupUpdateListener.mockImplementation((callback) => {
      updateCallback = callback;
    });

    const { result } = renderHook(() => useVersionCheck());

    act(() => {
      updateCallback(true);
    });

    expect(result.current.updateAvailable).toBe(true);
  });

  it('should automatically check for updates when enabled', async () => {
    mockVersionService.checkForUpdates.mockResolvedValue(false);

    const { result } = renderHook(() => useVersionCheck({
      autoCheck: true,
      checkInterval: 100
    }));

    // Fast forward past the initial check interval
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(mockVersionService.checkForUpdates).toHaveBeenCalled();
  });
});
