import React from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';

interface AuthProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * AuthProtectedRoute - Protects routes requiring authentication
 * Redirects to intro page if not authenticated (unless there's an auth error, which is handled by AuthWrapper)
 * In test mode (test=1), authentication is bypassed
 */
const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({ 
  children, 
  redirectPath = '/' 
}) => {
  const { gameState } = useGameStore();
  const [, setLocation] = useLocation();

  // In test mode, skip authentication checks
  if (gameState.test) {
    return <>{children}</>;
  }

  // If not authenticated and no error (e.g., user directly accessed a protected route)
  if (!gameState.auth.isAuthenticated && !gameState.auth.error) {
    setLocation(redirectPath);
    return null;
  }

  // If authenticated, render children
  if (gameState.auth.isAuthenticated) {
    return <>{children}</>;
  }

  // If there's an auth error, let AuthWrapper handle it (don't redirect)
  return null;
};

export default AuthProtectedRoute;
