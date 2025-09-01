import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';

const CompletionModal: React.FC = () => {
  const { modals, closeModal, gameState } = useGameStore();
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
    <div className="modal-overlay" data-testid="modal-completion">
      <div className="modal-content nes-container with-title bg-card max-w-md w-full">
        <p className="title bg-card">✨ Challenge Completata!</p>
        
        <div className="text-center p-4">
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
      </div>
    </div>
  );
};

export default CompletionModal;
