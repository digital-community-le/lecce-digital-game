import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { QuizState, QuizQuestion } from '@shared/schema';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import wisdomGem from '@assets/images/gem-of-wisdom.png';

const DebugDungeon: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const QUESTIONS_COUNT = 10;
  const PASS_THRESHOLD = 70; // 70% to pass

  const [loadError, setLoadError] = useState<string | null>(null);

  // fetch questions from game-data.json and initialize quiz state. Throws or sets loadError on failure.
  const fetchAndInit = async (): Promise<boolean> => {
    if (!gameState.currentUser.userId) {
      setIsLoading(false);
      return false;
    }
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetch('/game-data.json');
      if (!res.ok) {
        throw new Error(`Impossibile caricare game-data.json (status ${res.status})`);
      }

      const data = await res.json();
      const challenge = data.challenges?.find((c: any) => c.id === 'debug-dungeon');

      if (!challenge || !Array.isArray(challenge.questions) || challenge.questions.length === 0) {
        throw new Error('Nessuna domanda trovata per la challenge "debug-dungeon" in game-data.json');
      }

      const questions: QuizQuestion[] = challenge.questions.map((q: any, idx: number) => ({
        id: q.id ?? String(idx + 1),
        question: q.question ?? q.text ?? 'Question',
        options: q.options ?? [],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation ?? '',
        category: q.category ?? 'General',
      }));

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
      setLoadError(err?.message ?? 'Errore durante il caricamento delle domande');
  return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // fire-and-forget init
    fetchAndInit();
  }, [gameState.currentUser.userId]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (!quizState || selectedAnswer === null) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswers = [...quizState.answers, selectedAnswer];
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
      showToast('Risposta corretta!', 'success');
    } else {
      showToast('Risposta sbagliata', 'error');
    }
  };

  const handleNextQuestion = () => {
    if (!quizState) return;

    const isLastQuestion = quizState.currentQuestionIndex === quizState.questions.length - 1;
    
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
        showToast('Quiz completato con successo!', 'success');
      } else {
        updateChallengeProgress('debug-dungeon', finalScore, false);
        showToast(`Punteggio insufficiente. Serve almeno ${PASS_THRESHOLD}%`, 'warning');
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
      showToast('Quiz riavviato!', 'info');
      return;
    }

  // No questions available locally: try to re-fetch from game-data.json
  setSelectedAnswer(null);
  setShowExplanation(false);
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
          <p className="text-sm text-red-600 mb-3">{loadError ?? 'Impossibile inizializzare il quiz.'}</p>
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
  const progressPercentage = ((quizState.currentQuestionIndex + (showExplanation ? 1 : 0)) / QUESTIONS_COUNT) * 100;
  const currentScore = quizState.score;

  if (quizState.completed) {
    const percentage = (quizState.score / QUESTIONS_COUNT) * 100;
    const passed = percentage >= PASS_THRESHOLD;
    
    return (
      <ChallengeContentLayout
        gemTitle="La Gemma del Sapere"
        gemIcon={wisdomGem}
        description="Nel Debug Dungeon, ogni risposta corretta illumina il sentiero verso la conoscenza. Supera il quiz per conquistare la Gemma del Sapere."
        tip={`💡 Rispondi a ${QUESTIONS_COUNT} domande. Serve almeno ${PASS_THRESHOLD}% per superare il dungeon.`}
        progress={quizState.score}
        total={QUESTIONS_COUNT}
        progressLabel="Progresso"
        isCompleted={true}
        completionMessage={passed ? 'Hai dimostrato le tue competenze! La Gemma del Sapere è tua.' : undefined}
      >
        <div>
          <div className="p-4">
          <div className="text-center">
            <div className={`nes-container p-4 mb-4 ${passed ? 'is-success' : 'is-error'}`}>
              <div className="text-4xl mb-2">{passed ? '🏆' : '💀'}</div>
              <h4 className="font-retro text-sm mb-2">
                {passed ? 'Dungeon Conquistato!' : 'Dungeon Non Superato'}
              </h4>
              <p className="text-sm mb-3">
                {passed 
                  ? 'Hai dimostrato le tue competenze! La Gemma del Sapere è tua.' 
                  : `Hai bisogno di più preparazione. Serve almeno ${PASS_THRESHOLD}% per superare il dungeon.`
                }
              </p>
              <div className="nes-container is-light p-3">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Punteggio:</span>
                    <span className="font-retro">{quizState.score}/{QUESTIONS_COUNT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentuale:</span>
                    <span className="font-retro">{percentage.toFixed(1)}%</span>
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
        <div className="p-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso</span>
            <span data-testid="text-quiz-progress">
              {quizState.currentQuestionIndex + 1}/{QUESTIONS_COUNT}
            </span>
          </div>
          <div className="progress-custom mb-3">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-quiz"
            ></div>
          </div>
          <div className="text-xs">
            Punteggio attuale: <span className="font-retro" data-testid="text-quiz-score">
              {currentScore}/{quizState.currentQuestionIndex + (showExplanation ? 1 : 0)}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <div className="nes-container with-title mb-4">
            <p className="title">Domanda {quizState.currentQuestionIndex + 1}</p>
            <p className="text-sm p-3" data-testid="question-text">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2" data-testid="answer-options">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'w-full p-3 border-2 border-black text-left text-sm transition-colors';
              
              if (showExplanation) {
                if (index === currentQuestion.correctAnswer) {
                  buttonClass += ' bg-green-200 text-green-800';
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                  buttonClass += ' bg-red-200 text-red-800';
                } else {
                  buttonClass += ' bg-muted cursor-not-allowed';
                }
              } else {
                if (selectedAnswer === index) {
                  buttonClass += ' bg-primary text-white';
                } else {
                  buttonClass += ' bg-muted hover:bg-primary hover:text-white';
                }
              }
              
              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => !showExplanation && handleAnswerSelect(index)}
                  disabled={showExplanation}
                  data-testid={`answer-option-${index}`}
                >
                  {String.fromCharCode(65 + index)}. {option}
                  {showExplanation && index === currentQuestion.correctAnswer && ' ✓'}
                  {showExplanation && index === selectedAnswer && index !== currentQuestion.correctAnswer && ' ✗'}
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
          {!showExplanation ? (
            <button 
              className="nes-btn is-primary"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              data-testid="button-submit-answer"
            >
              Conferma risposta
            </button>
          ) : (
            <button 
              className="nes-btn is-primary"
              onClick={handleNextQuestion}
              data-testid="button-next-question"
            >
              {quizState.currentQuestionIndex === quizState.questions.length - 1 
                ? 'Completa quiz' 
                : 'Prossima domanda'
              }
            </button>
          )}
        </div>
      </div>
    </div>
    </ChallengeContentLayout>
  );
};

export default DebugDungeon;
