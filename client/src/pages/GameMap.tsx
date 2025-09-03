import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import CanvasMap from '@/components/CanvasMap';

const GameMapPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState, toasts, removeToast, acknowledgeCompletion } = useGameStore();

    

  // Redirect to intro if no user profile
  useEffect(() => {
    if (!gameState.currentUser.userId) {
      setLocation('/');
    }
  // When the map mounts, surface any pending completion modal queued by store
  acknowledgeCompletion();
  }, [gameState.currentUser.userId, setLocation]);

  if (!gameState.currentUser.userId) {
    return null; // Will redirect
  }

  return (      
    <CanvasMap />
  );
};

export default GameMapPage;