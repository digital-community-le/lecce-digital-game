import React, { useState } from 'react';
import { GuildCompanion } from '@shared/schema';

interface CompanionSlotProps {
  slotIndex: number;
  availableCompanions: GuildCompanion[];
  selectedCompanion: GuildCompanion | null;
  onCompanionSelect: (companion: GuildCompanion | null) => void;
  disabled?: boolean;
}

const CompanionSlot: React.FC<CompanionSlotProps> = ({
  slotIndex,
  availableCompanions,
  selectedCompanion,
  onCompanionSelect,
  disabled = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    if (availableCompanions.length === 0) return;
    setCurrentIndex((prev) => 
      prev === 0 ? availableCompanions.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (availableCompanions.length === 0) return;
    setCurrentIndex((prev) => 
      prev === availableCompanions.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelect = () => {
    if (disabled || availableCompanions.length === 0) return;
    
    const currentCompanion = availableCompanions[currentIndex];
    if (selectedCompanion?.id === currentCompanion.id) {
      // Deselect if already selected
      onCompanionSelect(null);
    } else {
      // Select new companion
      onCompanionSelect(currentCompanion);
    }
  };

  const currentCompanion = availableCompanions[currentIndex];
  const isSelected = selectedCompanion !== null;
  const displayCompanion = isSelected ? selectedCompanion : currentCompanion;

  return (
    <div 
      className={`nes-container is-rounded p-4 ${
        isSelected ? 'is-success' : 'is-light'
      }`}
      style={{ 
        minHeight: '220px',
        backgroundColor: isSelected 
          ? 'rgba(47, 140, 47, 0.1)' 
          : 'var(--ldc-surface)',
        border: isSelected 
          ? '4px solid var(--ldc-rpg-green)' 
          : '4px solid var(--ldc-surface)',
        boxShadow: isSelected 
          ? '0 0 15px rgba(47, 140, 47, 0.5), inset 0 0 10px rgba(47, 140, 47, 0.2)' 
          : 'none'
      }}
    >
      <div className="text-center mb-3">
        <h5 className="font-retro text-sm" style={{ color: 'var(--ldc-contrast-yellow)' }}>
          Slot {slotIndex + 1}
        </h5>
      </div>

      {displayCompanion ? (
        <>
          {/* Avatar with navigation arrows */}
          <div className="flex items-center justify-center mb-4 relative">
            {!isSelected && availableCompanions.length > 1 && (
              <button
                onClick={handlePrevious}
                className="nes-btn is-small absolute left-0 z-10"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  fontSize: '12px',
                  lineHeight: '1'
                }}
                disabled={disabled}
                aria-label="Compagno precedente"
              >
                ‹
              </button>
            )}
            
            <div className="w-20 h-20 mx-8">
              <img 
                src={displayCompanion.avatar} 
                alt={displayCompanion.name} 
                className="w-full h-full object-contain"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: isSelected ? 'brightness(1.1) contrast(1.1)' : 'none'
                }}
              />
            </div>

            {!isSelected && availableCompanions.length > 1 && (
              <button
                onClick={handleNext}
                className="nes-btn is-small absolute right-0 z-10"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  fontSize: '12px',
                  lineHeight: '1'
                }}
                disabled={disabled}
                aria-label="Compagno successivo"
              >
                ›
              </button>
            )}
          </div>

          {/* Companion info */}
          <div className="text-center space-y-2">
            <div 
              className="font-retro text-base font-bold"
              style={{ color: isSelected ? 'var(--ldc-rpg-green)' : 'var(--ldc-on-surface)' }}
            >
              {displayCompanion.name}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: isSelected ? 'var(--ldc-rpg-green)' : 'var(--ldc-on-surface)' }}
            >
              {displayCompanion.role}
            </div>
            <div 
              className="text-xs leading-relaxed px-2"
              style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--ldc-on-surface-variant)' }}
            >
              {displayCompanion.description}
            </div>
          </div>

          {/* Selection button */}
          <div className="text-center mt-4">
            {isSelected ? (
              <button
                onClick={handleSelect}
                className="nes-btn is-warning is-small"
                disabled={disabled}
              >
                Rimuovi
              </button>
            ) : (
              <button
                onClick={handleSelect}
                className="nes-btn is-primary is-small"
                disabled={disabled || !currentCompanion}
              >
                Seleziona
              </button>
            )}
          </div>

          {isSelected && (
            <div className="text-center mt-2">
              <span className="text-lg">✓</span>
              <span 
                className="font-retro text-xs ml-1" 
                style={{ color: 'var(--ldc-rpg-green)' }}
              >
                SELEZIONATO
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👤</div>
          <div className="text-sm text-muted-foreground font-retro">
            Nessun compagno disponibile
          </div>
        </div>
      )}

      {!isSelected && availableCompanions.length > 1 && (
        <div className="text-center mt-3">
          <div className="text-xs text-muted-foreground">
            {currentIndex + 1} di {availableCompanions.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanionSlot;
