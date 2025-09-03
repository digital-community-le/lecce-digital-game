import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import TokenErrorScreen from './TokenErrorScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { gameState } = useGameStore();

  // In test mode, skip authentication checks
  if (gameState.test) {
    return <>{children}</>;
  }

  // Show error screen if authentication failed
  if (!gameState.auth.isAuthenticated && gameState.auth.error) {
    return (
      <TokenErrorScreen
        error={gameState.auth.error}
        onRetry={() => {
          // Reload the page to retry authentication
          window.location.reload();
        }}
      />
    );
  }

  // Show children if authenticated or still loading
  return <>{children}</>;
};

export default AuthWrapper;
