/**
 * Service per la gestione del versionamento client-side dell'applicazione
 * Integrato con Service Worker per il rilevamento degli aggiornamenti
 */

export interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
}

export class VersionService {
  private currentVersion: string;
  private buildInfo: VersionInfo;

  constructor() {
    // La versione viene iniettata durante il build tramite Vite
    this.currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.buildInfo = {
      version: this.currentVersion,
      buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
      gitCommit: import.meta.env.VITE_GIT_COMMIT
    };
  }

  /**
   * Ottiene la versione corrente dell'applicazione
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Ottiene le informazioni complete del build
   */
  getBuildInfo(): VersionInfo {
    return { ...this.buildInfo };
  }

  /**
   * Confronta due versioni semantic
   * @param version1 Prima versione
   * @param version2 Seconda versione
   * @returns -1 se version1 < version2, 0 se uguali, 1 se version1 > version2
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  /**
   * Controlla se sono disponibili aggiornamenti
   * Utilizza il Service Worker per verificare nuove versioni
   */
  async checkForUpdates(currentVersion?: string): Promise<boolean> {
    const versionToCheck = currentVersion || this.currentVersion;

    try {
      // Primo tentativo: controlla tramite Service Worker cache
      const swUpdateAvailable = await this.checkServiceWorkerUpdate();
      if (swUpdateAvailable) {
        return true;
      }

      // Secondo tentativo: controlla il manifest o un file di versione
      const manifestUpdate = await this.checkManifestUpdate(versionToCheck);
      return manifestUpdate;

    } catch (error) {
      console.warn('Version check failed:', error);
      return false;
    }
  }

  /**
   * Controlla aggiornamenti tramite Service Worker
   */
  private async checkServiceWorkerUpdate(): Promise<boolean> {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return false;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const { type, hasUpdate } = event.data;
        if (type === 'VERSION_CHECK_RESULT') {
          resolve(hasUpdate || false);
        } else {
          resolve(false);
        }
      };

      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        resolve(false);
        return;
      }

      controller.postMessage(
        { type: 'CHECK_VERSION' },
        [channel.port2]
      );

      // Timeout dopo 5 secondi
      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * Controlla aggiornamenti tramite fetch del manifest
   */
  private async checkManifestUpdate(currentVersion: string): Promise<boolean> {
    try {
      // Fetch del manifest con cache busting
      const response = await fetch(`/manifest.json?t=${Date.now()}`, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        return false;
      }

      const manifest = await response.json();
      const serverVersion = manifest.version || currentVersion;

      return this.compareVersions(serverVersion, currentVersion) > 0;

    } catch (error) {
      console.warn('Manifest version check failed:', error);
      return false;
    }
  }

  /**
   * Invia un messaggio al Service Worker
   */
  notifyServiceWorker(type: string, data?: any): void {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      console.warn('Service Worker not available');
      return;
    }

    controller.postMessage({
      type,
      ...data
    });
  }

  /**
   * Configura listener per eventi di aggiornamento dal Service Worker
   */
  setupUpdateListener(callback: (updateAvailable: boolean) => void): void {
    if (!navigator.serviceWorker) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, hasUpdate } = event.data;

      switch (type) {
        case 'UPDATE_AVAILABLE':
          callback(true);
          break;
        case 'VERSION_CHECK_RESULT':
          callback(hasUpdate || false);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Forza il refresh dell'applicazione per applicare aggiornamenti
   */
  applyUpdate(): void {
    // Notifica il Service Worker di saltare la waiting
    this.notifyServiceWorker('SKIP_WAITING');

    // Ricarica la pagina dopo un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}
