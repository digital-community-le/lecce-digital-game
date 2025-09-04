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
    case 'guild-builder':
      return 'Taverna';
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
    // Do not navigate during render. Show a small call-to-action so the user
    // understands they need to create a profile before accessing challenges.
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="nes-container is-rounded p-6">
          <h2 className="text-lg font-retro mb-2">Profilo mancante</h2>
          <p className="mb-4">Per partecipare a questa challenge devi prima creare un profilo.</p>
          <div className="flex gap-2">
            <button
              className="nes-btn is-primary"
              onClick={() => setLocation('/')}
              data-testid="button-go-to-intro"
            >
              Crea profilo
            </button>
            <button
              className="nes-btn"
              onClick={() => setLocation('/game/map')}
              data-testid="button-back-to-map-when-no-profile"
            >
              Torna alla mappa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trova la challenge corrente
  const challenge = gameState.challenges.find(c => c.id === challengeId);
  
  // Se la challenge non esiste o è bloccata, mostra un messaggio esplicativo
  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="nes-container is-rounded p-6">
          <h2 className="text-lg font-retro mb-2">Challenge non trovata</h2>
          <p className="mb-4">Questa challenge non esiste.</p>
          <button className="nes-btn" onClick={() => setLocation('/game/map')}>Torna alla mappa</button>
        </div>
      </div>
    );
  }

  if (challenge.status === 'locked') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="nes-container is-rounded p-6">
          <h2 className="text-lg font-retro mb-2">Challenge bloccata</h2>
          <p className="mb-4">Devi completare le challenge precedenti per sbloccare questa sfida.</p>
          <div className="flex gap-2">
            <button className="nes-btn" onClick={() => setLocation('/game/map')}>Torna alla mappa</button>
            <button className="nes-btn is-disabled">In attesa</button>
          </div>
        </div>
      </div>
    );
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
              onClick={() => navigateWithTransition('/game/map')}
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