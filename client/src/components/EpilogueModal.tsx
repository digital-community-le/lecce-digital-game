import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import gameData from '@/assets/game-data.json';
import sealWithGemsImage from '@assets/images/seal-with-gems.png';

const EpilogueModal: React.FC = () => {
  const [, setLocation] = useLocation();
  const { modals, closeModal } = useGameStore();
  const isOpen = modals.epilogue?.isOpen;
  const [animationPhase, setAnimationPhase] = useState<'seal' | 'title' | 'button'>('seal');
  
  const { finalCompletion } = gameData;

  const handleContinue = () => {
    closeModal('epilogue');
    // Navigate to full completion page
    setTimeout(() => {
      setLocation('/game-complete');
    }, 500);
  };

  useEffect(() => {
    if (isOpen) {
      // Epic modal animation sequence
      setAnimationPhase('seal');
      const timer1 = setTimeout(() => setAnimationPhase('title'), 1500);
      const timer2 = setTimeout(() => setAnimationPhase('button'), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
      data-testid="modal-epilogue"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-3xl text-center text-white">
        
        {/* Epic Seal with All Gems */}
        <div className="mb-12">
          <div 
            className={`w-48 h-48 mx-auto transition-all duration-1500 ${
              animationPhase === 'seal' 
                ? 'scale-0 opacity-0 rotate-180' 
                : 'scale-100 opacity-100 rotate-0'
            }`}
            style={{
              animation: animationPhase !== 'seal' ? 'epicSealEntry 1.5s ease-out forwards' : 'none'
            }}
          >
            <img 
              src={sealWithGemsImage}
              alt="Il Sigillo di Lecce completato"
              className="w-full h-full object-contain pixelated"
              data-testid="epilogue-seal-image"
              style={{
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 1)) drop-shadow(0 0 80px rgba(255, 255, 255, 0.6))',
                animation: animationPhase !== 'seal' ? 'gemGlow 3s ease-in-out infinite alternate' : 'none'
              }}
            />
          </div>
        </div>

        {/* Epic Completion Message */}
        <div 
          className={`mb-12 transition-all duration-1200 delay-500 ${
            animationPhase === 'seal' || animationPhase === 'title'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <h1 
            className="font-retro text-3xl md:text-5xl text-yellow-300 mb-6"
            data-testid="epilogue-title"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 25px rgba(255, 215, 0, 0.8)',
              animation: animationPhase !== 'seal' && animationPhase !== 'title' ? 'titlePulse 4s ease-in-out infinite' : 'none'
            }}
          >
            🎉 LEGGENDA COMPIUTA! 🎉
          </h1>
          
          <div className="bg-gray-900/95 border-4 border-yellow-600 p-8 mx-4">
            <div className="bg-gradient-to-b from-yellow-600/30 to-transparent p-6 border border-yellow-600/50">
              <p 
                className="text-xl md:text-2xl leading-relaxed text-gray-100 font-medium mb-6"
                data-testid="epilogue-message"
                style={{
                  textShadow: '1px 1px 0px rgba(0,0,0,0.8)'
                }}
              >
                Hai risvegliato l'antico potere! Le quattro gemme brillano unite nel Sigillo di Lecce. 
                La tua leggenda è ora scritta nelle pietre della città eterna.
              </p>
              
              {/* Achievement Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gameData.rewards.badges.map((badge, index) => (
                  <div 
                    key={badge.id} 
                    className="text-center p-3 bg-yellow-900/30 border border-yellow-600/30"
                    style={{
                      animation: `fadeInRetro ${0.8 + index * 0.2}s steps(6, end) forwards`
                    }}
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="text-xs text-yellow-300 font-retro">{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Epic Continue Button */}
        <div 
          className={`transition-all duration-1200 delay-1000 ${
            animationPhase !== 'button'
              ? 'opacity-0 translate-y-8'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <button 
            className="nes-btn is-success font-retro text-xl px-12 py-6 hover:scale-110 transition-transform duration-300"
            onClick={handleContinue}
            data-testid="button-continue-to-completion"
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
              boxShadow: '0 8px 0 #4a5568, 0 12px 20px rgba(0,0,0,0.4)',
              animation: animationPhase === 'button' ? 'pixel-pop 2s ease-in-out infinite 2s' : 'none'
            }}
          >
            Celebra la Leggenda ✨
          </button>
        </div>

        {/* Epic particles background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-70"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                backgroundColor: ['#ffd700', '#ffff00', '#32cd32', '#ff4500', '#9370db'][Math.floor(Math.random() * 5)],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`,
                animationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpilogueModal;