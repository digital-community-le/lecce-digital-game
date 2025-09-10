import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import CanvasMap from '@/components/CanvasMap';

const GameMapPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState, toasts, removeToast } = useGameStore();

  useEffect(() => {
    // Check if all challenges are completed - redirect to final page
    if (gameState.currentUser.userId && gameState.gameProgress.gameCompleted) {
      setLocation('/game-complete');
      return;
    }
  }, []);

  // Redirect to intro if no user profile
  useEffect(() => {
    if (!gameState.currentUser.userId) {
      setLocation('/');
      return;
    }
  }, [
    gameState.currentUser.userId,
    gameState.gameProgress.completedChallenges.length,
    setLocation,
  ]);

  // Prevent rendering if redirecting
  if (!gameState.currentUser.userId || gameState.gameProgress.gameCompleted) {
    return null; // Will redirect
  }

  return <CanvasMap />;
};

export default GameMapPage;
