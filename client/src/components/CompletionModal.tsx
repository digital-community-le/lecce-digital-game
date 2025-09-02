import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from '@/components/UiDialog';

const CompletionModal: React.FC = () => {
  const { modals, closeModal, openModal, gameState } = useGameStore();
  const isOpen = modals.completion?.isOpen;
  const completionData = modals.completion?.data;

  const handleClose = () => {
    closeModal('completion');
    
    // Check if all challenges are completed for final epilogue
    if (gameState.gameProgress.completedChallenges.length === 4) {
      setTimeout(() => {
        openModal('epilogue');
      }, 500);
    }
  };

  const getChallengeEmoji = (challengeId: string) => {
    switch (challengeId) {
      case 'networking-forest': return '🌲';
      case 'retro-puzzle': return '🧩';
      case 'debug-dungeon': return '⚔️';
      case 'social-arena': return '📱';
      default: return '🏆';
    }
  };

  if (!isOpen || !completionData) return null;

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('completion')} title="✨ Challenge Completata!" className="max-w-md">
      <div className="text-center p-4" data-testid="modal-completion">
        {/* Celebration content */}
        <div className="text-6xl mb-4" data-testid="completion-emoji">
          {getChallengeEmoji(completionData.challengeId)}
        </div>
        <h3 className="font-retro text-sm mb-3" data-testid="completion-title">
          {completionData.title}
        </h3>
        <p className="text-sm mb-4" data-testid="completion-description">
          {completionData.description}
        </p>

        {/* Score display */}
        <div className="nes-container is-light p-3 mb-4">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Punteggio:</span>
              <span className="font-retro" data-testid="completion-score">
                {completionData.score} pts
              </span>
            </div>
            {completionData.time && (
              <div className="flex justify-between">
                <span>Tempo:</span>
                <span data-testid="completion-time">{completionData.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <button 
          className="nes-btn is-primary" 
          onClick={handleClose}
          data-testid="button-continue-adventure"
        >
          Continua l'avventura
        </button>
      </div>
    </UiDialog>
  );
};

export default CompletionModal;
