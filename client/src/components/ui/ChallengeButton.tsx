import React, { forwardRef, useEffect } from 'react';
import { useBlinkAnimation } from '@/hooks/use-blink-animation';
import { cn } from '@/lib/utils';

/**
 * Tipi di varianti per il ChallengeButton
 */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'error'
  | 'disabled'
  | 'warning';

/**
 * Dimensioni disponibili per il pulsante
 */
export type ButtonSize = 'small' | 'normal';

/**
 * Props per il componente ChallengeButton
 */
export interface ChallengeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante del pulsante che determina lo stile */
  variant?: ButtonVariant;
  /** Dimensione del pulsante */
  size?: ButtonSize;
  /** Se il pulsante deve mostrare l'animazione di blink */
  shouldBlink?: boolean;
  /** Durata dell'animazione di blink in millisecondi */
  blinkDuration?: number;
  /** Callback chiamata quando l'animazione di blink termina */
  onBlinkComplete?: () => void;
  /** Riferimento all'elemento button */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Componente ChallengeButton per i pulsanti delle challenge
 *
 * Fornisce uno stile consistente basato su Nes.css e supporta
 * l'animazione di blink per feedback visivo.
 */
export const ChallengeButton = forwardRef<
  HTMLButtonElement,
  ChallengeButtonProps
>(
  (
    {
      children,
      variant = 'default',
      size = 'normal',
      shouldBlink = false,
      blinkDuration,
      onBlinkComplete,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const { flashing, isVisible, startBlink } = useBlinkAnimation(
      blinkDuration,
      onBlinkComplete
    );

    // Avvia l'animazione quando shouldBlink diventa true
    useEffect(() => {
      if (shouldBlink) {
        startBlink();
      }
    }, [shouldBlink, startBlink]);

    // Rimuoviamo questo useEffect perché ora il callback viene gestito direttamente nell'hook
    // useEffect(() => {
    //   if (!flashing && shouldBlink && onBlinkComplete) {
    //     onBlinkComplete();
    //   }
    // }, [flashing, shouldBlink, onBlinkComplete]);

    const getVariantClass = () => {
      // Per i pulsanti disabled che dovrebbero mostrare successo, mostriamo success
      if (disabled && variant === 'success') return 'is-success';
      if (disabled || variant === 'disabled') return 'is-disabled';

      switch (variant) {
        case 'default':
          return ''; // Nessuna classe aggiuntiva per stile default (bianco)
        case 'primary':
          return 'is-primary';
        case 'success':
          return 'is-success';
        case 'error':
          return 'is-error';
        case 'warning':
          return 'is-warning';
        default:
          return '';
      }
    };

    const getSizeClass = () => {
      switch (size) {
        case 'small':
          return 'text-sm';
        case 'normal':
          return 'text-base';
        default:
          return 'text-base';
      }
    };

    const buttonClasses = cn(
      'nes-btn',
      'p-3',
      'text-left',
      'transition-colors',
      'w-full',
      getVariantClass(),
      getSizeClass(),
      className
    );

    const buttonStyle =
      flashing && !isVisible ? { visibility: 'hidden' as const } : {};

    return (
      <button
        ref={ref}
        className={buttonClasses}
        style={buttonStyle}
        disabled={disabled || variant === 'disabled'}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ChallengeButton.displayName = 'ChallengeButton';
