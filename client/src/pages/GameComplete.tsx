import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import gameData from '@/assets/game-data.json';
import sealWithGemsImage from '@assets/images/seal-with-gems.png';

const GameComplete: React.FC = () => {
  const [, setLocation] = useLocation();
  const [animationPhase, setAnimationPhase] = useState<'seal' | 'title' | 'description' | 'button'>('seal');
  
  const { finalCompletion } = gameData;

  useEffect(() => {
    // Sequential animation phases
    setAnimationPhase('seal');
    const timer1 = setTimeout(() => setAnimationPhase('title'), 1200);
    const timer2 = setTimeout(() => setAnimationPhase('description'), 2000);
    const timer3 = setTimeout(() => setAnimationPhase('button'), 3200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleViewStats = () => {
    setLocation('/statistics');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 py-12">
      <div className="relative w-full max-w-4xl text-center text-white my-8">
        
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
                filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))'
              }}
            />
          </div>
        </div>

        {/* Epic Title */}
        <div 
          className={`mb-8 transition-all duration-1000 ${
            animationPhase === 'seal' || animationPhase === 'title'
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
          className={`mb-12 transition-all duration-1000 delay-300 ${
            ['seal', 'title', 'description'].includes(animationPhase)
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

        {/* Epic Button */}
        <div 
          className={`transition-all duration-1000 delay-700 ${
            animationPhase !== 'button'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <button 
            className="nes-btn is-success font-retro"
            onClick={handleViewStats}
            data-testid="button-view-statistics"
          >
            {finalCompletion.buttonText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameComplete;