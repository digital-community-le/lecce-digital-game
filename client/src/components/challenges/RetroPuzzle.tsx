import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { PuzzleState, PuzzlePair } from '@shared/schema';

// Sample puzzle data - in a real app this would come from game-data.json
const PUZZLE_PAIRS: PuzzlePair[] = [
  { id: '1', term: 'React', category: 'Frontend Library' },
  { id: '2', term: 'Node.js', category: 'Backend Runtime' },
  { id: '3', term: 'MongoDB', category: 'Database' },
  { id: '4', term: 'TypeScript', category: 'Programming Language' },
  { id: '5', term: 'Docker', category: 'Containerization' },
  { id: '6', term: 'Git', category: 'Version Control' },
  { id: '7', term: 'AWS', category: 'Cloud Platform' },
  { id: '8', term: 'GraphQL', category: 'Query Language' },
];

const RetroPuzzle: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const PAIRS_COUNT = 8;
  const BASE_POINTS = 10;
  const PENALTY = 2;

  useEffect(() => {
    if (gameState.currentUser.userId) {
      let state = gameStorage.getPuzzleState(gameState.currentUser.userId);
      
      if (!state) {
        // Initialize new puzzle state
        const shuffledTerms = [...PUZZLE_PAIRS.map(p => p.term)].sort(() => Math.random() - 0.5);
        const shuffledCategories = [...PUZZLE_PAIRS.map(p => p.category)].sort(() => Math.random() - 0.5);
        
        state = {
          id: `puzzle_${Date.now()}`,
          pairs: PUZZLE_PAIRS,
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

    const shuffledTerms = [...PUZZLE_PAIRS.map(p => p.term)].sort(() => Math.random() - 0.5);
    const shuffledCategories = [...PUZZLE_PAIRS.map(p => p.category)].sort(() => Math.random() - 0.5);
    
    const newState: PuzzleState = {
      id: `puzzle_${Date.now()}`,
      pairs: PUZZLE_PAIRS,
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
    <div>
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="font-retro text-sm mb-3">La Gemma della Conoscenza</h3>
          <p className="text-sm mb-4">
            Nel puzzle antico, ogni connessione rivela un frammento di saggezza. 
            Abbina i termini alle loro categorie per raccogliere la Gemma della Conoscenza.
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 Tocca un termine a sinistra, poi tocca la categoria corrispondente a destra. 
              Ogni errore riduce il punteggio di {PENALTY} punti.
            </p>
          </div>
        </div>

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
          /* Completion message */
          <div className="text-center">
            <div className="nes-container is-success p-4 mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="font-retro text-sm mb-2">Puzzle Completato!</h4>
              <p className="text-sm mb-3">
                Hai svelato tutti i misteri! La Gemma della Conoscenza è tua.
              </p>
              <div className="nes-container is-light p-3">
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
            </div>
            
            <button 
              className="nes-btn is-warning"
              onClick={handleRestart}
              data-testid="button-play-again"
            >
              Gioca di nuovo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroPuzzle;
