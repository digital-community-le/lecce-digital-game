import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import NetworkingForest from './NetworkingForest';
import RetroPuzzle from './RetroPuzzle';
import DebugDungeon from './DebugDungeon';
import SocialArena from './SocialArena';

const ChallengeModal: React.FC = () => {
  const { modals, closeModal } = useGameStore();
  const isOpen = modals.challenge?.isOpen;
  const challengeId = modals.challenge?.data?.challengeId;

  const handleClose = () => {
    closeModal('challenge');
  };

  const renderChallengeContent = () => {
    switch (challengeId) {
      case 'networking-forest':
        return <NetworkingForest />;
      case 'retro-puzzle':
        return <RetroPuzzle />;
      case 'debug-dungeon':
        return <DebugDungeon />;
      case 'social-arena':
        return <SocialArena />;
      default:
        return <div>Challenge non trovata</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid={`modal-challenge-${challengeId}`}>
      <div className="modal-content nes-container with-title bg-card max-w-2xl w-full">
        {renderChallengeContent()}
        
        {/* Close button - always present */}
        <div className="flex gap-2 justify-end mt-6 p-4 border-t">
          <button 
            className="nes-btn is-normal" 
            onClick={handleClose}
            data-testid="button-close-challenge"
          >
            Torna alla mappa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
