import React from 'react';

interface ChallengeContentLayoutProps {
  /** Titolo della gemma (es. "La Gemma dell'Alleanza") */
  gemTitle: string;
  /** Icona della gemma (es. "💎") */
  gemIcon: string;
  /** Descrizione narrativa della challenge */
  description: string;
  /** Testo del suggerimento nel box scuro */
  tip: string;
  /** Progresso corrente (numeratore) */
  progress: number;
  /** Progresso totale (denominatore) */
  total: number;
  /** Etichetta del progresso (es. "Alleati trovati", "Progresso") */
  progressLabel: string;
  /** Se true, mostra lo stato di caricamento */
  isLoading?: boolean;
  /** Se true, la challenge è completata */
  isCompleted?: boolean;
  /** Messaggio di completamento personalizzato */
  completionMessage?: string;
  /** Contenuto principale della challenge */
  children: React.ReactNode;
  /** Informazioni aggiuntive da mostrare nella barra di progresso */
  progressInfo?: React.ReactNode;
}

/**
 * Layout comune per il contenuto delle challenge
 * 
 * Fornisce la struttura standard con:
 * - Sezione descrizione con titolo gemma, testo e tip
 * - Indicatore di progresso uniforme
 * - Gestione stati loading/completed
 * - Container per contenuto specifico della challenge
 */
const ChallengeContentLayout: React.FC<ChallengeContentLayoutProps> = ({
  gemTitle,
  gemIcon,
  description,
  tip,
  progress,
  total,
  progressLabel,
  isLoading = false,
  isCompleted = false,
  completionMessage,
  children,
  progressInfo
}) => {
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="text-sm mb-3 flex items-center justify-start">
            <img src={gemIcon} alt={gemTitle} className="mr-4 h-8" />
            <span className="block font-retro">{gemTitle}</span>
          </h3>
          <p className="text-sm mb-4">
            {description}
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 {tip}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{progressLabel}</span>
            <span data-testid="challenge-progress">
              {progress}/{total}
            </span>
          </div>
          <div className="progress-custom">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              data-testid="progress-bar"
            ></div>
          </div>
          {progressInfo && (
            <div className="mt-2">
              {progressInfo}
            </div>
          )}
        </div>

        {/* Main challenge content */}
        {!isCompleted ? (
          <div className="mb-6">
            {children}
          </div>
        ) : (
          /* Completion message */
          <div className="text-center">
            <div className="nes-container is-success p-4 mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="font-retro text-sm mb-2">Challenge Completata!</h4>
              <p className="text-sm">
                {completionMessage || `${gemTitle} è tua.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeContentLayout;