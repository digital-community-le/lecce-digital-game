import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import gameData from '@/assets/game-data.json';

const CompletionModal: React.FC = () => {
  const { modals, closeModal, openModal, gameState } = useGameStore();
  const isOpen = modals.completion?.isOpen;
  const completionData = modals.completion?.data;
  const [animationPhase, setAnimationPhase] = useState<'gem' | 'title' | 'message' | 'button'>('gem');

  const handleClose = () => {
    closeModal('completion');
    
    // Check if all challenges are completed for final epilogue
    if (gameState.gameProgress.completedChallenges.length === 4) {
      setTimeout(() => {
        openModal('epilogue');
      }, 500);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAnimationPhase('gem');
      const timer1 = setTimeout(() => setAnimationPhase('title'), 1000);
      const timer2 = setTimeout(() => setAnimationPhase('message'), 1500);
      const timer3 = setTimeout(() => setAnimationPhase('button'), 2500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  const getChallengeData = (challengeId: string) => {
    // Trova i dati della challenge dal game-data.json
    const challenge = gameData.challenges.find(c => c.id === challengeId);
    
    // Mappa le immagini delle gemme
    const gemImages: Record<string, string> = {
      'networking-forest': '/assets/images/gem-of-alliance.png',
      'retro-puzzle': '/assets/images/gem-of-memory.png', 
      'debug-dungeon': '/assets/images/gem-of-wisdom.png',
      'social-arena': '/assets/images/gem-of-community.png'
    };
    
    return {
      gemImage: gemImages[challengeId] || '/assets/images/gem-of-alliance.png',
      completionTitle: challenge?.completion?.title || 'Challenge Completata',
      completionMessage: challenge?.completion?.message || 'Hai completato la challenge!'
    };
  };


  if (!isOpen || !completionData) return null;

  const challengeData = getChallengeData(completionData.challengeId);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      data-testid="modal-completion"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-2xl text-center text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Gem Entry */}
        <div className="mb-8">
          <div 
            className={`w-32 h-32 mx-auto transition-all duration-1000 ${
              animationPhase === 'gem' 
                ? 'scale-0 opacity-0' 
                : 'scale-100 opacity-100'
            }`}
            style={{
              animation: animationPhase !== 'gem' ? 'gemZoomIn 1s ease-out forwards' : 'none'
            }}
          >
            <img 
              src={challengeData.gemImage}
              alt="Gemma conquistata"
              className="w-full h-full object-contain pixelated filter drop-shadow-lg"
              data-testid="completion-gem-image"
              style={{
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
              }}
            />
          </div>
        </div>

        {/* Title - Fades in after gem */}
        <div 
          className={`mb-6 transition-all duration-800 ${
            animationPhase === 'gem' || animationPhase === 'title'
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <h2 
            className="font-retro text-2xl md:text-3xl text-yellow-300 mb-2"
            data-testid="completion-title"
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0 0 10px rgba(255, 255, 0, 0.3)'
            }}
          >
            {challengeData.completionTitle}
          </h2>
        </div>

        {/* Message - Fades in after title */}
        <div 
          className={`mb-8 transition-all duration-800 delay-300 ${
            ['gem', 'title', 'message'].includes(animationPhase)
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="bg-gray-900/80 border-2 border-yellow-600 p-6 mx-4">
            <p 
              className="text-lg leading-relaxed text-gray-100"
              data-testid="completion-description"
              style={{
                textShadow: '1px 1px 0px rgba(0,0,0,0.8)'
              }}
            >
              {challengeData.completionMessage}
            </p>
            
            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-yellow-600/50 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-gray-400">Punti</div>
                <div className="font-retro text-xl text-yellow-300" data-testid="completion-score">
                  {completionData.score}
                </div>
              </div>
              {completionData.time && (
                <div className="text-center">
                  <div className="text-sm text-gray-400">Tempo</div>
                  <div className="font-retro text-xl text-yellow-300" data-testid="completion-time">
                    {completionData.time}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Button - Fades in last */}
        <div 
          className={`transition-all duration-800 delay-500 ${
            animationPhase !== 'button'
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <button 
            className="nes-btn is-success font-retro text-lg px-8 py-4 hover:scale-105 transition-transform"
            onClick={handleClose}
            data-testid="button-continue-adventure"
            style={{
              textShadow: '1px 1px 0px rgba(0,0,0,0.8)'
            }}
          >
            Continua l'avventura
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
