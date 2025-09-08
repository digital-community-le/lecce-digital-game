import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import CanvasMap from '@/components/CanvasMap';

const GameMapPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState, toasts, removeToast } = useGameStore();

    

  // Redirect to intro if no user profile
  // Redirect to game-complete if game is completed (all challenges done)
  useEffect(() => {
    if (!gameState.currentUser.userId) {
      setLocation('/');
      return;
    }
    
    // Check if all challenges are completed - redirect to final page
    if (gameState.gameProgress.completedChallenges.length === 4) {
      setLocation('/game-complete');
      return;
    }
  }, [gameState.currentUser.userId, gameState.gameProgress.completedChallenges.length, setLocation]);

  // Prevent rendering if redirecting
  if (!gameState.currentUser.userId || gameState.gameProgress.completedChallenges.length === 4) {
    return null; // Will redirect
  }

  return (      
    <CanvasMap />
  );
};

export default GameMapPage;