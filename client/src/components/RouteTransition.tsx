import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { FADE_IN_MS, FADE_OUT_MS, HOLD_MS, prefersReducedMotion, runAnimation, sleep } from '@/utils/transitionUtils';
import { useGameStore } from '@/hooks/use-game-store';

/**
 * RouteTransition
 * - Listens to route changes and plays a short fade-to-black / fade-from-black
 *   transition similar to retro games.
 *
 * Behavior:
 * - When the location changes, overlay fades in to black, waits for a small
 *   moment, then fades out revealing the new page.
 * - Respects prefers-reduced-motion and will skip animations.
 */
export default function RouteTransition() {
  // refs/state
  const locRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // indicates that a fade-in (the initial fade-to-black) was started
  const fadeInActiveRef = useRef(false);
  // prevents overlapping reveals
  const isRevealingRef = useRef(false);

  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { withRouteTransition, setWithRouteTransition } = useGameStore();

  // track the current pathname (without causing re-renders for every route)
  const [location] = useLocation();

  // initialize current location on mount
  useEffect(() => {
    locRef.current = location;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Announce presence so hooks like useNavigateWithTransition can rely on the store
  useEffect(() => {
    setWithRouteTransition(true);
    return () => setWithRouteTransition(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishReveal = (newLocation?: string) => {
    setAnimating(false);
    setVisible(false);
    isRevealingRef.current = false;
    if (newLocation) locRef.current = newLocation;
    window.dispatchEvent(new CustomEvent('route-transition:finished'));
  };

  const doReveal = async (targetLocation?: string) => {
    // prevent overlapping reveals
    if (isRevealingRef.current) return;
    isRevealingRef.current = true;

  const prefersReduced = prefersReducedMotion();
    if (prefersReduced) {
      finishReveal(targetLocation);
      return;
    }

    const el = overlayRef.current as Element | null;
    setAnimating(true);
    // make sure overlay is visible and opaque
    setVisible(true);
    if (el) (el as HTMLElement).style.opacity = '1';

  await runAnimation(el, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'steps(8, end)', fill: 'forwards' }, FADE_OUT_MS);
    finishReveal(targetLocation ?? location);
  };

  const doFadeIn = async () => {
    fadeInActiveRef.current = true;
  const prefersReduced = prefersReducedMotion();
    const el = overlayRef.current as Element | null;
    if (prefersReduced) {
      window.dispatchEvent(new CustomEvent('route-transition:ready'));
      fadeInActiveRef.current = false;
      return;
    }

    setAnimating(true);
    // ensure starting opacity is 0
    if (el) (el as HTMLElement).style.opacity = '0';
    setVisible(true);

  await runAnimation(el, [{ opacity: 0 }, { opacity: 1 }], { duration: FADE_IN_MS, easing: 'steps(8, end)', fill: 'forwards' }, FADE_IN_MS);
  // hold
  await sleep(HOLD_MS);
    // notify ready for navigation
    window.dispatchEvent(new CustomEvent('route-transition:ready'));
    fadeInActiveRef.current = false;
  };

  // No special-case effect: RouteTransition is mounted inside `GameLayout`.
  // The generic location-change effect below will handle reveals for any
  // navigation that occurs while this component is mounted (i.e. inside
  // the game layout).

  // Listen for explicit start requests (navigateWithTransition will dispatch this)
  useEffect(() => {
    const onStart = () => void doFadeIn();
    const onReady = () => void doReveal();

    window.addEventListener('route-transition:start', onStart as EventListener);
    window.addEventListener('route-transition:ready', onReady as EventListener);

    return () => {
      window.removeEventListener('route-transition:start', onStart as EventListener);
      window.removeEventListener('route-transition:ready', onReady as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When location changes (navigation happened), reveal the new route by fading out
  useEffect(() => {
    // run reveal on any navigation while mounted (GameLayout mounts this)
    if (!locRef.current) {
      locRef.current = location;
      return;
    }

    if (locRef.current === location) return;

    // If a fade-in is in progress, the onReady handler will trigger reveal.
    if (fadeInActiveRef.current) {
      locRef.current = location;
      return;
    }

    // otherwise run reveal for this navigation
    void doReveal(location);

    return () => {
      locRef.current = null;
    }
  }, [location]);

  // Overlay should remain mounted (to preserve layout stacking) but hidden when not active
  return (
    <div
      ref={(el) => (overlayRef.current = el)}
      aria-hidden={!animating}
      className={`route-transition-overlay pixel ${visible ? 'visible scan-strong' : 'hidden'}`}>
    </div>
  );
}
