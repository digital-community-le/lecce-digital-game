import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';

interface ChallengeLayoutProps {
  /** ID della challenge per il controllo accesso */
  challengeId: string;
  /** Contenuto principale della challenge */
  children: React.ReactNode;
  /** Mostra la barra di progresso delle gemme raccolte */
  showProgress?: boolean;
  /** Classe CSS personalizzata per il container principale */
  className?: string;
  /** Se true, usa uno sfondo più scuro per maggiore immersività */
  darkMode?: boolean;
}

/**
 * Layout riutilizzabile per tutte le challenge del gioco
 * 
 * Fornisce una struttura coerente con:
 * - Header comune con logo/progress
 * - Navigation bar con pulsante "Torna alla mappa"  
 * - Container responsive per il contenuto
 * - Protezione accesso (redirect se non autorizzato)
 * - Estetica retro gaming coerente
 */
const ChallengeLayout: React.FC<ChallengeLayoutProps> = ({
  challengeId,
  children,
  showProgress = true,
  className = '',
  darkMode = false
}) => {
  const [, setLocation] = useLocation();
  const { gameState } = useGameStore();

  // Protezione accesso: redirect se utente non valido
  if (!gameState.currentUser.userId) {
    setLocation('/');
    return null;
  }

  // Trova la challenge corrente
  const challenge = gameState.challenges.find(c => c.id === challengeId);
  
  // Redirect se challenge non trovata o bloccata
  if (!challenge || challenge.status === 'locked') {
    setLocation('/game');
    return null;
  }

  const completedCount = gameState.gameProgress.completedChallenges.length;
  const totalChallenges = gameState.challenges.length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-background'} text-foreground`}>
      <Header />
      
      {/* Barra di navigazione stile retro con pulsante back */}
      <nav className="bg-card border-b-4 border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Pulsante Torna alla mappa */}
            <div className="flex items-center gap-4">
              <button
                className="nes-btn is-normal"
                onClick={() => setLocation('/game')}
                aria-label="Torna alla mappa"
                data-testid="button-back-to-map"
              >
                <i className="nes-icon caret-left is-small mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Mappa</span>
              </button>
              
              {/* Titolo challenge */}
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={challenge.title}>
                  {challenge.emoji}
                </span>
                <h1 className="text-lg font-retro" data-testid="challenge-title">
                  {challenge.title}
                </h1>
              </div>
            </div>

            {/* Progress indicator delle gemme */}
            {showProgress && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-retro text-muted-foreground">
                  Gemme
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xl" role="img" aria-label="gemma">💎</span>
                  <span className="font-retro text-sm">
                    {completedCount}/{totalChallenges}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Container principale con padding responsivo */}
      <main className={`container mx-auto px-4 py-6 ${className}`}>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer stile retro opzionale per indicazioni */}
      <footer className="mt-auto p-4 text-center">
        <p className="text-xs text-muted-foreground font-retro">
          Usa il pulsante 🠴 per tornare alla mappa
        </p>
      </footer>
    </div>
  );
};

export default ChallengeLayout;