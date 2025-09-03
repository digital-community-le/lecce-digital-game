import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import GameLayout from '@/components/layout/GameLayout';
import allianceGem from '@assets/images/gem-of-alliance.png';
import memoryGem from '@assets/images/gem-of-memory.png';
import wisdomGem from '@assets/images/gem-of-wisdom.png';
import communityGem from '@assets/images/gem-of-community.png';

const Statistics: React.FC = () => {
  const { gameState } = useGameStore();
  
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

  return (
    <GameLayout>
      <div className="container mx-auto p-4 max-w-md">
        
        {/* Sigillo Header */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4">
            <img 
              src="/assets/images/seal-with-gems.png" 
              alt="Sigillo di Lecce completato" 
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <p className="text-center text-sm mb-4">
            Hai recuperato tutte le gemme e riattivato il sigillo!
          </p>
        </div>

        {/* Gemme Raccolte - Same style as StatisticsModal */}
        <div className="mb-4">
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

        {/* Statistiche Finali - Same style as StatisticsModal */}
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

      </div>
    </GameLayout>
  );
};

export default Statistics;