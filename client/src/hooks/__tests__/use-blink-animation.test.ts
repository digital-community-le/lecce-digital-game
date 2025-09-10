import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBlinkAnimation } from '../use-blink-animation';

describe('useBlinkAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return initial state with flashing false and flashCount 0', () => {
    const { result } = renderHook(() => useBlinkAnimation());

    expect(result.current.flashing).toBe(false);
    expect(result.current.flashCount).toBe(0);
    expect(typeof result.current.startBlink).toBe('function');
  });

  it('should start blinking animation when startBlink is called', () => {
    const { result } = renderHook(() => useBlinkAnimation());

    act(() => {
      result.current.startBlink();
    });

    expect(result.current.flashing).toBe(true);
    expect(result.current.flashCount).toBe(0);
  });

  it('should increment flashCount every 200ms during animation', () => {
    const { result } = renderHook(() => useBlinkAnimation());

    act(() => {
      result.current.startBlink();
    });

    // After 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.flashCount).toBe(1);

    // After 400ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.flashCount).toBe(2);

    // After 600ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.flashCount).toBe(3);
  });

  it('should stop animation after 6 blinks (1200ms)', () => {
    const { result } = renderHook(() => useBlinkAnimation());

    act(() => {
      result.current.startBlink();
    });

    // Complete the full animation cycle
    act(() => {
      vi.advanceTimersByTime(1200); // 6 x 200ms
    });

    expect(result.current.flashing).toBe(false);
    expect(result.current.flashCount).toBe(0);
  });

  it('should return correct visibility state based on flashCount', () => {
    const { result } = renderHook(() => useBlinkAnimation());

    act(() => {
      result.current.startBlink();
    });

    // Odd flashCount should hide element
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.isVisible).toBe(false); // flashCount = 1

    // Even flashCount should show element
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.isVisible).toBe(true); // flashCount = 2
  });

  it('should allow custom animation duration', () => {
    const customDuration = 100;
    const { result } = renderHook(() => useBlinkAnimation(customDuration));

    act(() => {
      result.current.startBlink();
    });

    // After custom duration
    act(() => {
      vi.advanceTimersByTime(customDuration);
    });
    expect(result.current.flashCount).toBe(1);

    // Complete animation with custom duration
    act(() => {
      vi.advanceTimersByTime(customDuration * 5); // 6 total intervals
    });
    expect(result.current.flashing).toBe(false);
  });
});
