import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from './UiDialog';

const StatisticsModal: React.FC = () => {
  const { modals, closeModal, gameState } = useGameStore();
  const isOpen = modals.statistics?.isOpen;

  const totalGems = gameState.gameProgress.completedChallenges.length;
  const totalScore = gameState.gameProgress.totalScore || 0;
  const challengesCompleted = totalGems;

  if (!isOpen) return null;

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('statistics')} title="Statistiche" className="">
      <div className="text-center p-4" data-testid="modal-statistics">
        <div className="mb-4">
          <div className="text-sm mb-2">Gemme raccolte</div>
          <div className="text-2xl font-mono" data-testid="stats-gems">
            {totalGems} / {gameState.challenges.length}
          </div>
        </div>

        <div className="nes-container is-light p-3 mb-4">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Completate:</span>
              <span className="font-retro" data-testid="stats-completed">
                {challengesCompleted}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Punteggio totale:</span>
              <span data-testid="stats-score">{totalScore} pts</span>
            </div>
          </div>
        </div>

        <menu>
          <button
            className="nes-btn is-primary"
            onClick={() => closeModal('statistics')}
            data-testid="button-close-statistics"
          >
            Chiudi
          </button>
        </menu>
      </div>
    </UiDialog>
  );
};

export default StatisticsModal;
