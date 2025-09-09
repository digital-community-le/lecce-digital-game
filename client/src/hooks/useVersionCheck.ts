/**
 * Hook React per la gestione del controllo versioni e aggiornamenti
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VersionService, VersionInfo } from '../services/versionService';

export interface UseVersionCheckOptions {
  autoCheck?: boolean;
  checkInterval?: number; // in milliseconds
  onUpdateAvailable?: (version: string) => void;
}

export interface UseVersionCheckResult {
  currentVersion: string;
  buildInfo: VersionInfo;
  updateAvailable: boolean;
  isCheckingForUpdates: boolean;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

export function useVersionCheck(options: UseVersionCheckOptions = {}): UseVersionCheckResult {
  const {
    autoCheck = false,
    checkInterval = 30000, // 30 secondi default
    onUpdateAvailable
  } = options;

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const versionServiceRef = useRef<VersionService>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Inizializza il VersionService
  if (!versionServiceRef.current) {
    versionServiceRef.current = new VersionService();
  }

  const versionService = versionServiceRef.current;
  const currentVersion = versionService.getCurrentVersion();
  const buildInfo = versionService.getBuildInfo();

  /**
   * Controlla manualmente per aggiornamenti
   */
  const checkForUpdates = useCallback(async () => {
    if (isCheckingForUpdates) return;

    setIsCheckingForUpdates(true);

    try {
      const hasUpdate = await versionService.checkForUpdates();

      if (hasUpdate && !isDismissed) {
        setUpdateAvailable(true);
        onUpdateAvailable?.(currentVersion);
      }
    } catch (error) {
      console.warn('Failed to check for updates:', error);
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [versionService, currentVersion, isCheckingForUpdates, isDismissed, onUpdateAvailable]);

  /**
   * Applica l'aggiornamento ricaricando l'applicazione
   */
  const applyUpdate = useCallback(() => {
    versionService.applyUpdate();
  }, [versionService]);

  /**
   * Nasconde la notifica di aggiornamento fino al prossimo check
   */
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    setIsDismissed(true);
  }, []);

  // Setup del listener per aggiornamenti automatici dal Service Worker
  useEffect(() => {
    const handleUpdateNotification = (hasUpdate: boolean) => {
      if (hasUpdate && !isDismissed) {
        setUpdateAvailable(true);
        onUpdateAvailable?.(currentVersion);
      }
    };

    versionService.setupUpdateListener(handleUpdateNotification);
  }, [versionService, currentVersion, isDismissed, onUpdateAvailable]);

  // Setup del controllo automatico periodico
  useEffect(() => {
    if (!autoCheck) return;

    // Check iniziale
    checkForUpdates();

    // Setup intervallo
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCheck, checkInterval, checkForUpdates]);

  // Reset del dismissed state quando viene rilevato un nuovo aggiornamento
  useEffect(() => {
    if (updateAvailable) {
      setIsDismissed(false);
    }
  }, [updateAvailable]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentVersion,
    buildInfo,
    updateAvailable: updateAvailable && !isDismissed,
    isCheckingForUpdates,
    checkForUpdates,
    applyUpdate,
    dismissUpdate
  };
}
