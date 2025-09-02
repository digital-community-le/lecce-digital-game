import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { PuzzleState, PuzzlePair } from '@shared/schema';
import ChallengeCompleted from '@/components/ChallengeCompleted';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import memoryGem from '@assets/images/gem-of-memory.png';
import gameData from '@/assets/game-data.json';

// Load configuration for retro-puzzle from game-data.json with safe fallbacks
const retroConfig = Array.isArray((gameData as any).challenges)
  ? (gameData as any).challenges.find((c: any) => c.id === 'retro-puzzle')
  : undefined;

// No fallback: require configuration to be present in game-data.json
const PAIRS_DATA: PuzzlePair[] | undefined = retroConfig?.pairs;

const RetroPuzzle: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const BASE_POINTS = 10;
  const PENALTY = 2;

  // If configuration is missing, surface a clear error message and log it.
  if (!retroConfig || !PAIRS_DATA) {
    console.error('RetroPuzzle configuration not found in game-data.json (expected challenge id "retro-puzzle").');
    return (
      <div className="p-4">
        <p className="title bg-card">Retro Puzzle — Errore</p>
        <div className="text-center text-red-600 mt-4">
          Configurazione della challenge "retro-puzzle" non trovata in <code>game-data.json</code>.
          Controlla che la sezione sia presente e valida.
        </div>
      </div>
    );
  }

  // Use configured pairs count
  const PAIRS_COUNT = PAIRS_DATA.length;

  useEffect(() => {
    if (gameState.currentUser.userId) {
      let state = gameStorage.getPuzzleState(gameState.currentUser.userId);
      
      if (!state) {
        // Initialize new puzzle state
  const shuffledTerms = [...PAIRS_DATA.map((p: PuzzlePair) => p.term)].sort(() => Math.random() - 0.5);
  const shuffledCategories = [...PAIRS_DATA.map((p: PuzzlePair) => p.category)].sort(() => Math.random() - 0.5);
        
        state = {
          id: `puzzle_${Date.now()}`,
          pairs: PAIRS_DATA,
          shuffledTerms,
          shuffledCategories,
          matches: {},
          remaining: PAIRS_COUNT,
          attempts: 0,
          startedAt: new Date().toISOString(),
        };
        
        gameStorage.savePuzzleState(gameState.currentUser.userId, state);
      }
      
      setPuzzleState(state);
      setIsLoading(false);
    }
  }, [gameState.currentUser.userId]);

  const handleTermClick = (term: string) => {
    if (selectedTerm === term) {
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (!selectedTerm || !puzzleState) return;

    const correctPair = puzzleState.pairs.find(pair => pair.term === selectedTerm);
    const isCorrect = correctPair?.category === category;
    
    const newAttempts = puzzleState.attempts + 1;
    let newMatches = { ...puzzleState.matches };
    let newRemaining = puzzleState.remaining;
    let newScore = puzzleState.score || 0;

    if (isCorrect) {
      newMatches[selectedTerm] = category;
      newRemaining--;
      newScore += BASE_POINTS;
      showToast(`Giusto! +${BASE_POINTS} punti`, 'success');
    } else {
      newScore = Math.max(0, newScore - PENALTY);
      showToast(`Sbagliato — riprova (−${PENALTY} punti)`, 'error');
    }

    const isCompleted = newRemaining === 0;
    const finalScore = isCompleted ? newScore : undefined;
    const finishedAt = isCompleted ? new Date().toISOString() : undefined;

    const updatedState: PuzzleState = {
      ...puzzleState,
      matches: newMatches,
      remaining: newRemaining,
      attempts: newAttempts,
      score: newScore,
      finishedAt,
    };

    setPuzzleState(updatedState);
    gameStorage.savePuzzleState(gameState.currentUser.userId, updatedState);
    setSelectedTerm(null);

    if (isCompleted) {
      updateChallengeProgress('retro-puzzle', PAIRS_COUNT, true);
      showToast('Puzzle completato!', 'success');
    } else {
      updateChallengeProgress('retro-puzzle', PAIRS_COUNT - newRemaining, false);
    }
  };

  const handleRestart = () => {
    if (!gameState.currentUser.userId) return;

  const shuffledTerms = [...PAIRS_DATA.map((p: PuzzlePair) => p.term)].sort(() => Math.random() - 0.5);
  const shuffledCategories = [...PAIRS_DATA.map((p: PuzzlePair) => p.category)].sort(() => Math.random() - 0.5);
    
    const newState: PuzzleState = {
      id: `puzzle_${Date.now()}`,
      pairs: PAIRS_DATA,
      shuffledTerms,
      shuffledCategories,
      matches: {},
      remaining: PAIRS_COUNT,
      attempts: 0,
      startedAt: new Date().toISOString(),
    };
    
    setPuzzleState(newState);
    gameStorage.savePuzzleState(gameState.currentUser.userId, newState);
    setSelectedTerm(null);
    showToast('Puzzle riavviato!', 'info');
  };

  if (isLoading || !puzzleState) {
    return (
      <div className="p-4">
        <p className="title bg-card">Retro Puzzle</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  const progressPercentage = ((PAIRS_COUNT - puzzleState.remaining) / PAIRS_COUNT) * 100;
  const isCompleted = puzzleState.remaining === 0;

  return (
    <ChallengeContentLayout
      gemTitle="La Gemma della Conoscenza"
      gemIcon={memoryGem}
      description="Nel puzzle antico, ogni connessione rivela un frammento di saggezza. Abbina i termini alle loro categorie per raccogliere la Gemma della Conoscenza."
      tip={`Tocca un termine a sinistra, poi tocca la categoria corrispondente a destra. Ogni errore riduce il punteggio di ${PENALTY} punti.`}
      progress={PAIRS_COUNT - puzzleState.remaining}
      total={PAIRS_COUNT}
      progressLabel="Progresso"
      isCompleted={isCompleted}
      completionMessage="Hai svelato tutti i misteri! La Gemma della Conoscenza è tua."
    >
      <div className="p-4">
        {/* Progress and score */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso</span>
            <span data-testid="text-puzzle-progress">
              {PAIRS_COUNT - puzzleState.remaining}/{PAIRS_COUNT}
            </span>
          </div>
          <div className="progress-custom mb-3">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-puzzle"
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <span>Punteggio: <span className="font-retro" data-testid="text-puzzle-score">
              {puzzleState.score || 0}
            </span></span>
            <span>Tentativi: {puzzleState.attempts}</span>
          </div>
        </div>

        {!isCompleted ? (
          <>
            {/* Game board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Terms column */}
              <div>
                <h4 className="font-retro text-xs mb-3">Termini</h4>
                <div className="space-y-2" data-testid="terms-column">
                  {puzzleState.shuffledTerms.map((term) => {
                    const isMatched = puzzleState.matches[term];
                    const isSelected = selectedTerm === term;
                    
                    return (
                      <button
                        key={term}
                        className={`w-full p-3 border-2 border-black text-left text-sm transition-colors ${
                          isMatched 
                            ? 'bg-green-200 text-green-800 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-primary text-white' 
                              : 'bg-muted hover:bg-primary hover:text-white'
                        }`}
                        onClick={() => !isMatched && handleTermClick(term)}
                        disabled={!!isMatched}
                        data-testid={`term-${term.toLowerCase().replace(/[^a-z]/g, '-')}`}
                      >
                        {term} {isMatched && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories column */}
              <div>
                <h4 className="font-retro text-xs mb-3">Categorie</h4>
                <div className="space-y-2" data-testid="categories-column">
                  {puzzleState.shuffledCategories.map((category) => {
                    const isMatched = Object.values(puzzleState.matches).includes(category);
                    
                    return (
                      <button
                        key={category}
                        className={`w-full p-3 border-2 border-black text-left text-sm transition-colors ${
                          isMatched 
                            ? 'bg-green-200 text-green-800 cursor-not-allowed' 
                            : selectedTerm 
                              ? 'bg-secondary text-white hover:bg-accent' 
                              : 'bg-muted cursor-not-allowed'
                        }`}
                        onClick={() => selectedTerm && !isMatched && handleCategoryClick(category)}
                        disabled={!selectedTerm || isMatched}
                        data-testid={`category-${category.toLowerCase().replace(/[^a-z]/g, '-')}`}
                      >
                        {category} {isMatched && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="text-center">
              <button 
                className="nes-btn is-warning"
                onClick={handleRestart}
                data-testid="button-restart-puzzle"
              >
                Ricomincia
              </button>
            </div>
          </>
        ) : (
          <ChallengeCompleted
            title="Puzzle Completato!"
            message="Hai svelato tutti i misteri! La Gemma della Conoscenza è tua."
            emoji="🏆"
          >
            <div className="nes-container is-light p-3 mb-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Punteggio finale:</span>
                  <span className="font-retro">{puzzleState.score} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Tentativi totali:</span>
                  <span>{puzzleState.attempts}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                className="nes-btn is-warning"
                onClick={handleRestart}
                data-testid="button-play-again"
              >
                Gioca di nuovo
              </button>
            </div>
          </ChallengeCompleted>
        )}
      </div>
    </ChallengeContentLayout>
  );
};

export default RetroPuzzle;
