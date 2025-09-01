import { useState, useEffect, useCallback } from 'react';
import { GameState, MapNode, Toast, Modal, Theme, ChallengeStatus } from '@/types/game';
import { UserProfile, GameProgress } from '@shared/schema';
import { gameStorage } from '@/lib/storage';
import { QRGenerator } from '@/lib/qr';

const INITIAL_CHALLENGES: MapNode[] = [
  {
    id: 'networking-forest',
    title: 'Forest',
    emoji: '🌲',
    position: { top: '30%', left: '15%' },
    status: 'available',
    progress: 0,
    total: 5,
  },
  {
    id: 'retro-puzzle',
    title: 'Puzzle',
    emoji: '🧩',
    position: { top: '20%', left: '45%' },
    status: 'locked',
    progress: 0,
    total: 8,
  },
  {
    id: 'debug-dungeon',
    title: 'Debug',
    emoji: '⚔️',
    position: { top: '45%', left: '70%' },
    status: 'locked',
    progress: 0,
    total: 10,
  },
  {
    id: 'social-arena',
    title: 'Arena',
    emoji: '📱',
    position: { top: '65%', left: '40%' },
    status: 'locked',
    progress: 0,
    total: 1,
  },
];

export function useGameStore() {
  const [gameState, setGameState] = useState<GameState>({
    currentUser: {
      userId: '',
      displayName: '',
      avatar: '👨‍💻',
      qrData: null,
    },
    challenges: INITIAL_CHALLENGES,
    currentChallengeId: null,
    theme: 'default',
    gameProgress: {
      completedChallenges: [],
      totalScore: 0,
      gameCompleted: false,
    },
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modals, setModals] = useState<Record<string, Modal>>({});

  // Initialize user from localStorage or URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    
    let profile: UserProfile | null = null;
    
    if (userIdFromUrl) {
      profile = gameStorage.getProfile(userIdFromUrl);
    } else {
      profile = gameStorage.getLastProfile();
    }

    if (profile) {
      setGameState(prev => ({
        ...prev,
        currentUser: {
          userId: profile.userId,
          displayName: profile.displayName,
          avatar: profile.avatar,
          qrData: gameStorage.getQR(profile.userId),
        },
      }));
      
      // Load game progress
      loadGameProgress(profile.userId);
    } else if (userIdFromUrl) {
      // Create new user with ID from URL
      openModal('profile', { userId: userIdFromUrl });
    }
  }, []);

  const loadGameProgress = useCallback((userId: string) => {
    const progress = gameStorage.getProgress(userId);
    if (progress) {
      setGameState(prev => ({
        ...prev,
        gameProgress: {
          completedChallenges: progress.completedChallenges,
          totalScore: progress.totalScore,
          gameCompleted: progress.gameCompleted,
        },
        challenges: prev.challenges.map((challenge, index) => {
          const isCompleted = progress.completedChallenges.includes(challenge.id);
          // Sequential progression: each challenge unlocks only after the previous one is completed
          const isAvailable = index === 0 || progress.completedChallenges.includes(prev.challenges[index - 1]?.id);
          
          return {
            ...challenge,
            status: isCompleted ? 'completed' : isAvailable ? 'available' : 'locked',
          };
        }),
      }));
    }
  }, []);

  const saveProfile = useCallback(async (displayName: string, avatar: string, userId?: string) => {
    const finalUserId = userId || `user_${Date.now()}`;
    const now = new Date().toISOString();
    
    const profile: UserProfile = {
      userId: finalUserId,
      displayName,
      avatar,
      createdAt: now,
      lastUpdated: now,
    };

    gameStorage.saveProfile(profile);

    // Generate QR code
    const qrData = {
      userId: finalUserId,
      displayName,
      avatarUrl: avatar,
      timestamp: now,
    };

    try {
      const qrDataUrl = await QRGenerator.generateQR(qrData);
      gameStorage.saveQR(finalUserId, qrDataUrl);

      setGameState(prev => ({
        ...prev,
        currentUser: {
          userId: finalUserId,
          displayName,
          avatar,
          qrData: qrDataUrl,
        },
      }));

      // Initialize game progress
      const gameProgress: GameProgress = {
        userId: finalUserId,
        currentChallengeIndex: 0,
        completedChallenges: [],
        totalScore: 0,
        startedAt: now,
        lastUpdated: now,
        gameCompleted: false,
      };

      gameStorage.saveProgress(gameProgress);
      loadGameProgress(finalUserId);

      showToast('Profilo creato con successo!', 'success');
    } catch (error) {
      showToast('Errore nella creazione del QR code', 'error');
    }
  }, [loadGameProgress]);

  const updateChallengeProgress = useCallback((challengeId: string, progress: number, completed: boolean = false) => {
    setGameState(prev => {
      const updatedChallenges = prev.challenges.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            progress,
            status: completed ? 'completed' : 'in-progress' as ChallengeStatus,
          };
        }
        return challenge;
      });

      // Update game progress
      if (completed && prev.currentUser.userId) {
        const newCompletedChallenges = [...prev.gameProgress.completedChallenges];
        if (!newCompletedChallenges.includes(challengeId)) {
          newCompletedChallenges.push(challengeId);
        }

        const gameProgress: GameProgress = {
          userId: prev.currentUser.userId,
          currentChallengeIndex: Math.min(newCompletedChallenges.length, prev.challenges.length - 1),
          completedChallenges: newCompletedChallenges,
          totalScore: prev.gameProgress.totalScore + (progress * 10), // Simple scoring
          startedAt: gameStorage.getProgress(prev.currentUser.userId)?.startedAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          gameCompleted: newCompletedChallenges.length === prev.challenges.length,
        };

        gameStorage.saveProgress(gameProgress);

        // Unlock next challenge
        const nextChallengeIndex = prev.challenges.findIndex(c => c.id === challengeId) + 1;
        if (nextChallengeIndex < prev.challenges.length) {
          updatedChallenges[nextChallengeIndex].status = 'available';
        }

        return {
          ...prev,
          challenges: updatedChallenges,
          gameProgress: {
            completedChallenges: newCompletedChallenges,
            totalScore: gameProgress.totalScore,
            gameCompleted: gameProgress.gameCompleted,
          },
        };
      }

      return {
        ...prev,
        challenges: updatedChallenges,
      };
    });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setGameState(prev => ({ ...prev, theme }));
    document.documentElement.className = `ldc-theme--${theme}`;
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const toast: Toast = {
      id: `toast_${Date.now()}`,
      message,
      type,
      duration,
    };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const openModal = useCallback((modalId: string, data?: any) => {
    console.log('openModal called with:', modalId, data);
    setModals(prev => {
      const newModals = {
        ...prev,
        [modalId]: { id: modalId, isOpen: true, data },
      };
      console.log('Setting modals to:', newModals);
      return newModals;
    });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { ...prev[modalId], isOpen: false },
    }));
  }, []);

  const openChallenge = useCallback((challengeId: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    const challengeIndex = gameState.challenges.findIndex(c => c.id === challengeId);
    
    // Enforce sequential progression according to game-story.md
    if (challenge && challenge.status !== 'locked') {
      // Check if previous challenges are completed (sequential requirement)
      const previousChallengesCompleted = gameState.challenges.slice(0, challengeIndex).every(c => 
        gameState.gameProgress.completedChallenges.includes(c.id)
      );
      
      if (challengeIndex === 0 || previousChallengesCompleted) {
        setGameState(prev => ({ ...prev, currentChallengeId: challengeId }));
        openModal('challenge', { challengeId });
      } else {
        const remainingChallenges = challengeIndex - gameState.gameProgress.completedChallenges.length;
        showToast(`Devi completare ${remainingChallenges} sfida/e prima di questa`, 'warning');
      }
    } else {
      showToast('Questa challenge non è ancora disponibile', 'warning');
    }
  }, [gameState.challenges, gameState.gameProgress.completedChallenges, openModal, showToast]);

  return {
    gameState,
    toasts,
    modals,
    saveProfile,
    updateChallengeProgress,
    setTheme,
    showToast,
    removeToast,
    openModal,
    closeModal,
    openChallenge,
  };
}
