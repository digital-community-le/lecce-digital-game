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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl text-center text-white">
        
        {/* Epic Seal Animation */}
        <div className="mb-12">
          <div 
            className={`w-64 h-64 mx-auto transition-all duration-1200 ${
              animationPhase === 'seal' 
                ? 'scale-0 opacity-0 rotate-180' 
                : 'scale-100 opacity-100 rotate-0'
            }`}
            style={{
              animation: animationPhase !== 'seal' ? 'epicSealEntry 1.2s ease-out forwards, float 6s ease-in-out infinite 2s' : 'none'
            }}
          >
            <img 
              src={sealWithGemsImage}
              alt="Il Sigillo di Lecce con le quattro gemme"
              className="w-full h-full object-contain pixelated"
              data-testid="final-seal-image"
              style={{
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))',
                animation: animationPhase !== 'seal' ? 'gemGlow 3s ease-in-out infinite alternate' : 'none'
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
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 20px rgba(255, 215, 0, 0.6)',
              animation: animationPhase !== 'seal' && animationPhase !== 'title' ? 'titlePulse 4s ease-in-out infinite' : 'none'
            }}
          >
            {finalCompletion.title}
          </h1>
          
          {/* Decorative separator */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"></div>
            <div className="text-yellow-300 text-2xl">⚡</div>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"></div>
          </div>
        </div>

        {/* Epic Description */}
        <div 
          className={`mb-12 transition-all duration-1000 delay-300 ${
            ['seal', 'title', 'description'].includes(animationPhase)
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="bg-gray-900/90 border-4 border-yellow-600 p-8 mx-4 md:mx-8">
            <p 
              className="text-xl md:text-2xl leading-relaxed text-gray-100 font-medium"
              data-testid="final-completion-description"
              style={{
                textShadow: '1px 1px 0px rgba(0,0,0,0.8)'
              }}
            >
              {finalCompletion.description}
            </p>
          </div>
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
            className="nes-btn is-success font-retro text-xl px-12 py-6 hover:scale-110 transition-transform duration-300"
            onClick={handleViewStats}
            data-testid="button-view-statistics"
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
              boxShadow: '0 8px 0 #4a5568, 0 12px 20px rgba(0,0,0,0.3)'
            }}
          >
            {finalCompletion.buttonText}
          </button>
        </div>

        {/* Floating particles effect - limited to seal area */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => {
            // Limit particles to the area around the seal (center of the screen)
            const centerX = 50;
            const centerY = 30; // Seal is in upper part
            const radius = 25; // Limit to 25% radius around center
            const angle = (Math.random() * 2 * Math.PI);
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full opacity-60"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationName: 'float',
                  animationDuration: `${3 + Math.random() * 2}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameComplete;