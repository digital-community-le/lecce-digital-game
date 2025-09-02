import { useCallback } from 'react';
import { useLocation } from 'wouter';

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

  const navigate = useCallback((path: string) => {
    return new Promise<void>((resolve) => {
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

      window.addEventListener('route-transition:ready', onReady);
      // start transition
      window.dispatchEvent(new CustomEvent('route-transition:start'));
    });
  }, [setLocation]);

  return navigate;
}
