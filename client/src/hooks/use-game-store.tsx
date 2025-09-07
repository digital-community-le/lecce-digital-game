import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  GameState,
  MapNode,
  Toast,
  Modal,
  Theme,
  ChallengeStatus,
} from "@/types/game";
import { UserProfile, GameProgress } from "@shared/schema";
import { gameStorage } from "@/lib/storage";
import { initAuthFromUrl } from '@/services/authService';
import gameData from "@/assets/game-data.json";

// Fallback challenges (keeps previous defaults if JSON missing entries)
const FALLBACK_CHALLENGES: MapNode[] = [
  { id: "guild-builder", title: "Guild Builder", emoji: "🛡️", position: { top: "30%", left: "15%" }, status: "available", progress: 0, total: 1 },
  { id: "retro-puzzle", title: "Puzzle", emoji: "🧩", position: { top: "20%", left: "45%" }, status: "locked", progress: 0, total: 8 },
  { id: "debug-dungeon", title: "Debug", emoji: "⚔️", position: { top: "45%", left: "70%" }, status: "locked", progress: 0, total: 10 },
  { id: "social-arena", title: "Arena", emoji: "📱", position: { top: "65%", left: "40%" }, status: "locked", progress: 0, total: 1 },
];

/**
 * Build MapNode[] from the game-data.json structure, filling missing fields with sensible defaults.
 */
function buildInitialChallenges(data: any): MapNode[] {
  const src: any[] = data?.challenges || [];
  if (!src || src.length === 0) return FALLBACK_CHALLENGES;

  const nodesById: Record<string, any> = {};
  // If `nodes` section exists it may contain positions; index it for position lookup
  (data?.nodes || []).forEach((n: any) => { if (n?.id) nodesById[n.id] = n; });

  return src.map((c: any, idx: number) => {
    const node = nodesById[c.id] || {};
    const position = c.position || (node.x && node.y ? { top: `${(node.y || 1) * 10}%`, left: `${(node.x || 1) * 10}%` } : { top: `${30 + idx * 10}%`, left: `${15 + idx * 20}%` });

    // derive a sensible total value from settings/requirements/rewards when possible
    const total = c.total || c.settings?.pairsCount || c.settings?.questionsPerRun || c.requirements?.minDistinctScans || (c.rewards?.points ? Math.max(1, Math.floor(c.rewards.points / 50)) : 1);

    return {
      id: c.id,
      title: c.title || (c.id ? c.id.replace(/[-_]/g, " ").replace(/\b\w/g, (s: string) => s.toUpperCase()) : "Unknown"),
      emoji: c.emoji || "❓",
      nodeIcon: c.nodeIcon, // Add nodeIcon property from game-data.json
      position,
      status: idx === 0 ? "available" : "locked",
      progress: 0,
      total,
    } as MapNode;
  });
}
// Small service interfaces so we can inject dependencies (DIP)
type StorageService = typeof gameStorage;

/**
 * Single place for the initial state so it's easy to reason about.
 */
const getInitialState = (): GameState => ({
  currentUser: {
    userId: "",
    displayName: "",
    avatar: "👨‍💻",
    title: undefined,
  },
  challenges: buildInitialChallenges(gameData),
  currentChallengeId: null,
  theme: "default",
  gameProgress: {
    completedChallenges: [],
    totalScore: 0,
    gameCompleted: false,
  },
  test: false,
  auth: {
    isAuthenticated: false,
    token: null,
    error: null,
  },
  avatarAnimation: {
    isAnimating: false,
    fromChallengeId: null,
    toChallengeId: null,
    progress: 0,
    duration: 3000, // 3 seconds default
  },
});

/**
 * Hook to manage toasts. Single responsibility for toast lifecycle.
 */
function useToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info", duration = 3000) => {
      const toast: Toast = { id: `toast_${Date.now()}`, message, type, duration };
      setToasts((s) => [...s, toast]);

      if (duration > 0) {
        setTimeout(() => setToasts((s) => s.filter((t) => t.id !== toast.id)), duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

/**
 * Hook to manage modals with a small API.
 */
function useModalManager() {
  const [modals, setModals] = useState<Record<string, Modal>>({});

  const openModal = useCallback((id: string, data?: any) => {
    setModals((m) => ({ ...m, [id]: { id, isOpen: true, data } }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((m) => ({ ...m, [id]: { ...m[id], isOpen: false } }));
  }, []);

  const acknowledgeCompletion = useCallback(() => {
    setModals((prev) => {
      const pending = prev["pendingCompletion"];
      if (pending && pending.data) {
        const next = { ...prev } as Record<string, Modal>;
        delete next["pendingCompletion"];
        next["completion"] = { id: "completion", isOpen: true, data: pending.data };
        return next;
      }
      return prev;
    });
  }, []);

  return { modals, openModal, closeModal, acknowledgeCompletion, setModals };
}

/**
 * Main factory for the game store. Accepts optional dependencies for easier testing and SRP.
 */
function createGameStore(deps?: { storage?: StorageService }) {
  const storage = deps?.storage ?? gameStorage;

  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const [withRouteTransition, setWithRouteTransition] = useState(false);

  // managers
  const { toasts, showToast, removeToast } = useToastManager();
  const { modals, openModal, closeModal, acknowledgeCompletion, setModals } = useModalManager();

  // --- Persistence / load logic ---
  const loadGameProgress = useCallback(
    (userId: string) => {
      const progress = storage.getProgress(userId);
      if (!progress) return;

      setGameState((prev) => ({
        ...prev,
        gameProgress: {
          completedChallenges: progress.completedChallenges,
          totalScore: progress.totalScore,
          gameCompleted: progress.gameCompleted,
        },
        challenges: prev.challenges.map((challenge, index) => {
          const isCompleted = progress.completedChallenges.includes(challenge.id);
          const isAvailable = index === 0 || progress.completedChallenges.includes(prev.challenges[index - 1]?.id);
          return { ...challenge, status: isCompleted ? "completed" : isAvailable ? "available" : "locked" };
        }),
      }));
    },
    [storage]
  );

  // init: try to read profile from URL or last profile
  useEffect(() => {
    // Delegate URL auth parsing/persistence to authService to keep this hook focused on state.
    const authResult = initAuthFromUrl();

    // Set auth state
    setGameState((prev) => ({
      ...prev,
      test: !!authResult.test,
      auth: {
        isAuthenticated: authResult.success,
        token: authResult.token,
        error: authResult.error,
      },
    }));

    // Only proceed with profile loading if authentication succeeded
    if (authResult.success) {
      let profile: UserProfile | null = null;
      profile = storage.getLastProfile();

      if (profile) {
        setGameState((prev) => ({ 
          ...prev, 
          currentUser: { 
            userId: profile.userId, 
            displayName: profile.displayName, 
            avatar: profile.avatar
          }
        }));
        loadGameProgress(profile.userId);
      }
    }
  }, [storage, loadGameProgress]);

  // --- Profile creation ---
  const saveProfile = useCallback(
    async (displayName: string, avatar: string, userId?: string) => {
      const finalUserId = userId || `user_${Date.now()}`;
      const now = new Date().toISOString();

      const profile: UserProfile = { userId: finalUserId, displayName, avatar, createdAt: now, lastUpdated: now };
      storage.saveProfile(profile);

      setGameState((prev) => ({ ...prev, currentUser: { userId: finalUserId, displayName, avatar } }));

      const gameProgress: GameProgress = { userId: finalUserId, currentChallengeIndex: 0, completedChallenges: [], totalScore: 0, startedAt: now, lastUpdated: now, gameCompleted: false };
      storage.saveProgress(gameProgress);
      loadGameProgress(finalUserId);
    },
    [storage, loadGameProgress, showToast]
  );

  // --- Challenge progress ---
  const updateChallengeProgress = useCallback(
    (challengeId: string, progressValue: number, completed = false) => {
      setGameState((prev) => {
        const updatedChallenges = prev.challenges.map((c) =>
          c.id === challengeId ? { ...c, progress: progressValue, status: completed ? "completed" : ("in-progress" as ChallengeStatus) } : c
        );

        if (completed && prev.currentUser.userId) {
          const already = prev.gameProgress.completedChallenges.includes(challengeId);
          if (already) return { ...prev, challenges: updatedChallenges };

          const newCompleted = [...prev.gameProgress.completedChallenges, challengeId];
          const totalScore = prev.gameProgress.totalScore + progressValue * 10;
          const gameProgress: GameProgress = {
            userId: prev.currentUser.userId,
            currentChallengeIndex: Math.min(newCompleted.length, prev.challenges.length - 1),
            completedChallenges: newCompleted,
            totalScore,
            startedAt: storage.getProgress(prev.currentUser.userId)?.startedAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            gameCompleted: newCompleted.length === prev.challenges.length,
          };

          storage.saveProgress(gameProgress);

          // unlock next
          const nextIndex = prev.challenges.findIndex((c) => c.id === challengeId) + 1;
          if (nextIndex < prev.challenges.length) updatedChallenges[nextIndex].status = "available";

          // map challenge to title
          const titleForChallenge = (() => {
            switch (challengeId) {
              case "guild-builder":
                return "Guild Master";
              case "retro-puzzle":
                return "Puzzle Master";
              case "debug-dungeon":
                return "Dungeon Delver";
              case "social-arena":
                return "Social Champion";
              default:
                return undefined;
            }
          })();

          if (titleForChallenge) {
            const existing = storage.getProfile(prev.currentUser.userId);
            if (existing) storage.saveProfile({ ...existing, title: titleForChallenge } as any);
          }

          const completionData = {
            challengeId,
            title: titleForChallenge || "Gemma",
            description: `Hai ottenuto la gemma per ${challengeId}`,
            score: gameProgress.totalScore,
            time: new Date().toLocaleTimeString(),
          };

          setModals((prevModals) => ({ ...prevModals, pendingCompletion: { id: "pendingCompletion", isOpen: true, data: completionData } }));

          return { ...prev, challenges: updatedChallenges, gameProgress: { completedChallenges: newCompleted, totalScore: gameProgress.totalScore, gameCompleted: gameProgress.gameCompleted } };
        }

        return { ...prev, challenges: updatedChallenges };
      });
    },
    [storage, setModals]
  );

  // --- Theme ---
  const setTheme = useCallback((theme: Theme) => {
    setGameState((prev) => ({ ...prev, theme }));
    document.documentElement.className = `ldc-theme--${theme}`;
  }, []);

  // --- Open challenge with sequential guard ---
  const openChallenge = useCallback(
    (challengeId: string) => {
      const challengeIndex = gameState.challenges.findIndex((c) => c.id === challengeId);
      const challenge = gameState.challenges[challengeIndex];
      if (!challenge || challenge.status === "locked") {
        showToast("Questa challenge non è ancora disponibile", "warning");
        return;
      }

      const prevCompleted = gameState.challenges.slice(0, challengeIndex).every((c) => gameState.gameProgress.completedChallenges.includes(c.id));
      if (challengeIndex === 0 || prevCompleted) {
        setGameState((prev) => ({ ...prev, currentChallengeId: challengeId }));
        openModal("challenge", { challengeId });
      } else {
        const remaining = challengeIndex - gameState.gameProgress.completedChallenges.length;
        showToast(`Devi completare ${remaining} sfida/e prima di questa`, "warning");
      }
    },
    [gameState.challenges, gameState.gameProgress.completedChallenges, openModal, showToast]
  );

  // --- Avatar Animation Management ---
  const startAvatarAnimation = useCallback(
    (fromChallengeId: string, toChallengeId: string, duration = 3000) => {
      setGameState((prev) => ({
        ...prev,
        avatarAnimation: {
          isAnimating: true,
          fromChallengeId,
          toChallengeId,
          progress: 0,
          duration,
        },
      }));

      // Start the animation loop
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setGameState((prev) => ({
          ...prev,
          avatarAnimation: {
            ...prev.avatarAnimation,
            progress,
          },
        }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - reset animation state
          setGameState((prev) => ({
            ...prev,
            avatarAnimation: {
              isAnimating: false,
              fromChallengeId: null,
              toChallengeId: null,
              progress: 0,
              duration: 3000,
            },
          }));
          
          // Auto-open next challenge after animation with a delay
          setTimeout(() => {
            const targetChallenge = gameState.challenges.find(c => c.id === toChallengeId);
            if (targetChallenge && targetChallenge.status === "available") {
              openChallenge(toChallengeId);
            }
          }, 800); // Slightly longer delay for better UX
        }
      };

      requestAnimationFrame(animate);
    },
    [gameState.challenges, openChallenge]
  );

  const stopAvatarAnimation = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      avatarAnimation: {
        isAnimating: false,
        fromChallengeId: null,
        toChallengeId: null,
        progress: 0,
        duration: 3000,
      },
    }));
  }, []);

  return {
    gameState,
    toasts,
    modals,
    saveProfile,
    updateChallengeProgress,
    acknowledgeCompletion,
    setTheme,
    showToast,
    removeToast,
    openModal,
    closeModal,
    openChallenge,
    withRouteTransition,
    setWithRouteTransition,
    startAvatarAnimation,
    stopAvatarAnimation,
  };
}

type GameStoreContextValue = ReturnType<typeof createGameStore>;

const GameStoreContext = createContext<GameStoreContextValue | null>(null);

export const GameStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const store = createGameStore();
  return (
    <GameStoreContext.Provider value={store}>
      {children}
    </GameStoreContext.Provider>
  );
};

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx)
    throw new Error("useGameStore must be used within a GameStoreProvider");
  return ctx;
}

// safe version: returns null instead of throwing, useful for hooks used outside provider
export function useGameStoreSafe() {
  try {
    return useContext(GameStoreContext);
  } catch (e) {
    return null;
  }
}
