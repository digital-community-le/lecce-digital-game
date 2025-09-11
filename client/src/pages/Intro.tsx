import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import useNavigateWithTransition from '@/hooks/use-navigate-with-transition';
import { useGameStore } from '@/hooks/use-game-store';
import ProfileCreationForm from '@/components/ProfileCreationForm';
import UiDialog from '@/components/UiDialog';
import Logo from '@/components/Logo';
// Import static game data
import gameData from '@/assets/game-data.json';
import sealWithoutGems from '@assets/images/seal-without-gems.png';

const IntroPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const navigateWithTransition = useNavigateWithTransition();
  const { gameState } = useGameStore();
  const [textRevealed, setTextRevealed] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Prefer values from public/game-data.json, fallback to hardcoded strings
  const cfg = gameData?.gameConfig ?? {};
  const storyText =
    cfg.storyText ??
    "Un'antica forza dorme sotto le pietre della città. Solo chi saprà unire mente, coraggio e comunità potrà riaccendere il Sigillo. Accetta la chiamata e scrivi la tua leggenda.";
  const titleText = cfg.title ?? 'Il Sigillo di Lecce';
  const subtitleText = cfg.subtitle ?? 'Risveglio';
  const buttonText = cfg.buttonText ?? 'Inizia la tua leggenda';

  useEffect(() => {
    // Check if user already has a profile
    if (gameState.currentUser.userId) {
      // immediate redirect on mount if user exists
      setLocation('/game/map');
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

  const handleProfileComplete = async () => {
    // Close dialog then navigate with transition
    setShowProfileForm(false);
    try {
      await navigateWithTransition('/game/map');
    } catch (e) {
      // fallback
      setLocation('/game/map');
    }
  };

  return (
    <div
      className="intro-screen fixed inset-0 flex flex-col items-center justify-center z-10 px-4 md:px-0"
      style={{
        background:
          'linear-gradient(to bottom, var(--ldc-primary-dark), var(--ldc-surface))',
        color: 'var(--ldc-on-surface)',
      }}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 md:gap-4">
        <div className="w-30 h-30">
          <Logo className={'[&>img]:w-full'} />
        </div>
      </div>
      {/* Sigillo Image */}
      <div className="text-center mb-4 md:mb-8">
        <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4">
          <img
            src={sealWithoutGems}
            alt="Sigillo di Lecce"
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      {/* Title */}
      <div className="text-center mb-4 md:mb-8">
        <h1
          className="font-retro text-lg md:text-xl lg:text-2xl mb-2 md:mb-4"
          style={{ color: 'var(--ldc-contrast-yellow)' }}
          data-testid="text-game-title"
        >
          {titleText}
        </h1>
        <h2
          className="font-retro text-base md:text-lg"
          style={{ color: 'var(--ldc-primary-light)' }}
          data-testid="text-game-subtitle"
        >
          {subtitleText}
        </h2>
      </div>

      {/* Story text with progressive reveal */}
      <div className="max-w-sm md:max-w-md mx-auto px-4 md:px-6 text-center">
        <div
          className={`transition-opacity duration-1000 ${
            textRevealed ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid="text-story-intro"
        >
          <p className="text-xs md:text-sm leading-relaxed mb-6 md:mb-8">
            {storyText}
          </p>
        </div>

        {/* CTA Button */}
        {showButton && (
          <button
            className="nes-btn is-primary text-xs md:text-sm fade-in-retro"
            onClick={handleStart}
            data-testid="button-start-legend"
          >
            {buttonText}
          </button>
        )}
      </div>

      {/* Footer with Logo */}
      {/* <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 md:gap-4">
        <div className="w-30 h-30">
          <Logo />
        </div>
      </div> */}

      {/* Profile creation dialog */}
      {showProfileForm && (
        <UiDialog
          open={showProfileForm}
          onClose={() => setShowProfileForm(false)}
          title="Crea il tuo profilo"
          className="max-w-md"
        >
          <div data-testid="modal-profile-creation">
            <ProfileCreationForm onComplete={handleProfileComplete} />
          </div>
        </UiDialog>
      )}
    </div>
  );
};

export default IntroPage;
