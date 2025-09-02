import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from '@/components/UiDialog';
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
    <UiDialog open={isOpen} onClose={() => closeModal('challenge')} title={challengeId || 'Challenge'} className="max-w-2xl">
      <div className="w-full" data-testid={`modal-challenge-${challengeId}`}>
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
    </UiDialog>
  );
};

export default ChallengeModal;
