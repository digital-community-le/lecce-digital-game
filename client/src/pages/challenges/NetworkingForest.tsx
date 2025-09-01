import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import Header from '@/components/Header';
import NetworkingForestChallenge from '@/components/challenges/NetworkingForest';

const NetworkingForestPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState } = useGameStore();

  // Redirect if no user or challenge not available
  if (!gameState.currentUser.userId) {
    setLocation('/');
    return null;
  }

  const challenge = gameState.challenges.find(c => c.id === 'networking-forest');
  if (!challenge || challenge.status === 'locked') {
    setLocation('/game');
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <NetworkingForestChallenge />
      </main>
    </div>
  );
};

export default NetworkingForestPage;