import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import gameData from '@/assets/game-data.json';

const Statistics: React.FC = () => {
  const [, setLocation] = useLocation();
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

  const handleBackToMap = () => {
    setLocation('/game');
  };

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="font-retro text-4xl md:text-5xl text-yellow-300 mb-4"
            data-testid="statistics-title"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255, 215, 0, 0.5)'
            }}
          >
            Le Tue Statistiche
          </h1>
          <div className="text-xl text-gray-300">
            Leggenda di <span className="text-yellow-300 font-retro">{currentUser.displayName || 'Anonimo'}</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          
          {/* Completion Overview */}
          <div className="bg-gray-800/80 border-2 border-yellow-600 p-6">
            <h2 className="font-retro text-xl text-yellow-300 mb-4 text-center">
              Completamento
            </h2>
            <div className="text-center">
              <div 
                className="text-5xl font-retro text-green-400 mb-2"
                data-testid="completion-rate"
              >
                {completionRate}%
              </div>
              <div className="text-gray-300">
                {completedChallenges.length} di {totalChallenges} sfide
              </div>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-yellow-400 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-gray-800/80 border-2 border-blue-600 p-6">
            <h2 className="font-retro text-xl text-blue-300 mb-4 text-center">
              Punti Totali
            </h2>
            <div className="text-center">
              <div 
                className="text-5xl font-retro text-blue-400 mb-2"
                data-testid="total-points"
              >
                {totalPoints.toLocaleString('it-IT')}
              </div>
              <div className="text-gray-300">
                Punti conquistati
              </div>
            </div>
          </div>

          {/* Badges Count */}
          <div className="bg-gray-800/80 border-2 border-purple-600 p-6">
            <h2 className="font-retro text-xl text-purple-300 mb-4 text-center">
              Gemme & Badge
            </h2>
            <div className="text-center">
              <div 
                className="text-5xl font-retro text-purple-400 mb-2"
                data-testid="badges-count"
              >
                {earnedBadges.length}
              </div>
              <div className="text-gray-300">
                Gemme raccolte
              </div>
            </div>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="mb-12">
          <h2 className="font-retro text-2xl text-yellow-300 mb-6 text-center">
            Gemme Conquistate
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {earnedBadges.map((badge) => (
              <div 
                key={badge.id}
                className="bg-gray-800/80 border-2 border-yellow-600/50 p-6 text-center hover:border-yellow-600 transition-colors"
                data-testid={`badge-${badge.id}`}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-retro text-lg text-yellow-300 mb-2">
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-300">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge Details */}
        <div className="mb-12">
          <h2 className="font-retro text-2xl text-yellow-300 mb-6 text-center">
            Dettagli Sfide
          </h2>
          <div className="space-y-4">
            {completedChallenges.map((challengeId) => {
              const challengeData = gameData.challenges.find(c => c.id === challengeId);
              return (
                <div 
                  key={challengeId}
                  className="bg-gray-800/80 border border-gray-600 p-6 flex items-center justify-between"
                  data-testid={`challenge-stats-${challengeId}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{challengeData?.emoji}</div>
                    <div>
                      <h3 className="font-retro text-lg text-white mb-1">
                        {challengeData?.title}
                      </h3>
                      <div className="text-sm text-gray-400">
                        Completato
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-retro text-xl text-yellow-300">
                      {challengeData?.rewards?.points || 0} punti
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Info */}
        <div className="bg-gray-800/80 border-2 border-gray-600 p-6 mb-8">
          <h2 className="font-retro text-xl text-yellow-300 mb-4 text-center">
            Profilo Giocatore
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <span className="text-gray-400">Nome: </span>
                <span className="text-white font-retro">{currentUser.displayName || 'Anonimo'}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-400">Avatar: </span>
                <span className="text-white text-xl">{currentUser.avatar}</span>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <span className="text-gray-400">Partecipazione: </span>
                <span className="text-white">{gameData.gameConfig.location}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-400">Data evento: </span>
                <span className="text-white">{gameData.gameConfig.eventDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button 
            className="nes-btn is-primary font-retro text-lg px-8 py-4 hover:scale-105 transition-transform"
            onClick={handleBackToMap}
            data-testid="button-back-to-map"
          >
            Torna alla Mappa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;