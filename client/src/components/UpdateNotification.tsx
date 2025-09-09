/**
 * Componente per notificare gli utenti di aggiornamenti disponibili
 * Utilizza Nes.css per lo styling retro
 */

import React from 'react';

export interface UpdateNotificationProps {
  updateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  message?: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  updateAvailable,
  currentVersion,
  latestVersion,
  message,
  onUpdate,
  onDismiss,
}) => {
  if (!updateAvailable) {
    return null;
  }

  const defaultMessage = "Una nuova versione dell'applicazione è disponibile!";
  const displayMessage = message || defaultMessage;

  return (
    <dialog className="nes-dialog is-rounded" open>
      <form method="dialog">
        <div className="flex items-center mb-4">
          <i className="nes-icon is-small trophy"></i>
          <p className="title ml-2">Aggiornamento Disponibile</p>
        </div>

        <div className="mb-4">
          <p className="mb-2">{displayMessage}</p>

          {currentVersion && latestVersion && (
            <div className="nes-container is-rounded is-dark mb-2">
              <p className="text-sm">
                <span className="text-gray-400">Versione attuale:</span>{' '}
                {currentVersion}
              </p>
              <p className="text-sm">
                <span className="text-gray-400">Nuova versione:</span>{' '}
                {latestVersion}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600">
            L'aggiornamento include miglioramenti delle prestazioni e nuove
            funzionalità.
          </p>
        </div>

        <menu className="dialog-menu">
          <button type="button" className="nes-btn" onClick={onDismiss}>
            Più tardi
          </button>
          <button
            type="button"
            className="nes-btn is-primary"
            onClick={onUpdate}
          >
            <i className="nes-icon is-small refresh"></i>
            Aggiorna ora
          </button>
        </menu>
      </form>
    </dialog>
  );
};

/**
 * Componente per mostrare informazioni sulla versione corrente
 */
export interface VersionDisplayProps {
  version: string;
  buildTime?: string;
  gitCommit?: string;
  className?: string;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({
  version,
  buildTime,
  gitCommit,
  className = '',
}) => {
  const formatBuildTime = (time?: string) => {
    if (!time) return '';
    try {
      return new Date(time).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return time;
    }
  };

  return (
    <div className={`nes-container is-rounded ${className}`}>
      <div className="flex items-center mb-2">
        <i className="nes-icon is-small info"></i>
        <span className="ml-2 font-semibold">Versione Applicazione</span>
      </div>

      <div className="text-sm space-y-1">
        <p>
          <span className="text-gray-600">Versione:</span>
          <span className="ml-1 font-mono">{version}</span>
        </p>

        {buildTime && (
          <p>
            <span className="text-gray-600">Build:</span>
            <span className="ml-1">{formatBuildTime(buildTime)}</span>
          </p>
        )}

        {gitCommit && (
          <p>
            <span className="text-gray-600">Commit:</span>
            <span className="ml-1 font-mono text-xs">
              {gitCommit.substring(0, 8)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Hook per gestire il dialog di aggiornamento
 */
export function useUpdateNotificationDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  const showDialog = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideDialog = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    showDialog,
    hideDialog,
  };
}
