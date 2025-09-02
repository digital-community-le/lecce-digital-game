import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

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
  const locRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // track the current pathname (without causing re-renders for every route)
  const [location] = useLocation();

  // initialize current location on mount
  useEffect(() => {
    locRef.current = location;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for explicit start requests (navigateWithTransition will dispatch this)
  useEffect(() => {
    const onStart = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        window.dispatchEvent(new CustomEvent('route-transition:ready'));
        return;
      }

      // Begin fade-to-black using Web Animations API when available for reliability
      setAnimating(true);
      try {
        const el = overlayRef.current;
        const fadeIn = 1500;
        const hold = 1000;
        if (el && (el as any).animate) {
          // ensure starting opacity
          el.style.opacity = '0';
          // run fade-in
          console.debug('[RouteTransition] starting WA fade-in');
          const anim = (el as any).animate([
            { opacity: 0 },
            { opacity: 1 }
          ], { duration: fadeIn, easing: 'steps(8, end)', fill: 'forwards' });

          anim.finished.then(() => {
            console.debug('[RouteTransition] WA fade-in finished, entering hold');
            // after hold, signal ready
            setTimeout(() => {
              console.debug('[RouteTransition] hold finished, dispatching ready');
              window.dispatchEvent(new CustomEvent('route-transition:ready'));
            }, hold);
          }).catch(() => {
            // on failure fallback to immediate ready
            console.debug('[RouteTransition] WA fade-in failed, dispatching ready');
            window.dispatchEvent(new CustomEvent('route-transition:ready'));
          });

          // mark visible for CSS fallback class
          setVisible(true);
          return;
        }
      } catch (e) {
        console.debug('[RouteTransition] WA API failed, falling back to CSS');
      }

      // Fallback: class-based timing
      setVisible(true);
      const fadeIn = 1500;
      const hold = 1000;
      const t = window.setTimeout(() => {
        const t2 = window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('route-transition:ready'));
        }, hold);
        return () => clearTimeout(t2);
      }, fadeIn);

      return () => clearTimeout(t);
    };

    window.addEventListener('route-transition:start', onStart as EventListener);
    return () => window.removeEventListener('route-transition:start', onStart as EventListener);
  }, []);

  // When location changes (navigation happened), reveal the new route by fading out
  useEffect(() => {
    if (locRef.current && locRef.current !== location) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        locRef.current = location;
        window.dispatchEvent(new CustomEvent('route-transition:finished'));
        setAnimating(false);
        setVisible(false);
        return;
      }

      const el = overlayRef.current;
      const fadeOut = 1500;
      if (el && (el as any).animate) {
        try {
          console.debug('[RouteTransition] starting WA fade-out');
          const anim = (el as any).animate([
            { opacity: 1 },
            { opacity: 0 }
          ], { duration: fadeOut, easing: 'steps(8, end)', fill: 'forwards' });

          // Do NOT toggle visible immediately; wait for animation to finish so the overlay
          // remains opaque while the new route mounts underneath.
          anim.finished.then(() => {
            console.debug('[RouteTransition] WA fade-out finished');
            locRef.current = location;
            setAnimating(false);
            setVisible(false);
            window.dispatchEvent(new CustomEvent('route-transition:finished'));
          }).catch(() => {
            console.debug('[RouteTransition] WA fade-out failed (catch)');
            locRef.current = location;
            setAnimating(false);
            setVisible(false);
            window.dispatchEvent(new CustomEvent('route-transition:finished'));
          });

          return;
        } catch (e) {
          console.debug('[RouteTransition] fade-out WA failed, falling back to CSS');
        }
      }

      // Fallback: class-based fade out
      setVisible(false);
      const t = window.setTimeout(() => {
        locRef.current = location;
        setAnimating(false);
        window.dispatchEvent(new CustomEvent('route-transition:finished'));
      }, fadeOut);

      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
