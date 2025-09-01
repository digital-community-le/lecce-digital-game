import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';

const Header: React.FC = () => {
  const { gameState, setTheme, openModal } = useGameStore();

  const handleThemeToggle = () => {
    const newTheme = gameState.theme === 'default' ? 'dark' : 'default';
    setTheme(newTheme);
  };

  return (
    <header className="ldc-header flex items-center justify-between px-4" data-testid="header">
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary border-2 border-black flex items-center justify-center" data-testid="logo">
          <span className="text-white text-xs font-retro">L</span>
        </div>
        <h1 className="font-retro text-xs ldc-header__title--mobile-hidden" data-testid="title">
          Il Sigillo
        </h1>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button 
          className="nes-btn is-normal" 
          aria-label="Cambia tema" 
          onClick={handleThemeToggle}
          data-testid="button-theme-toggle"
        >
          <span className="text-xs">🌓</span>
        </button>
        
        {/* Social links */}
        <a 
          href="https://instagram.com/leccedigital" 
          className="nes-btn is-normal" 
          aria-label="Instagram" 
          target="_blank" 
          rel="noopener noreferrer"
          data-testid="link-instagram"
        >
          <span className="text-xs">📷</span>
        </a>
        
        {/* Profile indicator */}
        <button
          className="w-8 h-8 bg-muted border-2 border-black flex items-center justify-center overflow-hidden"
          onClick={() => openModal('profile')}
          aria-label="Apri profilo"
          data-testid="button-profile"
        >
          {gameState.currentUser.avatar ? (
            <img 
              src={gameState.currentUser.avatar} 
              alt="Avatar"
              className="w-full h-full object-cover pixelated"
            />
          ) : (
            <span className="text-xs">👤</span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
