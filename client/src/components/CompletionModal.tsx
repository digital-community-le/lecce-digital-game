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

  const getChallengeGem = (challengeId: string) => {
    switch (challengeId) {
      case 'networking-forest': return { emoji: '💎', color: 'emerald', name: 'Gemma dell\'Alleanza' };
      case 'retro-puzzle': return { emoji: '💎', color: 'blue', name: 'Gemma della Logica' };
      case 'debug-dungeon': return { emoji: '💎', color: 'red', name: 'Gemma del Coraggio' };
      case 'social-arena': return { emoji: '💎', color: 'purple', name: 'Gemma della Condivisione' };
      default: return { emoji: '💎', color: 'gold', name: 'Gemma Misteriosa' };
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

  const gem = getChallengeGem(completionData.challengeId);

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('completion')} title="" className="max-w-lg">
      <div className="text-center p-6" data-testid="modal-completion">
        {/* Magical gem reveal animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 rounded-full blur-lg opacity-50"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-2 animate-bounce" data-testid="completion-gem">
              {gem.emoji}
            </div>
            <div className="text-4xl mb-4 animate-pulse" data-testid="completion-emoji">
              {getChallengeEmoji(completionData.challengeId)}
            </div>
          </div>
        </div>

        {/* Immersive title focusing on gem */}
        <h3 className="font-retro text-lg mb-2 text-primary" data-testid="completion-title">
          {gem.name} Ottenuta!
        </h3>
        
        {/* Narrative description */}
        <div className="nes-container is-success p-4 mb-4">
          <p className="text-sm mb-2 leading-relaxed" data-testid="completion-description">
            La luce magica avvolge la gemma appena conquistata. {completionData.description}
          </p>
          <div className="text-xs text-muted-foreground italic">
            Il potere del {getChallengeEmoji(completionData.challengeId)} ora scorre attraverso la gemma, rendendola parte del tuo destino.
          </div>
        </div>

        {/* Mystical stats display */}
        <div className="nes-container is-dark p-4 mb-6">
          <div className="text-sm text-center">
            <div className="text-xs text-muted-foreground mb-2">✨ Potere della Gemma ✨</div>
            <div className="flex justify-between items-center">
              <span>Energia Magica:</span>
              <span className="font-retro text-primary" data-testid="completion-score">
                {completionData.score} punti
              </span>
            </div>
            {completionData.time && (
              <div className="flex justify-between items-center mt-1">
                <span>Tempo di Conquista:</span>
                <span className="text-accent" data-testid="completion-time">{completionData.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Epic action button */}
        <button 
          className="nes-btn is-success text-sm px-6 py-3" 
          onClick={handleClose}
          data-testid="button-continue-adventure"
        >
          <span className="mr-2">🗺️</span>
          Ritorna alla Mappa Magica
        </button>
        
        {/* Subtle gem collection progress */}
        <div className="mt-4 text-xs text-muted-foreground">
          Gemme raccolte: {gameState.gameProgress.completedChallenges.length}/4
        </div>
      </div>
    </UiDialog>
  );
};

export default CompletionModal;
