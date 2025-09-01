import React, { useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';
import FantasyMap from '@/components/FantasyMap';
import FloatingActionButton from '@/components/FloatingActionButton';
import ProfileModal from '@/components/ProfileModal';
import QRModal from '@/components/QRModal';
import ChallengeModal from '@/components/challenges/ChallengeModal';
import ScannerView from '@/components/ScannerView';
import ScanPreviewModal from '@/components/ScanPreviewModal';
import CompletionModal from '@/components/CompletionModal';
import IntroScreen from '@/components/IntroScreen';

const Game: React.FC = () => {
  const { gameState, toasts, removeToast } = useGameStore();

  useEffect(() => {
    // Set theme class on document
    document.documentElement.className = `ldc-theme--${gameState.theme}`;
    localStorage.setItem('ldc:theme', gameState.theme);
  }, [gameState.theme]);

  // Show intro screen if no user profile exists
  if (!gameState.currentUser.userId) {
    return <IntroScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="game-app">
      <Header />
      <main className="relative">
        <FantasyMap />
      </main>
      
      <FloatingActionButton />
      
      {/* Modals */}
      <ProfileModal />
      <QRModal />
      <ChallengeModal />
      <ScannerView />
      <ScanPreviewModal />
      <CompletionModal />
      
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast nes-container p-3 ${
            toast.type === 'success' ? 'is-success' :
            toast.type === 'error' ? 'is-error' :
            toast.type === 'warning' ? 'is-warning' :
            'is-light'
          }`}
          data-testid={`toast-${toast.type}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button 
              className="ml-4 text-lg leading-none"
              onClick={() => removeToast(toast.id)}
              aria-label="Chiudi notifica"
              data-testid="button-close-toast"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Game;
