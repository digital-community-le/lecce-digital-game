export type Theme = 'default' | 'dark' | 'high-contrast';

export type ChallengeStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface MapNode {
  id: string;
  title: string;
  emoji: string;
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
  qrData: string | null;
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
