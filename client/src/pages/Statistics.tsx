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
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center">
            <div className="text-4xl">🏆</div>
          </div>
          <h1 
            className="font-retro text-2xl mb-2"
            data-testid="statistics-title"
            style={{ color: 'var(--ldc-contrast-yellow)' }}
          >
            Le Tue Statistiche
          </h1>
          <div className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>
            Leggenda di <span className="font-retro" style={{ color: 'var(--ldc-contrast-yellow)' }}>{currentUser.displayName || 'Anonimo'}</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          
          {/* Completion Overview */}
          <div className="nes-container is-rounded p-4">
            <h2 className="font-retro text-lg mb-4 text-center" style={{ color: 'var(--ldc-rpg-green)' }}>
              Completamento
            </h2>
            <div className="text-center">
              <div 
                className="text-3xl font-retro mb-2"
                data-testid="completion-rate"
                style={{ color: 'var(--ldc-rpg-green)' }}
              >
                {completionRate}%
              </div>
              <div className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>
                {completedChallenges.length} di {totalChallenges} sfide
              </div>
            </div>
          </div>

          {/* Total Points */}
          <div className="nes-container is-rounded p-4">
            <h2 className="font-retro text-lg mb-4 text-center" style={{ color: 'var(--ldc-info)' }}>
              Punti Totali
            </h2>
            <div className="text-center">
              <div 
                className="text-3xl font-retro mb-2"
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

          {/* Badges Count */}
          <div className="nes-container is-rounded p-4">
            <h2 className="font-retro text-lg mb-4 text-center" style={{ color: 'var(--ldc-primary)' }}>
              Gemme & Badge
            </h2>
            <div className="text-center">
              <div 
                className="text-3xl font-retro mb-2"
                data-testid="badges-count"
                style={{ color: 'var(--ldc-primary)' }}
              >
                {earnedBadges.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>
                Gemme raccolte
              </div>
            </div>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="mb-8">
          <h2 className="font-retro text-xl mb-4 text-center" style={{ color: 'var(--ldc-contrast-yellow)' }}>
            Gemme Conquistate
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <div 
                key={badge.id}
                className="nes-container is-rounded p-4 text-center"
                data-testid={`badge-${badge.id}`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h3 className="font-retro text-sm mb-2" style={{ color: 'var(--ldc-contrast-yellow)' }}>
                  {badge.name}
                </h3>
                <p className="text-xs" style={{ color: 'var(--ldc-on-surface)' }}>
                  {badge.description}
                </p>
              </div>
            ))}
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

        {/* User Profile Info */}
        <div className="nes-container is-rounded p-4 mb-8">
          <h2 className="font-retro text-lg mb-4 text-center" style={{ color: 'var(--ldc-contrast-yellow)' }}>
            Profilo Giocatore
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="mb-3">
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>Nome: </span>
                <span className="font-retro text-sm" style={{ color: 'var(--ldc-contrast-yellow)' }}>{currentUser.displayName || 'Anonimo'}</span>
              </div>
              <div className="mb-3">
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>Avatar: </span>
                <span className="text-lg">{currentUser.avatar}</span>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>Partecipazione: </span>
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>{gameData.gameConfig.location}</span>
              </div>
              <div className="mb-3">
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>Data evento: </span>
                <span className="text-sm" style={{ color: 'var(--ldc-on-surface)' }}>{gameData.gameConfig.eventDate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </GameLayout>
  );
};

export default Statistics;