import React from 'react';
import ChallengeCompleted from '../ChallengeCompleted';

interface ChallengeContentLayoutProps {
  /** Titolo della gemma (es. "La Gemma dell'Alleanza") */
  gemTitle: string;
  /** Icona della gemma (es. "💎") */
  gemIcon: string;
  /** Descrizione narrativa della challenge */
  description: string;
  /** Testo del suggerimento nel box scuro */
  tip: string;
  /** Progresso corrente (numeratore) - opzionale */
  progress?: number;
  /** Progresso totale (denominatore) - opzionale */
  total?: number;
  /** Etichetta del progresso (es. "Alleati trovati", "Progresso") - opzionale */
  progressLabel?: string;
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
  progressInfo,
}) => {
  const progressPercentage =
    total && progress ? (total > 0 ? (progress / total) * 100 : 0) : 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="challenge-content-layout">
      <div className="challenge-description p-8 mb-6 flex flex-col gap-6">
        {/* Challenge description */}
        <p className="">{description}</p>

        {/* Challenge tip */}
        <div className="nes-container is-rounded bg-yellow-100 flex items-center">
          <span className="text-2xl mr-2 pixelated">💡</span>
          <p className="text-xs text-gray-700 m-0">{tip}</p>
        </div>

        {/* Progress indicator - only show if progress props are provided */}
        {progress !== undefined && total !== undefined && progressLabel && (
          <div>
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
            {progressInfo && <div className="mt-2">{progressInfo}</div>}
          </div>
        )}
      </div>

      <div className="p-8 pt-4">
        {/* Main challenge content */}
        {!isCompleted ? (
          <div className="mb-6">{children}</div>
        ) : (
          /* Completion message */
          <ChallengeCompleted
            title="Challenge Completata!"
            message={
              completionMessage ||
              'Hai completato con successo questa challenge e guadagnato la gemma!'
            }
            emoji="🏆"
          />
        )}
      </div>
    </div>
  );
};

export default ChallengeContentLayout;
