import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizzato per gestire l'animazione di blink
 * 
 * @param duration - Durata in millisecondi per ogni cambio di stato (default: 200ms)
 * @param onComplete - Callback chiamata quando l'animazione termina
 * @returns Oggetto con lo stato dell'animazione e funzione per avviarla
 */
export const useBlinkAnimation = (duration: number = 200, onComplete?: () => void) => {
  const [flashing, setFlashing] = useState(false);
  const [flashCount, setFlashCount] = useState(0);

  const startBlink = useCallback(() => {
    setFlashing(true);
    setFlashCount(0);
  }, []);

  useEffect(() => {
    if (flashing) {
      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        blinkCount++;
        setFlashCount(blinkCount);

        if (blinkCount >= 6) {
          // 3 blinks complete (on-off-on-off-on-off)
          clearInterval(blinkInterval);
          setFlashing(false);
          setFlashCount(0);

          // Chiama il callback di completamento se fornito
          if (onComplete) {
            onComplete();
          }
        }
      }, duration);

      return () => clearInterval(blinkInterval);
    }
  }, [flashing, duration, onComplete]);

  return {
    flashing,
    flashCount,
    startBlink,
    isVisible: flashCount % 2 === 0, // Elemento visibile quando flashCount è pari
  };
};
