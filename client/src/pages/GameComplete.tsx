import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import gameData from '@/assets/game-data.json';
import sealWithGemsImage from '@assets/images/seal-with-gems.png';

const GameComplete: React.FC = () => {
  const { gameState } = useGameStore();
  const [, setLocation] = useLocation();
  const [animationPhase, setAnimationPhase] = useState<'seal' | 'title' | 'description'>('seal');
  
  const { finalCompletion } = gameData;

  useEffect(() => {
    // If game not completed, redirect to main game map
    if (!gameState.gameProgress.gameCompleted) {
      setLocation('/game');
      return;
    }

    // Sequential animation phases
    setAnimationPhase('seal');
    const timer1 = setTimeout(() => setAnimationPhase('title'), 1200);
    const timer2 = setTimeout(() => setAnimationPhase('description'), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'var(--ldc-surface)' }}>
      <div className="relative w-full max-w-4xl text-center my-8" style={{ color: 'var(--ldc-on-surface)' }}>
        
        {/* Epic Seal Animation */}
        <div className="mb-12">
          <div 
            className={`w-64 h-64 mx-auto transition-all duration-1200 ${
              animationPhase === 'seal' 
                ? 'scale-0 opacity-0' 
                : 'scale-100 opacity-100'
            }`}
            style={{
              animation: animationPhase !== 'seal' ? 'float 6s ease-in-out infinite 2s' : 'none'
            }}
          >
            <img 
              src={sealWithGemsImage}
              alt="Il Sigillo di Lecce con le quattro gemme"
              className="w-full h-full object-contain pixelated"
              data-testid="final-seal-image"
              style={{
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 30px var(--ldc-contrast-yellow)) drop-shadow(0 0 60px var(--ldc-background))'
              }}
            />
          </div>
        </div>

        {/* Epic Title */}
        <div 
          className={`mb-8 transition-all duration-1000 ${
            animationPhase === 'seal'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <h1 
            className="font-retro text-3xl md:text-4xl text-yellow-300 mb-4"
            data-testid="final-completion-title"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.8)'
            }}
          >
            {finalCompletion.title}
          </h1>
          
        </div>

        {/* Epic Description */}
        <div 
          className={`mb-8 transition-all duration-1000 delay-300 ${
            animationPhase === 'seal' || animationPhase === 'title'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <p 
            className="text-base leading-relaxed text-white mx-4 md:mx-8"
            data-testid="final-completion-description"
          >
            {finalCompletion.description}
          </p>
        </div>

        {/* View Badge Button */}
        <div 
          className={`transition-all duration-1000 delay-500 ${
            animationPhase === 'seal' || animationPhase === 'title'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <button 
            className="nes-btn is-success font-retro text-xl px-12 py-6 hover:scale-110 transition-transform duration-300"
            onClick={() => setLocation('/badge')}
            data-testid="button-view-badge"
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
              boxShadow: '0 8px 0 #4a5568, 0 12px 20px rgba(0,0,0,0.4)',
              animation: animationPhase !== 'seal' && animationPhase !== 'title' ? 'pixel-pop 2s ease-in-out infinite 2s' : 'none'
            }}
          >
            🏆 Vedi il Tuo Badge DevFest
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameComplete;