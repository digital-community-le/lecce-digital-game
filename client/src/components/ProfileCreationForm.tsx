import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { AVATAR_PRESETS } from '@/lib/avatars';

interface ProfileCreationFormProps {
  onComplete: () => void;
}

const ProfileCreationForm: React.FC<ProfileCreationFormProps> = ({ onComplete }) => {
  const { saveProfile, showToast } = useGameStore();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first avatar on mount
  useEffect(() => {
    setSelectedAvatar(AVATAR_PRESETS[0].url);
  }, []);

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Il nome è obbligatorio';
    if (name.trim().length < 2) return 'Il nome deve essere almeno 2 caratteri';
    if (name.trim().length > 30) return 'Il nome non può superare 30 caratteri';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'Il nome può contenere solo lettere e spazi';
    return '';
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    const error = validateName(value);
    setNameError(error);
  };

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    const error = validateName(trimmedName);
    
    if (error) {
      setNameError(error);
      showToast(error, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await saveProfile(trimmedName, selectedAvatar);
      showToast('Profilo creato con successo!', 'success');
      onComplete();
    } catch (error) {
      showToast('Errore nella creazione del profilo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !nameError && displayName.trim()) {
      handleSave();
    }
  };

  return (
    <div className="p-6">
      {/* Welcome message */}
      <div className="text-center mb-6">
        <div className="text-2xl mb-2">🏰</div>
        <p className="font-retro text-xs text-muted-foreground">
          Benvenuto, guerriero! Crea il tuo profilo per iniziare l'avventura.
        </p>
      </div>

      {/* Avatar selection */}
      <div className="mb-6">
        <label className="block font-retro text-sm font-medium mb-3">Scegli il tuo avatar</label>
        <div className="grid grid-cols-4 gap-3" data-testid="avatar-picker">
          {AVATAR_PRESETS.map((avatar) => (
            <button
              key={avatar.id}
              className={`w-16 h-16 border-2 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                selectedAvatar === avatar.url 
                  ? 'border-yellow-400 bg-yellow-100 shadow-lg transform scale-105' 
                  : 'border-gray-400 bg-white hover:border-yellow-300 hover:bg-yellow-50 hover:scale-102'
              }`}
              onClick={() => setSelectedAvatar(avatar.url)}
              data-testid={`avatar-${avatar.id}`}
              title={avatar.name}
              disabled={isLoading}
            >
              <img 
                src={avatar.url} 
                alt={avatar.name}
                className="w-full h-full object-cover pixelated"
              />
            </button>
          ))}
        </div>
        {selectedAvatar && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            {AVATAR_PRESETS.find(a => a.url === selectedAvatar)?.name}
          </p>
        )}
      </div>

      {/* Name input */}
      <div className="mb-6">
        <label htmlFor="displayName" className="block font-retro text-sm font-medium mb-2">
          Il tuo nome da guerriero
        </label>
        <input 
          type="text" 
          id="displayName" 
          className={`nes-input w-full ${nameError ? 'is-error' : ''}`}
          placeholder="Es. Marco il Valoroso" 
          maxLength={30}
          value={displayName}
          onChange={handleNameChange}
          onKeyPress={handleKeyPress}
          data-testid="input-display-name"
          autoFocus
          disabled={isLoading}
        />
        {nameError && (
          <p className="text-red-500 text-xs mt-1 font-retro" data-testid="error-name">
            {nameError}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {displayName.length}/30 caratteri
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <button 
          className={`nes-btn font-retro px-6 py-2 ${
            !displayName.trim() || nameError || isLoading 
              ? 'is-disabled' 
              : 'is-primary'
          }`}
          onClick={handleSave}
          disabled={!displayName.trim() || !!nameError || isLoading}
          data-testid="button-save-profile"
        >
          {isLoading ? 'Creazione...' : '⚔️ Inizia l\'avventura'}
        </button>
      </div>
    </div>
  );
};

export default ProfileCreationForm;