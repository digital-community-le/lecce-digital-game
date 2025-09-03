import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from '@/components/UiDialog';
import gameData from '@/assets/game-data.json';

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
    // Trova i dati della challenge dal game-data.json
    const challenge = gameData.challenges.find(c => c.id === challengeId);
    const badge = gameData.rewards.badges.find(b => 
      b.name === challenge?.rewards.badge || 
      (challengeId === 'social-arena' && b.id === 'social-champion')
    );
    
    // Mappa le immagini delle gemme
    const gemImages: Record<string, string> = {
      'networking-forest': '/assets/images/gem-of-alliance.png',
      'retro-puzzle': '/assets/images/gem-of-memory.png', 
      'debug-dungeon': '/assets/images/gem-of-wisdom.png',
      'social-arena': '/assets/images/gem-of-community.png'
    };
    
    return {
      name: badge?.name || challenge?.rewards.badge || 'Gemma Misteriosa',
      description: badge?.description || challenge?.description || '',
      image: gemImages[challengeId] || '/assets/images/gem-of-alliance.png',
      icon: badge?.icon || challenge?.emoji || '💎'
    };
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
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 rounded-full blur-xl opacity-60"></div>
          <div className="relative z-10">
            {/* Gemma principale con immagine */}
            <div className="mb-4 flex justify-center">
              <div className="relative w-24 h-24 animate-bounce">
                <img 
                  src={gem.image} 
                  alt={gem.name}
                  className="w-full h-full object-contain pixelated drop-shadow-lg"
                  data-testid="completion-gem-image"
                />
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
                  ✨
                </div>
                <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse" style={{animationDelay: '0.5s'}}>
                  ✨
                </div>
              </div>
            </div>
            
            {/* Icona challenge */}
            <div className="text-3xl mb-2 opacity-75" data-testid="completion-emoji">
              {getChallengeEmoji(completionData.challengeId)}
            </div>
          </div>
        </div>

        {/* Immersive title focusing on gem */}
        <div className="nes-container is-success p-4 mb-4">
          <h3 className="font-retro text-lg mb-3 text-center" data-testid="completion-title">
            🎉 {gem.name} Conquistata! 🎉
          </h3>
          
          {/* Narrative description */}
          <div className="text-sm leading-relaxed mb-3" data-testid="completion-description">
            <div className="italic text-center mb-2">
              "{gem.description}"
            </div>
            <p className="text-center">
              La gemma brilla di una luce antica e potente. {completionData.description}
            </p>
          </div>
          
          <div className="text-xs text-center text-muted-foreground italic border-t pt-2">
            Il potere del {getChallengeEmoji(completionData.challengeId)} ora fluisce attraverso la {gem.name.toLowerCase()}, arricchendo il tuo viaggio verso il Sigillo di Lecce.
          </div>
        </div>

        {/* Mystical gem power display */}
        <div className="nes-container is-dark p-4 mb-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 animate-pulse"></div>
          <div className="relative z-10">
            <div className="text-xs text-center text-yellow-300 mb-3 font-retro">
              🌟 Potere Acquisito 🌟
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Energia Magica</div>
                <div className="font-retro text-primary text-lg" data-testid="completion-score">
                  {completionData.score}
                </div>
                <div className="text-xs text-yellow-300">punti</div>
              </div>
              
              {completionData.time && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Tempo Impiegato</div>
                  <div className="font-retro text-accent text-lg" data-testid="completion-time">
                    {completionData.time}
                  </div>
                  <div className="text-xs text-yellow-300">per la conquista</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Epic action button with gem theme */}
        <div className="relative">
          <button 
            className="nes-btn is-success text-sm px-8 py-3 relative overflow-hidden" 
            onClick={handleClose}
            data-testid="button-continue-adventure"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
            <span className="relative z-10 flex items-center gap-2">
              <span className="animate-bounce">🗺️</span>
              Ritorna alla Mappa del Tesoro
              <span className="animate-bounce" style={{animationDelay: '0.3s'}}>✨</span>
            </span>
          </button>
        </div>
        
        {/* Mystical gem collection progress */}
        <div className="mt-4 p-3 border border-dashed border-yellow-400/50 rounded bg-yellow-50/10">
          <div className="text-xs text-center text-yellow-300 font-retro">
            📜 Registro delle Gemme 📜
          </div>
          <div className="text-sm text-center mt-1 text-muted-foreground">
            {gameState.gameProgress.completedChallenges.length}/4 gemme nel Sigillo
          </div>
          {gameState.gameProgress.completedChallenges.length === 4 && (
            <div className="text-xs text-center mt-1 text-yellow-400 animate-pulse">
              Il Sigillo di Lecce è completo! 🏆
            </div>
          )}
        </div>
      </div>
    </UiDialog>
  );
};

export default CompletionModal;
