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
      <div className="container mx-auto p-6 max-w-2xl">
        
        {/* Sigillo Header */}
        <div className="text-center mb-6">
          <div className="w-40 h-40 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/assets/images/seal-with-gems.png" 
              alt="Sigillo di Lecce completato" 
              className="w-full h-full object-contain drop-shadow-lg"
              style={{ 
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
            />
          </div>
          <div className="nes-container is-success p-4 mb-4" style={{ backgroundColor: 'var(--ldc-surface)', border: '4px solid var(--ldc-rpg-green)' }}>
            <p className="text-center font-medium text-base" style={{ color: 'var(--ldc-on-surface)' }}>
              🎉 Hai recuperato tutte le gemme e riattivato il sigillo!
            </p>
          </div>
        </div>

        {/* Statistiche Title */}
        <h2 
          className="font-retro text-xl mb-4 text-center"
          data-testid="statistics-title"
          style={{ color: 'var(--ldc-contrast-yellow)' }}
        >
          Statistiche
        </h2>

        {/* Main Stats - Only Total Points */}
        <div className="mb-6">
          <div className="nes-container with-title p-6" style={{ backgroundColor: 'var(--ldc-surface)', border: '4px solid var(--ldc-info)' }}>
            <p className="title font-retro" style={{ color: 'var(--ldc-info)', backgroundColor: 'var(--ldc-background)' }}>Punti Totali</p>
            <div className="text-center">
              <div 
                className="text-5xl font-retro mb-2"
                data-testid="total-points"
                style={{ color: 'var(--ldc-info)' }}
              >
                {totalPoints.toLocaleString('it-IT')}
              </div>
              <div className="text-base font-medium" style={{ color: 'var(--ldc-on-surface)' }}>
                Punti conquistati
              </div>
            </div>
          </div>
        </div>


        {/* Challenge Details */}
        <div>
          <div className="nes-container with-title" style={{ backgroundColor: 'var(--ldc-surface)', border: '4px solid var(--ldc-contrast-yellow)' }}>
            <p className="title font-retro" style={{ color: 'var(--ldc-contrast-yellow)', backgroundColor: 'var(--ldc-background)' }}>Dettagli Sfide</p>
            <div className="space-y-3 p-2">
              {completedChallenges.map((challengeId, index) => {
                const challengeData = gameData.challenges.find(c => c.id === challengeId);
                return (
                  <div 
                    key={challengeId}
                    className="flex items-center justify-between p-3 rounded"
                    style={{ 
                      backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: '2px solid rgba(255,255,255,0.1)'
                    }}
                    data-testid={`challenge-stats-${challengeId}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{challengeData?.emoji}</div>
                      <div>
                        <h3 className="font-retro text-base mb-1" style={{ color: 'var(--ldc-on-surface)' }}>
                          {challengeData?.title}
                        </h3>
                        <div className="text-sm font-medium" style={{ color: 'var(--ldc-rpg-green)' }}>
                          ✓ Completato
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-retro text-xl" style={{ color: 'var(--ldc-contrast-yellow)' }}>
                        {challengeData?.rewards?.points || 0}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>punti</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      </div>
    </GameLayout>
  );
};

export default Statistics;