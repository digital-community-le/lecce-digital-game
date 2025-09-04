import React, { useState, useEffect } from 'react';
import { GuildCompanion } from '@shared/schema';

interface CompanionSlotProps {
  slotIndex: number;
  availableCompanions: GuildCompanion[];
  currentCompanion: GuildCompanion | null;
  onCompanionChange: (companion: GuildCompanion | null) => void;
  disabled?: boolean;
}

const CompanionSlot: React.FC<CompanionSlotProps> = ({
  slotIndex,
  availableCompanions,
  currentCompanion,
  onCompanionChange,
  disabled = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update current index when current companion changes from parent
  useEffect(() => {
    if (currentCompanion && availableCompanions.length > 0) {
      const index = availableCompanions.findIndex(comp => comp.id === currentCompanion.id);
      if (index >= 0) {
        setCurrentIndex(index);
      } else {
        // Current companion is no longer available, reset to first
        setCurrentIndex(0);
        onCompanionChange(availableCompanions[0] || null);
      }
    } else if (availableCompanions.length > 0) {
      // No current companion but have available ones, select first
      setCurrentIndex(0);
      onCompanionChange(availableCompanions[0]);
    } else {
      // No available companions
      onCompanionChange(null);
    }
  }, [availableCompanions, currentCompanion?.id]);

  const handlePrevious = () => {
    if (availableCompanions.length === 0 || disabled) return;
    const newIndex = currentIndex === 0 ? availableCompanions.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onCompanionChange(availableCompanions[newIndex]);
  };

  const handleNext = () => {
    if (availableCompanions.length === 0 || disabled) return;
    const newIndex = currentIndex === availableCompanions.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onCompanionChange(availableCompanions[newIndex]);
  };

  const displayCompanion = currentCompanion || availableCompanions[currentIndex];

  return (
    <div 
      className="nes-container is-rounded p-4"
      style={{ 
        minHeight: '220px',
        backgroundColor: 'var(--ldc-surface)',
        border: '3px solid var(--ldc-border)',
      }}
    >
      <div className="text-center mb-3">
        <h5 className="font-retro text-sm text-gray-600">
          Slot {slotIndex + 1}
        </h5>
      </div>

      {displayCompanion ? (
        <>
          {/* Avatar with navigation arrows */}
          <div className="flex items-center justify-center mb-4 relative">
            {availableCompanions.length > 1 && (
              <button
                onClick={handlePrevious}
                className="nes-btn is-normal absolute left-0 z-10"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  fontSize: '16px',
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
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {availableCompanions.length > 1 && (
              <button
                onClick={handleNext}
                className="nes-btn is-normal absolute right-0 z-10"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  fontSize: '16px',
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
            <div className="font-retro text-base font-bold text-gray-800">
              {displayCompanion.name}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {displayCompanion.role}
            </div>
            <div className="text-xs leading-relaxed px-2 text-gray-500">
              {displayCompanion.description}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👤</div>
          <div className="text-sm text-gray-400 font-retro">
            Nessun compagno disponibile
          </div>
        </div>
      )}

      {availableCompanions.length > 1 && (
        <div className="text-center mt-3">
          <div className="text-xs text-gray-400">
            {currentIndex + 1} di {availableCompanions.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanionSlot;
