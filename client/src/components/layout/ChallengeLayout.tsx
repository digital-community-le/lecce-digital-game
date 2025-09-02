import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';

// Import delle immagini delle gemme generate
import gemmaAlleanza from '@assets/generated_images/Gemma_dell\'Alleanza_verde_4f1dff68.png';
import gemmaMemoria from '@assets/generated_images/Gemma_della_Memoria_blu_5db7713d.png';
import gemmaSapienza from '@assets/generated_images/Gemma_della_Sapienza_rossa_3a1cc119.png';
import gemmaComunita from '@assets/generated_images/Gemma_della_Comunità_viola_f233649e.png';

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
 * Mappa dei challenge ID alle informazioni delle gemme
 */
const getGemInfo = (challengeId: string) => {
  switch (challengeId) {
    case 'networking-forest':
      return {
        image: gemmaAlleanza,
        title: 'LA Gemma dell\'Alleanza',
        description: 'Suggella i legami con la comunità'
      };
    case 'retro-puzzle':
      return {
        image: gemmaMemoria,
        title: 'LA Gemma della Memoria',
        description: 'Custodisce i ricordi del passato'
      };
    case 'debug-dungeon':
      return {
        image: gemmaSapienza,
        title: 'LA Gemma della Sapienza',
        description: 'Illumina la via della conoscenza'
      };
    case 'social-arena':
      return {
        image: gemmaComunita,
        title: 'LA Gemma della Comunità',
        description: 'Unisce le voci di tutti'
      };
    default:
      return {
        image: gemmaAlleanza,
        title: 'LA Gemma',
        description: 'Una gemma misteriosa'
      };
  }
};

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
  const challengeTitle = getChallengeTitle(challengeId);
  const gemInfo = getGemInfo(challengeId);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-background'} text-foreground`}>
      <Header />
      
      {/* Barra di navigazione stile retro con pulsante back */}
      <nav className="bg-card border-b-4 border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Pulsante Torna alla mappa e titolo challenge */}
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
              
              {/* Titolo principale della challenge */}
              <h1 className="text-xl font-retro" data-testid="challenge-title">
                {challengeTitle}
              </h1>
            </div>

            {/* Progress indicator delle gemme */}
            {showProgress && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-retro text-muted-foreground">
                  Progresso
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-retro text-sm">
                    {completedCount}/{totalChallenges}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Sottotitolo con gemma */}
          <div className="flex items-center gap-3 mt-2">
            <img 
              src={gemInfo.image} 
              alt={gemInfo.title}
              className="w-8 h-8 pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
            <h2 className="text-lg font-retro text-muted-foreground" data-testid="gem-subtitle">
              {gemInfo.title}
            </h2>
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