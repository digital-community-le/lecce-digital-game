import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';
import DebugDungeonChallenge from '@/components/challenges/DebugDungeon';

const DebugDungeonPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState } = useGameStore();

  // Redirect if no user or challenge not available
  if (!gameState.currentUser.userId) {
    setLocation('/');
    return null;
  }

  const challenge = gameState.challenges.find(c => c.id === 'debug-dungeon');
  if (!challenge || challenge.status === 'locked') {
    setLocation('/game');
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page header: back to map + challenge title */}
        <div className="flex items-center gap-4 mb-6">
          <button
            className="nes-btn is-normal"
            onClick={() => setLocation('/game')}
            aria-label="Torna alla mappa"
            data-testid="button-back-to-map"
          >
            <i className="nes-icon caret-left is-small" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-retro" data-testid="challenge-title">{challenge.title}</h1>
        </div>
        <DebugDungeonChallenge />
      </main>
    </div>
  );
};

export default DebugDungeonPage;