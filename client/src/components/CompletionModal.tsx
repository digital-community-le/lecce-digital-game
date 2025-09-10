import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import gameData from '@/assets/game-data.json';

// Import gem images using Vite's asset imports
import gemOfWisdom from '@assets/images/gem-of-wisdom.png';
import gemOfMemory from '@assets/images/gem-of-memory.png';
import gemOfCommunity from '@assets/images/gem-of-community.png';
import gemOfAlliance from '@assets/images/gem-of-alliance.png';

// Map challenge IDs to their corresponding gem images
const GEM_IMAGES = {
  'debug-dungeon': gemOfWisdom,
  'retro-puzzle': gemOfMemory,
  'guild-builder': gemOfAlliance,
  'social-arena': gemOfCommunity,
} as const;

const CompletionModal: React.FC = () => {
  const { modals, closeModal, openModal, gameState, startAvatarAnimation } =
    useGameStore();
  const [, setLocation] = useLocation();
  const isOpen = modals.completion?.isOpen;
  const completionData = modals.completion?.data;

  const handleClose = useCallback(() => {
    closeModal('completion');

    // Only trigger animation if this challenge was just completed (not previously completed)
    if (completionData?.challengeId) {
      const currentIndex = gameState.challenges.findIndex(
        (c) => c.id === completionData.challengeId
      );
      const nextChallenge = gameState.challenges[currentIndex + 1];

      // Check if this challenge was just completed by verifying it's the last one in completed array
      const lastCompletedChallengeId =
        gameState.gameProgress.completedChallenges[
          gameState.gameProgress.completedChallenges.length - 1
        ];
      const isJustCompleted =
        lastCompletedChallengeId === completionData.challengeId;

      // Only animate if:
      // 1. This challenge was just completed (is the most recent completion)
      // 2. There's a next challenge available
      if (
        isJustCompleted &&
        nextChallenge &&
        nextChallenge.status === 'available'
      ) {
        // Store animation data with timestamp for delayed execution
        const animationData = {
          fromChallengeId: completionData.challengeId,
          toChallengeId: nextChallenge.id,
          shouldAnimate: true,
          delayMs: 1000, // Start animation 1 second after modal closes
          closedAt: Date.now(), // Timestamp when modal was closed
        };

        // Store in sessionStorage so it survives the navigation
        sessionStorage.setItem(
          'pendingAvatarAnimation',
          JSON.stringify(animationData)
        );
      }
      // If this was a previously completed challenge, no animation is triggered
      // The avatar will remain on the last completed challenge as per the new positioning logic
    }

    // Navigate back to map to continue the adventure
    setLocation('/game/map');
  }, [closeModal, completionData, gameState, openModal, setLocation]);

  const getChallengeData = async (challengeId: string) => {
    // Trova i dati della challenge dal game-data.json
    const challenge = gameData.challenges.find((c) => c.id === challengeId);

    // If challenge or required metadata is missing, log and close modal as requested
    if (!challenge) {
      console.error(
        `CompletionModal: missing challenge data for id=${challengeId} in game-data.json`
      );
      closeModal('completion');
      throw new Error('MISSING_GAME_DATA');
    }

    if (!challenge.completion) {
      console.error(
        `CompletionModal: incomplete challenge entry for id=${challengeId} (missing completion) in game-data.json`
      );
      closeModal('completion');
      throw new Error('MISSING_GAME_DATA');
    }

    const completionTitle =
      challenge.completion.title || 'Challenge Completata';
    const completionMessage =
      challenge.completion.message || 'Hai completato la challenge!';

    // Get gem image from static imports based on challenge ID
    const gemImage =
      GEM_IMAGES[challengeId as keyof typeof GEM_IMAGES] || gemOfAlliance;

    return { gemImage, completionTitle, completionMessage };
  };

  const [challengeData, setChallengeData] = useState<{
    gemImage: string;
    completionTitle: string;
    completionMessage: string;
  } | null>(null);
  const [loadingGem, setLoadingGem] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (isOpen && completionData) {
      setLoadingGem(true);
      getChallengeData(completionData.challengeId)
        .then((d) => {
          if (mounted) setChallengeData(d);
        })
        .catch(() => {
          if (mounted)
            setChallengeData({
              gemImage: gemOfAlliance,
              completionTitle: 'Challenge Completata',
              completionMessage: 'Hai completato la challenge!',
            });
        })
        .finally(() => {
          if (mounted) setLoadingGem(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [isOpen, completionData]);

  // Handle ESC key to close modal and redirect
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      // Handle Enter key when CTA button is focused
      if (
        e.key === 'Enter' &&
        document.activeElement?.getAttribute('data-testid') ===
          'button-continue-adventure'
      ) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !completionData) return null;
  if (loadingGem || !challengeData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'var(--ldc-surface)' }}
      data-testid="modal-completion"
      role="dialog"
      aria-modal="true"
      aria-label={challengeData?.completionTitle || 'Challenge Completata'}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl text-center my-8 max-h-full overflow-y-visible"
        style={{ color: 'var(--ldc-on-surface)' }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Gem Image */}
        <div className="my-12">
          <div className="w-48 h-48 mx-auto">
            <img
              src={challengeData.gemImage}
              alt="Gemma conquistata"
              className="w-full h-full object-contain pixelated"
              data-testid="completion-gem-image"
              style={{
                imageRendering: 'pixelated',
                filter:
                  'drop-shadow(0 0 30px var(--ldc-contrast-yellow)) drop-shadow(0 0 60px var(--ldc-background))',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1
            className="font-retro text-3xl md:text-4xl text-yellow-300 mb-4"
            data-testid="completion-title"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
            }}
          >
            {challengeData.completionTitle}
          </h1>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p
            className="text-base leading-relaxed text-white mx-4 md:mx-8"
            data-testid="completion-description"
          >
            {challengeData.completionMessage}
          </p>
        </div>

        {/* Button */}
        <div>
          <button
            className="nes-btn is-success font-retro"
            onClick={handleClose}
            data-testid="button-continue-adventure"
          >
            Continua l'avventura
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
