import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';

const AVATAR_OPTIONS = [
  '👨‍💻', '👩‍💼', '🧑‍🎨', '👨‍🔬', 
  '👩‍🚀', '🧑‍🏫', '👨‍🎓', '👩‍💻'
];

const ProfileModal: React.FC = () => {
  const { modals, closeModal, saveProfile, gameState } = useGameStore();
  const isOpen = modals.profile?.isOpen;
  const modalData = modals.profile?.data;

  const [displayName, setDisplayName] = useState(gameState.currentUser.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(gameState.currentUser.avatar || '👨‍💻');

  useEffect(() => {
    if (isOpen) {
      setDisplayName(gameState.currentUser.displayName || '');
      setSelectedAvatar(gameState.currentUser.avatar || '👨‍💻');
    }
  }, [isOpen, gameState.currentUser]);

  const handleSave = async () => {
    if (displayName.trim()) {
      await saveProfile(displayName.trim(), selectedAvatar, modalData?.userId);
      closeModal('profile');
    }
  };

  const handleCancel = () => {
    closeModal('profile');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid="modal-profile">
      <div className="modal-content nes-container with-title bg-card max-w-md w-full">
        <p className="title bg-card">Il tuo profilo</p>
        
        <div className="p-4">
          {/* Avatar selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Scegli il tuo avatar</label>
            <div className="grid grid-cols-4 gap-2" data-testid="avatar-picker">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  className={`w-12 h-12 border-2 border-black flex items-center justify-center text-xl transition-colors ${
                    selectedAvatar === avatar 
                      ? 'bg-primary text-white' 
                      : 'bg-muted hover:bg-primary hover:text-white'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                  data-testid={`avatar-${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-6">
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              Il tuo nome
            </label>
            <input 
              type="text" 
              id="displayName" 
              className="nes-input w-full" 
              placeholder="Es. Marco Dev" 
              maxLength={30}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid="input-display-name"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end flex-wrap">
            <button 
              className="nes-btn is-normal" 
              onClick={handleCancel}
              data-testid="button-cancel-profile"
            >
              Annulla
            </button>
            <button 
              className="nes-btn is-primary" 
              onClick={handleSave}
              disabled={!displayName.trim()}
              data-testid="button-save-profile"
            >
              Salva profilo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
