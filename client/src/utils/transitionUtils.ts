export const FADE_IN_MS = 1500;
export const FADE_OUT_MS = 1500;
export const HOLD_MS = 1000;

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runAnimation(
  el: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  fallbackMs: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!el) return resolve();
    try {
      const anyEl = el as any;
      if (anyEl.animate) {
        const anim = anyEl.animate(keyframes, options);
        anim.finished.then(() => resolve()).catch(() => resolve());
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // fallback timing
    window.setTimeout(() => resolve(), fallbackMs);
  });
}
