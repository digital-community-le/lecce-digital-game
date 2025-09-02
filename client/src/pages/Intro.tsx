import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import ProfileCreationForm from '@/components/ProfileCreationForm';

const IntroPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState } = useGameStore();
  const [textRevealed, setTextRevealed] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const storyText = "Un'antica forza dorme sotto le pietre della città. Solo chi saprà unire mente, coraggio e comunità potrà riaccendere il Sigillo. Accetta la chiamata e scrivi la tua leggenda.";

  useEffect(() => {
    // Check if user already has a profile
    if (gameState.currentUser.userId) {
      setLocation('/game');
      return;
    }

    // Progressive text reveal with retro timing
    const timer1 = setTimeout(() => {
      setTextRevealed(true);
    }, 1000);

    const timer2 = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [gameState.currentUser.userId, setLocation]);

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfileForm(true);
  };

  const handleProfileComplete = () => {
    setLocation('/game');
  };

  if (showProfileForm) {
    return (
      <div className="intro-screen fixed inset-0 bg-gradient-to-b from-purple-900 to-black flex flex-col items-center text-white z-10">
        <div className="max-w-md">
          <div className="modal-content nes-container with-title bg-card">
            <p className="title bg-card">Crea il tuo profilo</p>
            <ProfileCreationForm onComplete={handleProfileComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-screen fixed inset-0 bg-gradient-to-b from-purple-900 to-black flex flex-col items-center justify-center text-white z-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-retro text-xl md:text-2xl mb-4 text-yellow-400" data-testid="text-game-title">
          Il Sigillo di Lecce
        </h1>
        <h2 className="font-retro text-lg text-purple-300" data-testid="text-game-subtitle">
          Risveglio
        </h2>
      </div>

      {/* Story text with progressive reveal */}
      <div className="max-w-md mx-auto px-6 text-center">
        <div 
          className={`transition-opacity duration-1000 ${textRevealed ? 'opacity-100' : 'opacity-0'}`}
          data-testid="text-story-intro"
        >
          <p className="text-sm leading-relaxed mb-8">
            {storyText}
          </p>
        </div>

        {/* CTA Button */}
        {showButton && (
          <button 
            className="nes-btn is-primary text-sm fade-in-retro"
            onClick={handleStart}
            data-testid="button-start-legend"
          >
            Inizia la tua leggenda
          </button>
        )}
      </div>

      {/* Decorative pixel elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-yellow-400 pixel-pop" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-purple-400 pixel-pop" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-pink-400 pixel-pop" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;