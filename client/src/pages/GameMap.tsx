import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';
import CanvasMap from '@/components/CanvasMap';
import FloatingActionButton from '@/components/FloatingActionButton';
import QRModal from '@/components/QRModal';
import ScannerView from '@/components/ScannerView';
import ScanPreviewModal from '@/components/ScanPreviewModal';
import CompletionModal from '@/components/CompletionModal';

const GameMapPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState, toasts, removeToast, acknowledgeCompletion } = useGameStore();

  useEffect(() => {
    // Set theme class on document
    document.documentElement.className = `ldc-theme--${gameState.theme}`;
    localStorage.setItem('ldc:theme', gameState.theme);
  }, [gameState.theme]);

  // Redirect to intro if no user profile
  useEffect(() => {
    if (!gameState.currentUser.userId) {
      setLocation('/');
    }
  // When the map mounts, surface any pending completion modal queued by store
  acknowledgeCompletion();
  }, [gameState.currentUser.userId, setLocation]);

  if (!gameState.currentUser.userId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="game-app">
      <Header />
      <main className="relative">
        <CanvasMap />
      </main>
      
  <FloatingActionButton />
      
  {/* Modals - Keep these for overlays */}
  <ScannerView />
  <ScanPreviewModal />
  <CompletionModal />
  <QRModal />
      
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

export default GameMapPage;