import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectPath = '/game-complete' 
}) => {
  const { gameState } = useGameStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If game is completed, redirect to completion page
    if (gameState.gameProgress.gameCompleted) {
      setLocation(redirectPath);
    }
  }, [gameState.gameProgress.gameCompleted, setLocation, redirectPath]);

  // Don't render if game is completed (will redirect)
  if (gameState.gameProgress.gameCompleted) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;