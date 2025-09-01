import React, { useState } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { AVATAR_PRESETS } from '@/lib/avatars';

interface ProfileCreationFormProps {
  onComplete: () => void;
}

const ProfileCreationForm: React.FC<ProfileCreationFormProps> = ({ onComplete }) => {
  const { saveProfile } = useGameStore();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);

  const handleSave = async () => {
    if (displayName.trim()) {
      await saveProfile(displayName.trim(), selectedAvatar);
      onComplete();
    }
  };

  return (
    <div className="p-4">
      {/* Avatar selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Scegli il tuo avatar</label>
        <div className="grid grid-cols-4 gap-2" data-testid="avatar-picker">
          {AVATAR_PRESETS.map((avatar) => (
            <button
              key={avatar.id}
              className={`w-12 h-12 border-2 border-black flex items-center justify-center overflow-hidden transition-colors ${
                selectedAvatar === avatar.url 
                  ? 'border-primary bg-primary/20' 
                  : 'bg-muted hover:bg-primary/10 hover:border-primary'
              }`}
              onClick={() => setSelectedAvatar(avatar.url)}
              data-testid={`avatar-${avatar.id}`}
              title={avatar.name}
            >
              <img 
                src={avatar.url} 
                alt={avatar.name}
                className="w-full h-full object-cover pixelated"
              />
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
      <div className="flex gap-2 justify-end">
        <button 
          className="nes-btn is-primary"
          onClick={handleSave}
          disabled={!displayName.trim()}
          data-testid="button-save-profile"
        >
          Inizia l'avventura
        </button>
      </div>
    </div>
  );
};

export default ProfileCreationForm;