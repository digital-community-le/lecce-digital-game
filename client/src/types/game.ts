export type Theme = 'default' | 'dark' | 'high-contrast';

export type ChallengeStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface MapNode {
  id: string;
  title: string;
  emoji: string;
  /** Optional path/URL to an icon used when rendering the node on the map */
  nodeIcon?: string;
  position: { top: string; left: string };
  status: ChallengeStatus;
  progress: number;
  total: number;
}

export interface GameState {
  currentUser: {
  userId: string;
  displayName: string;
  avatar: string;
  title?: string;
  };
  challenges: MapNode[];
  currentChallengeId: string | null;
  theme: Theme;
  gameProgress: {
    completedChallenges: string[];
    totalScore: number;
    gameCompleted: boolean;
  };
  /** Feature flag: if true the app is in test mode (set via ?test=1) */
  test?: boolean;
  /** Authentication state */
  auth: {
    isAuthenticated: boolean;
    token: string | null;
    error: string | null;
  };
  /** Avatar animation state for map movement */
  avatarAnimation: {
    isAnimating: boolean;
    fromChallengeId: string | null;
    toChallengeId: string | null;
    progress: number; // 0-1
    duration: number; // milliseconds
  };
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}
