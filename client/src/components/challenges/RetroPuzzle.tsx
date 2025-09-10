import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { PuzzleState, PuzzlePair } from '@shared/schema';
import ChallengeCompleted from '@/components/ChallengeCompleted';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import { ChallengeButton } from '@/components/ui/ChallengeButton';
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
  const [blinkingPair, setBlinkingPair] = useState<{
    term: string;
    category: string;
  } | null>(null);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [pendingUpdate, setPendingUpdate] = useState<{
    matches: Record<string, string>;
    remaining: number;
    attempts: number;
    score: number;
    isCompleted: boolean;
    finishedAt?: string;
  } | null>(null);

  const BASE_POINTS = 10;
  const PENALTY = 2;

  // If configuration is missing, surface a clear error message and log it.
  if (!retroConfig || !PAIRS_DATA) {
    console.error(
      'RetroPuzzle configuration not found in game-data.json (expected challenge id "retro-puzzle").'
    );
    return (
      <div className="p-4">
        <p className="title bg-card">Retro Puzzle — Errore</p>
        <div className="text-center text-red-600 mt-4">
          Configurazione della challenge "retro-puzzle" non trovata in{' '}
          <code>game-data.json</code>. Controlla che la sezione sia presente e
          valida.
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
        const shuffledTerms = [
          ...PAIRS_DATA.map((p: PuzzlePair) => p.term),
        ].sort(() => Math.random() - 0.5);
        const shuffledCategories = [
          ...PAIRS_DATA.map((p: PuzzlePair) => p.category),
        ].sort(() => Math.random() - 0.5);

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

    const correctPair = puzzleState.pairs.find(
      (pair) => pair.term === selectedTerm
    );
    const isCorrect = correctPair?.category === category;

    const newAttempts = puzzleState.attempts + 1;
    let newMatches = { ...puzzleState.matches };
    let newRemaining = puzzleState.remaining;
    let newScore = puzzleState.score || 0;

    if (isCorrect) {
      // Avvia l'animazione di blink PRIMA di aggiornare lo stato
      setBlinkingPair({ term: selectedTerm, category });

      // Prepara i dati per l'aggiornamento dopo il blink
      newMatches[selectedTerm] = category;
      newRemaining--;
      newScore += BASE_POINTS;

      const isCompleted = newRemaining === 0;
      const finishedAt = isCompleted ? new Date().toISOString() : undefined;

      // Salva le modifiche in pendingUpdate invece di applicarle immediatamente
      setPendingUpdate({
        matches: newMatches,
        remaining: newRemaining,
        attempts: newAttempts,
        score: newScore,
        isCompleted,
        finishedAt,
      });

      showToast(`Giusto! +${BASE_POINTS} punti`, 'success');
    } else {
      // Per risposte sbagliate, aggiorna immediatamente (no blink)
      newScore = Math.max(0, newScore - PENALTY);

      const updatedState: PuzzleState = {
        ...puzzleState,
        attempts: newAttempts,
        score: newScore,
      };

      setPuzzleState(updatedState);
      gameStorage.savePuzzleState(gameState.currentUser.userId, updatedState);
      showToast(`Sbagliato — riprova (−${PENALTY} punti)`, 'error');
    }

    setSelectedTerm(null);
  };

  const handleBlinkComplete = () => {
    // Quando il blink termina, aggiungi gli elementi alla lista di quelli nascosti
    if (blinkingPair) {
      setHiddenElements(
        (prev) => new Set([...prev, blinkingPair.term, blinkingPair.category])
      );
      setBlinkingPair(null);
    }

    // Applica l'aggiornamento pendente DOPO il blink
    if (pendingUpdate && puzzleState) {
      const updatedState: PuzzleState = {
        ...puzzleState,
        matches: pendingUpdate.matches,
        remaining: pendingUpdate.remaining,
        attempts: pendingUpdate.attempts,
        score: pendingUpdate.score,
        finishedAt: pendingUpdate.finishedAt,
      };

      setPuzzleState(updatedState);
      gameStorage.savePuzzleState(gameState.currentUser.userId, updatedState);

      // Aggiorna il progresso della challenge
      if (pendingUpdate.isCompleted) {
        updateChallengeProgress('retro-puzzle', PAIRS_COUNT, true);
      } else {
        updateChallengeProgress(
          'retro-puzzle',
          PAIRS_COUNT - pendingUpdate.remaining,
          false
        );
      }

      setPendingUpdate(null);
    }
  };

  const handleRestart = () => {
    if (!gameState.currentUser.userId) return;

    const shuffledTerms = [...PAIRS_DATA.map((p: PuzzlePair) => p.term)].sort(
      () => Math.random() - 0.5
    );
    const shuffledCategories = [
      ...PAIRS_DATA.map((p: PuzzlePair) => p.category),
    ].sort(() => Math.random() - 0.5);

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
    setBlinkingPair(null);
    setHiddenElements(new Set()); // Reset hidden elements
    setPendingUpdate(null); // Reset pending update
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

  const progressPercentage =
    ((PAIRS_COUNT - puzzleState.remaining) / PAIRS_COUNT) * 100;
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
      <div>
        {!isCompleted ? (
          <>
            {/* Game board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Terms column */}
              <div>
                <h4 className="font-retro text-xs mb-3">Termini</h4>
                <div className="space-y-2" data-testid="terms-column">
                  {puzzleState.shuffledTerms
                    .filter((term) => {
                      // Nascondi gli elementi che sono stati esplicitamente nascosti dopo il blink
                      if (hiddenElements.has(term)) return false;

                      // Mostra tutti gli altri, inclusi quelli che stanno blinkando
                      return true;
                    })
                    .map((term) => {
                      const isMatched = puzzleState.matches[term];
                      const isSelected = selectedTerm === term;
                      const shouldBlink = blinkingPair?.term === term;

                      let variant: 'default' | 'primary' | 'success' =
                        'default';
                      if (shouldBlink) {
                        // Durante il blink, i pulsanti devono essere verdi
                        variant = 'success';
                      } else if (isSelected) {
                        variant = 'primary';
                      }

                      return (
                        <ChallengeButton
                          key={term}
                          variant={variant}
                          shouldBlink={shouldBlink}
                          onBlinkComplete={handleBlinkComplete}
                          onClick={() => !isMatched && handleTermClick(term)}
                          disabled={!!isMatched}
                          data-testid={`term-${term.toLowerCase().replace(/[^a-z]/g, '-')}`}
                        >
                          {term} {isMatched && '✓'}
                        </ChallengeButton>
                      );
                    })}
                </div>
              </div>

              {/* Categories column */}
              <div>
                <h4 className="font-retro text-xs mb-3">Categorie</h4>
                <div className="space-y-2" data-testid="categories-column">
                  {puzzleState.shuffledCategories
                    .filter((category) => {
                      // Nascondi gli elementi che sono stati esplicitamente nascosti dopo il blink
                      if (hiddenElements.has(category)) return false;

                      // Mostra tutti gli altri, inclusi quelli che stanno blinkando
                      return true;
                    })
                    .map((category) => {
                      const isMatched = Object.values(
                        puzzleState.matches
                      ).includes(category);
                      const shouldBlink = blinkingPair?.category === category;

                      let variant:
                        | 'default'
                        | 'primary'
                        | 'success'
                        | 'disabled' = 'disabled';
                      if (shouldBlink) {
                        // Durante il blink, i pulsanti devono essere verdi
                        variant = 'success';
                      } else if (selectedTerm) {
                        variant = 'primary';
                      }

                      return (
                        <ChallengeButton
                          key={category}
                          variant={variant}
                          shouldBlink={shouldBlink}
                          onBlinkComplete={handleBlinkComplete}
                          onClick={() =>
                            selectedTerm &&
                            !isMatched &&
                            handleCategoryClick(category)
                          }
                          disabled={!selectedTerm || isMatched}
                          data-testid={`category-${category.toLowerCase().replace(/[^a-z]/g, '-')}`}
                        >
                          {category} {isMatched && '✓'}
                        </ChallengeButton>
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
