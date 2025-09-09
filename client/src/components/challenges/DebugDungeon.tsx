import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { QuizState, QuizQuestion } from '@shared/schema';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import wisdomGem from '@assets/images/gem-of-wisdom.png';
import GameData from '@/assets/game-data.json';

const DebugDungeon: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [flashing, setFlashing] = useState(false);
  const [flashCount, setFlashCount] = useState(0);

  const QUESTIONS_COUNT = 10;
  const PASS_THRESHOLD = 70; // 70% to pass

  const [loadError, setLoadError] = useState<string | null>(null);

  // load questions from bundled game-data.json and initialize quiz state. Throws or sets loadError on failure.
  const fetchAndInit = async (): Promise<boolean> => {
    if (!gameState.currentUser.userId) {
      setIsLoading(false);
      return false;
    }
    setIsLoading(true);
    setLoadError(null);

    try {
      // Use static import instead of runtime fetch. The JSON is bundled under @assets.
      const data: any = (GameData as any) ?? null;

      if (!data) {
        throw new Error('game-data.json non è disponibile nel bundle.');
      }

      const challenge = data.challenges?.find(
        (c: any) => c.id === 'debug-dungeon'
      );

      if (
        !challenge ||
        !Array.isArray(challenge.questions) ||
        challenge.questions.length === 0
      ) {
        throw new Error(
          'Nessuna domanda trovata per la challenge "debug-dungeon" in game-data.json'
        );
      }

      const questions: QuizQuestion[] = challenge.questions.map(
        (q: any, idx: number) => ({
          id: q.id ?? String(idx + 1),
          question: q.question ?? q.text ?? 'Question',
          options: q.options ?? [],
          correctAnswer:
            typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation ?? '',
          category: q.category ?? 'General',
        })
      );

      let state = gameStorage.getQuizState(gameState.currentUser.userId);

      if (!state) {
        state = {
          id: `quiz_${Date.now()}`,
          questions,
          currentQuestionIndex: 0,
          answers: [],
          score: 0,
          completed: false,
          startedAt: new Date().toISOString(),
        };

        gameStorage.saveQuizState(gameState.currentUser.userId, state);
      }

      setQuizState(state);
      return true;
    } catch (err: any) {
      setLoadError(
        err?.message ?? 'Errore durante il caricamento delle domande'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // fire-and-forget init when current user changes
    fetchAndInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentUser.userId]);

  useEffect(() => {
    if (flashing) {
      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        blinkCount++;
        setFlashCount(blinkCount);

        if (blinkCount >= 6) {
          // 3 blinks complete (on-off-on-off-on-off)
          clearInterval(blinkInterval);
          setFlashing(false);
          setFlashCount(0);
        }
      }, 200); // 200ms per ogni cambio stato

      return () => clearInterval(blinkInterval);
    }
  }, [flashing]);

  const submitAnswer = (answerIndex: number) => {
    if (!quizState) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const newAnswers = [...quizState.answers, answerIndex];
    const newScore = isCorrect ? quizState.score + 1 : quizState.score;

    const updatedState: QuizState = {
      ...quizState,
      answers: newAnswers,
      score: newScore,
    };

    setQuizState(updatedState);
    gameStorage.saveQuizState(gameState.currentUser.userId, updatedState);
    setShowExplanation(true);

    if (isCorrect) {
      setFlashing(true);
      setFlashCount(0);
    } else {
      showToast('Risposta sbagliata', 'error');
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    // selecting an answer immediately submits it
    setSelectedAnswer(answerIndex);
    submitAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (!quizState) return;

    const isLastQuestion =
      quizState.currentQuestionIndex === quizState.questions.length - 1;

    if (isLastQuestion) {
      // Complete the quiz
      const finalScore = quizState.score;
      const percentage = (finalScore / QUESTIONS_COUNT) * 100;
      const passed = percentage >= PASS_THRESHOLD;

      const completedState: QuizState = {
        ...quizState,
        completed: true,
        finishedAt: new Date().toISOString(),
      };

      setQuizState(completedState);
      gameStorage.saveQuizState(gameState.currentUser.userId, completedState);

      if (passed) {
        updateChallengeProgress('debug-dungeon', finalScore, true);
      } else {
        updateChallengeProgress('debug-dungeon', finalScore, false);
        showToast(
          `Punteggio insufficiente. Serve almeno ${PASS_THRESHOLD}%`,
          'warning'
        );
      }
    } else {
      // Move to next question
      const nextState: QuizState = {
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
      };

      setQuizState(nextState);
      gameStorage.saveQuizState(gameState.currentUser.userId, nextState);
    }

    setSelectedAnswer(null);
    setShowExplanation(false);
    setFlashing(false);
    setFlashCount(0);
  };

  const handleRestart = async () => {
    if (!gameState.currentUser.userId) return;

    // If we have questions currently loaded, restart using them; otherwise attempt to re-fetch.
    if (quizState && quizState.questions && quizState.questions.length > 0) {
      const newState: QuizState = {
        id: `quiz_${Date.now()}`,
        questions: quizState.questions,
        currentQuestionIndex: 0,
        answers: [],
        score: 0,
        completed: false,
        startedAt: new Date().toISOString(),
      };

      setQuizState(newState);
      gameStorage.saveQuizState(gameState.currentUser.userId, newState);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFlashing(false);
      setFlashCount(0);
      showToast('Quiz riavviato!', 'info');
      return;
    }

    // No questions available locally: try to re-fetch from game-data.json
    setSelectedAnswer(null);
    setShowExplanation(false);
    setFlashing(false);
    setFlashCount(0);
    setLoadError(null);
    const success = await fetchAndInit();
    if (success) showToast('Quiz riavviato!', 'info');
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="title bg-card">Debug Dungeon</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (loadError || !quizState) {
    return (
      <div className="p-4">
        <p className="title bg-card">Debug Dungeon</p>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">
            {loadError ?? 'Impossibile inizializzare il quiz.'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              className="nes-btn is-primary"
              onClick={() => {
                setLoadError(null);
                fetchAndInit();
              }}
              data-testid="button-retry-load"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const progressPercentage =
    ((quizState.currentQuestionIndex + (showExplanation ? 1 : 0)) /
      QUESTIONS_COUNT) *
    100;
  const currentScore = quizState.score;

  if (quizState.completed) {
    const percentage = (quizState.score / QUESTIONS_COUNT) * 100;
    const passed = percentage >= PASS_THRESHOLD;

    return (
      <ChallengeContentLayout
        gemTitle="La Gemma del Sapere"
        gemIcon={wisdomGem}
        description="Nel Debug Dungeon, ogni risposta corretta illumina il sentiero verso la conoscenza. Supera il quiz per conquistare la Gemma del Sapere."
        tip={`Rispondi a ${QUESTIONS_COUNT} domande. Indovinane almeno il ${PASS_THRESHOLD}% per superare il dungeon.`}
        progress={quizState.score}
        total={QUESTIONS_COUNT}
        progressLabel="Progresso"
        isCompleted={passed}
        completionMessage={
          passed
            ? 'Hai dimostrato le tue competenze! La Gemma del Sapere è tua.'
            : 'Challenge non completata. Riprova il dungeon per conquistare la Gemma del Sapere.'
        }
      >
        <div>
          <div className="p-4">
            <div className="text-center">
              <div
                className={`nes-container p-4 mb-4 ${passed ? 'is-success' : 'is-error'}`}
              >
                <div className="text-4xl mb-2">{passed ? '🏆' : '💀'}</div>
                <h4 className="font-retro text-sm mb-2">
                  {passed ? 'Dungeon Conquistato!' : 'Dungeon Non Superato'}
                </h4>
                <p className="text-sm mb-3">
                  {passed
                    ? 'Hai dimostrato le tue competenze! La Gemma del Sapere è tua.'
                    : `Hai bisogno di più preparazione. Serve almeno ${PASS_THRESHOLD}% per superare il dungeon.`}
                </p>
                <div className="nes-container is-light p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Punteggio:</span>
                      <span className="font-retro">
                        {quizState.score}/{QUESTIONS_COUNT}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Percentuale:</span>
                      <span className="font-retro">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="nes-btn is-warning"
                onClick={handleRestart}
                data-testid="button-restart-quiz"
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      </ChallengeContentLayout>
    );
  }

  return (
    <ChallengeContentLayout
      gemTitle="La Gemma del Sapere"
      gemIcon={wisdomGem}
      description="Nel Debug Dungeon, ogni risposta corretta illumina il sentiero verso la conoscenza. Supera il quiz per conquistare la Gemma del Sapere."
      tip={`Rispondi a ${QUESTIONS_COUNT} domande. Serve almeno ${PASS_THRESHOLD}% per superare il dungeon.`}
      progress={quizState.currentQuestionIndex + (showExplanation ? 1 : 0)}
      total={QUESTIONS_COUNT}
      progressLabel="Progresso"
      isCompleted={false}
    >
      <div>
        {/* Question */}
        <div className="mb-6">
          <div className="nes-container with-title mb-4 bg-white">
            <p className="title">
              Domanda {quizState.currentQuestionIndex + 1}
            </p>
            <p className="text-sm" data-testid="question-text">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-1" data-testid="answer-options">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'nes-btn p-3 text-left transition-colors';

              if (showExplanation) {
                if (index === currentQuestion.correctAnswer) {
                  if (flashing && flashCount % 2 === 1) {
                    // Hidden state during blink - will use style visibility: hidden
                    buttonClass += ' is-success';
                  } else {
                    // Visible state - green
                    buttonClass += ' is-success';
                  }
                } else if (
                  index === selectedAnswer &&
                  index !== currentQuestion.correctAnswer
                ) {
                  buttonClass += ' is-error';
                } else {
                  buttonClass += ' is-disabled';
                }
              } else {
                if (selectedAnswer === index) {
                  buttonClass += ' is-primary';
                } else {
                  buttonClass += ' hover:bg-primary hover:text-white';
                }
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  style={
                    flashing &&
                    index === currentQuestion.correctAnswer &&
                    flashCount % 2 === 1
                      ? { visibility: 'hidden' }
                      : {}
                  }
                  onClick={() => !showExplanation && handleAnswerSelect(index)}
                  disabled={showExplanation}
                  data-testid={`answer-option-${index}`}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className="nes-container is-light p-3 mt-4">
              <p className="text-xs">
                <strong>Spiegazione:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="text-center">
          {showExplanation && (
            <button
              className="nes-btn is-primary"
              onClick={handleNextQuestion}
              data-testid="button-next-question"
            >
              {quizState.currentQuestionIndex === quizState.questions.length - 1
                ? 'Completa quiz'
                : 'Prossima domanda'}
            </button>
          )}
        </div>
      </div>
    </ChallengeContentLayout>
  );
};

export default DebugDungeon;
