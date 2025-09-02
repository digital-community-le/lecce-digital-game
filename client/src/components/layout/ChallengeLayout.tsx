import React from 'react';
import { useLocation } from 'wouter';
import useNavigateWithTransition from '@/hooks/use-navigate-with-transition';
import { useGameStore } from '@/hooks/use-game-store';


interface ChallengeLayoutProps {
  /** ID della challenge per il controllo accesso */
  challengeId: string;
  /** Contenuto principale della challenge */
  children: React.ReactNode;
  /** Classe CSS personalizzata per il container principale */
  className?: string;
}

/**
 * Mappa dei challenge ID ai nomi delle challenge
 */
const getChallengeTitle = (challengeId: string) => {
  switch (challengeId) {
    case 'networking-forest':
      return 'Forest';
    case 'retro-puzzle':
      return 'Puzzle';
    case 'debug-dungeon':
      return 'Dungeon';
    case 'social-arena':
      return 'Arena';
    default:
      return 'Challenge';
  }
};


/**
 * Layout riutilizzabile per tutte le challenge del gioco
 * 
 * Fornisce una struttura coerente con:
 * - Navigation bar con pulsante "Torna alla mappa"  
 * - Container responsive per il contenuto
 * - Protezione accesso (redirect se non autorizzato)
 * - Estetica retro gaming coerente
 */
const ChallengeLayout: React.FC<ChallengeLayoutProps> = ({
  challengeId,
  children,
  className = ''
}) => {
  const [, setLocation] = useLocation();
  const navigateWithTransition = useNavigateWithTransition();
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

  const challengeTitle = getChallengeTitle(challengeId);

  return (
    <>
      {/* Barra di navigazione stile retro con pulsante back */}
      <nav className="bg-card border-b-4 border-border">
        <div className="container mx-auto px-4 py-3">
          {/* Pulsante Torna alla mappa e titolo challenge */}
          <div className="flex items-center gap-4">
            <button
              className="nes-btn is-normal"
              onClick={() => navigateWithTransition('/game')}
              aria-label="Torna alla mappa"
              data-testid="button-back-to-map"
            >
              <i className="nes-icon caret-left is-small mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Mappa</span>
            </button>
            
            {/* Titolo principale della challenge */}
            <h1 className="text-xl font-retro" data-testid="challenge-title">
              {challengeTitle}
            </h1>
          </div>
        </div>
      </nav>

      {/* Container principale con padding responsivo */}
      <main className={`container mx-auto px-4 py-6 ${className}`}>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

    </>
  );
};

export default ChallengeLayout;