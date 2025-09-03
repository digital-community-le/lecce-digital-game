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
      // Start with gem phase (zoom-in animation)
      setAnimationPhase('gem');

      // Timing config (ms)
      const zoomDuration = 1000; // matches CSS animation 'gemZoomIn 1s'
      const waitAfterZoom = 2000; // wait 2s after zoom finishes
      const delta = 1000; // 1s between successive elements

      const titleAt = zoomDuration + waitAfterZoom; // show title
      const messageAt = titleAt + delta; // show message
      const buttonAt = titleAt + delta * 2; // show button

      const tTitle = setTimeout(() => setAnimationPhase('title'), titleAt);
      const tMessage = setTimeout(() => setAnimationPhase('message'), messageAt);
      const tButton = setTimeout(() => setAnimationPhase('button'), buttonAt);

      return () => {
        clearTimeout(tTitle);
        clearTimeout(tMessage);
        clearTimeout(tButton);
      };
    }
  }, [isOpen]);

  const getChallengeData = async (challengeId: string) => {
    // Trova i dati della challenge dal game-data.json
    const challenge = gameData.challenges.find((c) => c.id === challengeId);

    // If challenge or required metadata is missing, log and close modal as requested
    if (!challenge) {
      console.error(`CompletionModal: missing challenge data for id=${challengeId} in game-data.json`);
      closeModal('completion');
      throw new Error('MISSING_GAME_DATA');
    }

    if (!challenge.completion || !(challenge as any).gemImage) {
      console.error(`CompletionModal: incomplete challenge entry for id=${challengeId} (missing completion or gemImage) in game-data.json`);
      closeModal('completion');
      throw new Error('MISSING_GAME_DATA');
    }

    const completionTitle = challenge.completion.title || 'Challenge Completata';
    const completionMessage = challenge.completion.message || 'Hai completato la challenge!';

    // Build import path using @assets alias which points to /public/assets
    // strip leading slash if present and ensure path starts with @assets
    const importPath: string = (challenge as any).gemImage || '';

    try {
      // dynamic import - Vite may complain for dynamic strings, using vite-ignore to allow runtime import
      // @ts-ignore
      const mod = await import(/* @vite-ignore */ importPath);
      const src = mod?.default || mod;
      return { gemImage: src, completionTitle, completionMessage };
    } catch (e) {
      console.error(`CompletionModal: failed to import gem image module for id=${challengeId} path=${importPath}`, e);
      // Close modal as the assets are expected to be present under @assets
      closeModal('completion');
      throw new Error('MISSING_GAME_ASSET');
    }
  };


  const [challengeData, setChallengeData] = useState<{ gemImage: string; completionTitle: string; completionMessage: string } | null>(null);
  const [loadingGem, setLoadingGem] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (isOpen && completionData) {
      setLoadingGem(true);
      getChallengeData(completionData.challengeId)
        .then((d) => { if (mounted) setChallengeData(d); })
        .catch(() => { if (mounted) setChallengeData({ gemImage: '@assets/images/gem-of-alliance.png', completionTitle: 'Challenge Completata', completionMessage: 'Hai completato la challenge!' }); })
        .finally(() => { if (mounted) setLoadingGem(false); });
    }
    return () => { mounted = false; };
  }, [isOpen, completionData]);

  if (!isOpen || !completionData) return null;
  if (loadingGem || !challengeData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto"
      data-testid="modal-completion"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-2xl text-center text-white my-8 max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Gem Entry */}
        <div className="mb-8 py-8">
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
          <div className="nes-container with-title is-dark mx-4" style={{ borderColor: '#d97706' }}>
            <p className="title" style={{ color: '#fbbf24' }}>Risultato</p>
            <p 
              className="text-lg leading-relaxed text-gray-100 mb-4"
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
