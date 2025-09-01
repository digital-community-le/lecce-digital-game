import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';

const FloatingActionButton: React.FC = () => {
  const { openModal, gameState } = useGameStore();

  const handleQRClick = () => {
    if (!gameState.currentUser.userId) {
      openModal('profile');
    } else {
      openModal('qr');
    }
  };

  return (
    <button 
      className="fab" 
      aria-label="Mostra il mio QR" 
      onClick={handleQRClick}
      data-testid="button-qr-fab"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h4m0 0V4m0 4h.01M4 16h4m0 0v4m0-4h.01"
        />
      </svg>
    </button>
  );
};

export default FloatingActionButton;
