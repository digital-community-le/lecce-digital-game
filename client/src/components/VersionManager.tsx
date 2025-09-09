/**
 * Provider React per la gestione del sistema di versionamento
 * Integra tutti i componenti del version management in un unico provider
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  useVersionCheck,
  UseVersionCheckOptions,
  UseVersionCheckResult,
} from '../hooks/useVersionCheck';
import { UpdateNotification } from './UpdateNotification';

export interface VersionManagerContextValue extends UseVersionCheckResult {
  showVersionInfo: boolean;
  setShowVersionInfo: (show: boolean) => void;
}

const VersionManagerContext = createContext<VersionManagerContextValue | null>(
  null
);

export interface VersionManagerProviderProps {
  children: ReactNode;
  options?: UseVersionCheckOptions;
  showUpdateNotification?: boolean;
  updateNotificationMessage?: string;
}

export const VersionManagerProvider: React.FC<VersionManagerProviderProps> = ({
  children,
  options = {},
  showUpdateNotification = true,
  updateNotificationMessage,
}) => {
  const [showVersionInfo, setShowVersionInfo] = React.useState(false);

  const versionCheck = useVersionCheck({
    autoCheck: true,
    checkInterval: 60000, // 1 minuto
    ...options,
  });

  const contextValue: VersionManagerContextValue = {
    ...versionCheck,
    showVersionInfo,
    setShowVersionInfo,
  };

  return (
    <VersionManagerContext.Provider value={contextValue}>
      {children}

      {showUpdateNotification && (
        <UpdateNotification
          updateAvailable={versionCheck.updateAvailable}
          message={updateNotificationMessage}
          onUpdate={versionCheck.applyUpdate}
          onDismiss={versionCheck.dismissUpdate}
        />
      )}
    </VersionManagerContext.Provider>
  );
};

/**
 * Hook per utilizzare il context del VersionManager
 */
export function useVersionManager(): VersionManagerContextValue {
  const context = useContext(VersionManagerContext);

  if (!context) {
    throw new Error(
      'useVersionManager must be used within a VersionManagerProvider'
    );
  }

  return context;
}

/**
 * Componente per mostrare informazioni sulla versione nell'UI
 */
export interface VersionInfoProps {
  className?: string;
  showBuildInfo?: boolean;
  showGitInfo?: boolean;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({
  className = '',
  showBuildInfo = true,
  showGitInfo = false,
}) => {
  const { currentVersion, buildInfo } = useVersionManager();

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span>v{currentVersion}</span>
      {showBuildInfo && buildInfo.buildTime && (
        <span className="ml-2">
          Build: {new Date(buildInfo.buildTime).toLocaleDateString('it-IT')}
        </span>
      )}
      {showGitInfo && buildInfo.gitCommit && (
        <span className="ml-2 font-mono">
          {buildInfo.gitCommit.substring(0, 7)}
        </span>
      )}
    </div>
  );
};

/**
 * Pulsante per controllare manualmente gli aggiornamenti
 */
export interface CheckUpdateButtonProps {
  className?: string;
  children?: ReactNode;
}

export const CheckUpdateButton: React.FC<CheckUpdateButtonProps> = ({
  className = '',
  children = 'Controlla aggiornamenti',
}) => {
  const { checkForUpdates, isCheckingForUpdates } = useVersionManager();

  return (
    <button
      className={`nes-btn ${isCheckingForUpdates ? 'is-disabled' : ''} ${className}`}
      onClick={checkForUpdates}
      disabled={isCheckingForUpdates}
    >
      {isCheckingForUpdates ? (
        <>
          <i className="nes-icon is-small loading"></i>
          Controllo...
        </>
      ) : (
        children
      )}
    </button>
  );
};
