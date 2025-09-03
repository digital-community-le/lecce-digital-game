import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import GameLayout from '@/components/layout/GameLayout';
import gameData from '@/assets/game-data.json';

const Statistics: React.FC = () => {
  const { gameState } = useGameStore();
  
  const { currentUser, gameProgress } = gameState;
  const completedChallenges = gameProgress.completedChallenges;
  const totalPoints = gameProgress.totalScore;
  
  // Calculate completion stats
  const totalChallenges = gameData.challenges.length;
  const completionRate = Math.round((completedChallenges.length / totalChallenges) * 100);
  
  // Get earned badges - completedChallenges is string[] not object[]
  const earnedBadges = gameData.rewards.badges.filter(badge => {
    return completedChallenges.some(challengeId => {
      const challengeData = gameData.challenges.find(c => c.id === challengeId);
      return challengeData?.rewards.badge === badge.name;
    });
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <GameLayout>
      <div className="container mx-auto p-4">
        
        {/* Sigillo Header */}
        <div className="text-center mb-8">
          <div className="w-48 h-48 mx-auto mb-4">
            <img 
              src="/assets/images/seal-with-gems.png" 
              alt="Sigillo di Lecce completato" 
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="nes-container is-rounded p-4 mb-6" style={{ backgroundColor: 'var(--ldc-surface)' }}>
            <p className="text-center font-medium" style={{ color: 'var(--ldc-contrast-yellow)' }}>
              Hai recuperato tutte le gemme e riattivato il sigillo!
            </p>
          </div>
          <h2 
            className="font-retro text-lg mb-6"
            data-testid="statistics-title"
            style={{ color: 'var(--ldc-contrast-yellow)' }}
          >
            Statistiche
          </h2>
        </div>

        {/* Main Stats - Only Total Points */}
        <div className="flex justify-center mb-8">
          <div className="nes-container is-rounded p-6 w-full max-w-md" style={{ backgroundColor: 'var(--ldc-surface)' }}>
            <h2 className="font-retro text-lg mb-4 text-center" style={{ color: 'var(--ldc-info)' }}>
              Punti Totali
            </h2>
            <div className="text-center">
              <div 
                className="text-4xl font-retro mb-2"
                data-testid="total-points"
                style={{ color: 'var(--ldc-info)' }}
              >
                {totalPoints.toLocaleString('it-IT')}
              </div>
              <div className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>
                Punti conquistati
              </div>
            </div>
          </div>
        </div>


        {/* Challenge Details */}
        <div className="mb-8">
          <h2 className="font-retro text-xl mb-4 text-center" style={{ color: 'var(--ldc-contrast-yellow)' }}>
            Dettagli Sfide
          </h2>
          <div className="space-y-3">
            {completedChallenges.map((challengeId) => {
              const challengeData = gameData.challenges.find(c => c.id === challengeId);
              return (
                <div 
                  key={challengeId}
                  className="nes-container is-rounded p-4 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--ldc-surface)' }}
                  data-testid={`challenge-stats-${challengeId}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{challengeData?.emoji}</div>
                    <div>
                      <h3 className="font-retro text-sm mb-1" style={{ color: 'var(--ldc-on-surface)' }}>
                        {challengeData?.title}
                      </h3>
                      <div className="text-xs" style={{ color: 'var(--ldc-rpg-green)' }}>
                        Completato
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-retro text-sm" style={{ color: 'var(--ldc-contrast-yellow)' }}>
                      {challengeData?.rewards?.points || 0} pt
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </GameLayout>
  );
};

export default Statistics;