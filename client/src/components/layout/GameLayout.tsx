import React, { useEffect } from 'react';
import Header from '@/components/Header';
import CompletionModal from '../CompletionModal';
import EpilogueModal from '../EpilogueModal';
import StatisticsModal from '../StatisticsModal';
import { useGameStore } from '@/hooks/use-game-store';
import RouteTransition from '@/components/RouteTransition';

interface GameLayoutProps {
  /** Contenuto principale dell'applicazione */
  children: React.ReactNode;
  /** Se true, usa uno sfondo più scuro per maggiore immersività */
  darkMode?: boolean;
  /** Classe CSS personalizzata per il container principale */
  className?: string;
}

/**
 * Layout generale dell'applicazione
 * 
 * Fornisce la struttura base con:
 * - Header comune con logo, tema e profilo
 * - Container principale per il contenuto
 * - Gestione del tema scuro/chiaro
 */
const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  darkMode = false,
  className = ''
}) => {
  const { gameState, toasts, removeToast } = useGameStore();

  useEffect(() => {
        // Set theme class on document
        document.documentElement.className = `ldc-theme--${gameState.theme}`;
        localStorage.setItem('ldc:theme', gameState.theme);
      }, [gameState.theme]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-background'} text-foreground ${className}`}>
      <Header />

      {/* Container principale */}
      <main className="flex-1 relative game-body" data-testid="game-body">
        {children}

        {/* Route transition overlay limited to the game body */}
        <RouteTransition />
      </main>

      {/* Modals - Keep these for overlays */}
      <CompletionModal />
      <EpilogueModal />
      <StatisticsModal />
      
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast nes-container is-rounded p-3 ${
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
              className="ml-4 text-lg leading-none nes-btn"
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

export default GameLayout;