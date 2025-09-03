import { useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStoreSafe } from '@/hooks/use-game-store';

/**
 * useNavigateWithTransition
 * - Returns a function that navigates while coordinating the RouteTransition overlay.
 * - Sequence:
 *   1) dispatch 'route-transition:start'
 *   2) wait for 'route-transition:ready' event
 *   3) call wouter setLocation to change route
 *   4) wait for 'route-transition:finished' (optional)
 */
export default function useNavigateWithTransition() {
  const [, setLocation] = useLocation();

  const safeStore = useGameStoreSafe();
  const withRouteTransitionRef = useRef<boolean>(!!(safeStore && safeStore.withRouteTransition));
  useEffect(() => {
    withRouteTransitionRef.current = !!(safeStore && safeStore.withRouteTransition);
  }, [safeStore && safeStore.withRouteTransition]);

  const navigate = useCallback((path: string) => {
    return new Promise<void>((resolve) => {
      // If RouteTransition is not enabled in the global store, navigate normally
      if (!withRouteTransitionRef.current) {
        setLocation(path);
        resolve();
        return;
      }

      const onReady = () => {
        window.removeEventListener('route-transition:ready', onReady);
        // perform actual navigation
        setLocation(path);

        const onFinished = () => {
          window.removeEventListener('route-transition:finished', onFinished);
          resolve();
        };

        window.addEventListener('route-transition:finished', onFinished);
      };

      // safety timeout: if ready never fires, navigate after X ms
      const TIMEOUT = 3000;
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener('route-transition:ready', onReady);
        setLocation(path);
        resolve();
      }, TIMEOUT);

      const readyHandler = () => {
        clearTimeout(timeoutId);
        onReady();
      };

      window.addEventListener('route-transition:ready', readyHandler);

      // start transition
      window.dispatchEvent(new CustomEvent('route-transition:start'));
    });
  }, [setLocation, withRouteTransitionRef]);

  return navigate;
}
