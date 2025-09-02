import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from './UiDialog';
import allianceGem from '@assets/images/gem-of-alliance.png';
import memoryGem from '@assets/images/gem-of-memory.png';
import wisdomGem from '@assets/images/gem-of-wisdom.png';
import communityGem from '@assets/images/gem-of-community.png';

const StatisticsModal: React.FC = () => {
  const { modals, closeModal, gameState } = useGameStore();
  const isOpen = modals.statistics?.isOpen;

  const totalGems = gameState.gameProgress.completedChallenges.length;
  const totalScore = gameState.gameProgress.totalScore || 0;
  const challengesCompleted = totalGems;

  const gemMap: Record<string, string> = {
    'networking-forest': allianceGem,
    'retro-puzzle': memoryGem,
    'debug-dungeon': wisdomGem,
    'social-arena': communityGem,
  };

  const badgeMap: Record<string, string> = {
    'networking-forest': "Gemma dell'Alleanza",
    'retro-puzzle': "Gemma della Conoscenza",
    'debug-dungeon': "Gemma del Sapere",
    'social-arena': "Sigillo di Lecce",
  };

  const isCollected = (id: string) => gameState.gameProgress.completedChallenges.includes(id);

  if (!isOpen) return null;

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('statistics')} title="Statistiche" className="">
      <div data-testid="modal-statistics">
        <div className="mt-0 mb-4">
          <div className="space-y-2">
            {gameState.challenges.map(ch => {
              const src = gemMap[ch.id] || '';
              const collected = isCollected(ch.id);
              const badgeName = badgeMap[ch.id] || ch.title;
              return (
                <div key={ch.id} className="flex items-center gap-3 p-2 rounded">
                  <img
                    src={src}
                    alt={badgeName}
                    className={`w-12 h-12 object-contain flex-shrink-0 ${collected ? '' : 'filter grayscale'}`}
                  />
                  <div className="text-left">
                    <div className="font-medium text-sm">{badgeName}</div>
                    <div className="text-xs text-muted-foreground">{ch.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div className="nes-container is-light p-3 mb-4">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Raccolte:</span>
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

        <menu className='flex justify-center'>
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
