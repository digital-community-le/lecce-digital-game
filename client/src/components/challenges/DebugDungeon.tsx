import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { QuizState, QuizQuestion } from '@shared/schema';

// Sample quiz questions - in a real app this would come from game-data.json
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question: 'Quale hook di React viene utilizzato per gestire lo stato locale?',
    options: ['useEffect', 'useState', 'useContext', 'useReducer'],
    correctAnswer: 1,
    explanation: 'useState è l\'hook principale per gestire lo stato locale in React.',
    category: 'React'
  },
  {
    id: '2',
    question: 'Qual è la porta predefinita per un server HTTP?',
    options: ['80', '443', '8080', '3000'],
    correctAnswer: 0,
    explanation: 'La porta 80 è la porta standard per il protocollo HTTP.',
    category: 'Networking'
  },
  {
    id: '3',
    question: 'Cosa significa SQL?',
    options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'],
    correctAnswer: 0,
    explanation: 'SQL sta per Structured Query Language.',
    category: 'Database'
  },
  {
    id: '4',
    question: 'Quale metodo HTTP viene utilizzato per creare una nuova risorsa?',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    correctAnswer: 1,
    explanation: 'POST viene utilizzato per creare nuove risorse sul server.',
    category: 'HTTP'
  },
  {
    id: '5',
    question: 'Cos\'è Node.js?',
    options: ['Un framework frontend', 'Un database', 'Un runtime JavaScript per server', 'Un linguaggio di programmazione'],
    correctAnswer: 2,
    explanation: 'Node.js è un runtime JavaScript che permette di eseguire codice JavaScript sul server.',
    category: 'Backend'
  },
  {
    id: '6',
    question: 'Quale simbolo viene utilizzato per i commenti in JavaScript?',
    options: ['#', '//', '/*', '<!--'],
    correctAnswer: 1,
    explanation: '// viene utilizzato per i commenti su singola riga in JavaScript.',
    category: 'JavaScript'
  },
  {
    id: '7',
    question: 'Cosa significa CSS?',
    options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
    correctAnswer: 1,
    explanation: 'CSS sta per Cascading Style Sheets.',
    category: 'CSS'
  },
  {
    id: '8',
    question: 'Quale comando Git viene utilizzato per clonare un repository?',
    options: ['git clone', 'git copy', 'git download', 'git pull'],
    correctAnswer: 0,
    explanation: 'git clone viene utilizzato per clonare un repository Git.',
    category: 'Git'
  },
  {
    id: '9',
    question: 'Qual è il significato di API?',
    options: ['Application Programming Interface', 'Automated Programming Interface', 'Advanced Programming Interface', 'Application Process Interface'],
    correctAnswer: 0,
    explanation: 'API sta per Application Programming Interface.',
    category: 'General'
  },
  {
    id: '10',
    question: 'Quale attributo HTML viene utilizzato per specificare un identificatore unico?',
    options: ['class', 'id', 'name', 'unique'],
    correctAnswer: 1,
    explanation: 'L\'attributo id viene utilizzato per specificare un identificatore unico in HTML.',
    category: 'HTML'
  }
];

const DebugDungeon: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const QUESTIONS_COUNT = 10;
  const PASS_THRESHOLD = 70; // 70% to pass

  useEffect(() => {
    if (gameState.currentUser.userId) {
      let state = gameStorage.getQuizState(gameState.currentUser.userId);
      
      if (!state) {
        // Initialize new quiz state
        state = {
          id: `quiz_${Date.now()}`,
          questions: QUIZ_QUESTIONS,
          currentQuestionIndex: 0,
          answers: [],
          score: 0,
          completed: false,
          startedAt: new Date().toISOString(),
        };
        
        gameStorage.saveQuizState(gameState.currentUser.userId, state);
      }
      
      setQuizState(state);
      setIsLoading(false);
    }
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

  const handleRestart = () => {
    if (!gameState.currentUser.userId) return;

    const newState: QuizState = {
      id: `quiz_${Date.now()}`,
      questions: QUIZ_QUESTIONS,
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
  };

  if (isLoading || !quizState) {
    return (
      <div className="p-4">
        <p className="title bg-card">Debug Dungeon</p>
        <div className="text-center">Caricamento...</div>
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
      <div>
        <p className="title bg-card">Debug Dungeon</p>
        
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
    );
  }

  return (
    <div>
      <p className="title bg-card">Debug Dungeon</p>
      
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="font-retro text-sm mb-3">La Gemma del Sapere</h3>
          <p className="text-sm mb-4">
            Nel Debug Dungeon, ogni risposta corretta illumina il sentiero verso la conoscenza. 
            Supera il quiz per conquistare la Gemma del Sapere.
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 Rispondi a {QUESTIONS_COUNT} domande. Serve almeno {PASS_THRESHOLD}% per superare il dungeon.
            </p>
          </div>
        </div>

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
  );
};

export default DebugDungeon;
