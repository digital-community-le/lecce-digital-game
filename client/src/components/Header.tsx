import React from 'react';
import Logo from '@/components/Logo';
import { useGameStore } from '@/hooks/use-game-store';
import SocialLinks from '@/components/SocialLinks';

const Header: React.FC = () => {
  const { gameState, openModal } = useGameStore();

  // const handleThemeToggle = () => {
  //   const newTheme = gameState.theme === 'default' ? 'dark' : 'default';
  //   setTheme(newTheme);
  // };

  return (
    <header
      className="ldc-header flex items-center justify-between px-4"
      data-testid="header"
      style={{
        background: 'var(--ldc-primary)',
        color: 'var(--ldc-on-surface)',
        borderBottom: '2px solid var(--ldc-primary-dark)',
      }}
    >
      {/* Logo and title */}
      {/* <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary border-2 border-black flex items-center justify-center" data-testid="logo">
          <span className="text-xs font-retro" style={{ color: 'var(--ldc-background)' }}>L</span>
        </div>
        <h1 className="font-retro text-xs ldc-header__title--mobile-hidden" data-testid="title">
          Il Sigillo
        </h1>
      </div> */}
      <Logo />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        {/* <button 
          className="nes-btn is-normal" 
          aria-label="Cambia tema" 
          onClick={handleThemeToggle}
          data-testid="button-theme-toggle"
        >
          <span className="text-xs">🌓</span>
        </button> */}

        {/* Social links */}
        <SocialLinks />

        {/* Profile indicator */}
        <button
          className="w-10 h-10 flex items-center justify-center overflow-hidden"
          style={{
            background: 'var(--ldc-background)',
            border: '2px solid var(--ldc-primary-dark)',
          }}
          onClick={() => openModal('statistics')}
          aria-label="Statistiche"
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
