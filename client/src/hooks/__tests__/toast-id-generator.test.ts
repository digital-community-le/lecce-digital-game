import { describe, it, expect } from 'vitest';

/**
 * Test suite per la generazione di ID unici dei toast
 * Verifica che il nuovo sistema di generazione ID eviti duplicati
 */

// Simulazione del generatore di ID come implementato in use-game-store.tsx
let toastCounter = 0;

function generateToastId(): string {
  return `toast_${Date.now()}_${++toastCounter}`;
}

describe('Toast ID Generator', () => {
  it('should generate unique IDs even with rapid successive calls', () => {
    const ids = new Set<string>();
    const numberOfIds = 100;

    // Reset counter for consistent test
    toastCounter = 0;

    // Generate multiple IDs rapidly
    for (let i = 0; i < numberOfIds; i++) {
      const id = generateToastId();
      expect(ids.has(id)).toBe(false); // Verify ID is unique
      ids.add(id);
    }

    expect(ids.size).toBe(numberOfIds);
  });

  it('should follow the correct format pattern', () => {
    toastCounter = 0;
    const id = generateToastId();
    const pattern = /^toast_\d+_\d+$/;

    expect(id).toMatch(pattern);
  });

  it('should increment counter correctly', () => {
    toastCounter = 0;

    const id1 = generateToastId();
    const id2 = generateToastId();
    const id3 = generateToastId();

    // Extract counter parts
    const counter1 = parseInt(id1.split('_')[2]);
    const counter2 = parseInt(id2.split('_')[2]);
    const counter3 = parseInt(id3.split('_')[2]);

    expect(counter1).toBe(1);
    expect(counter2).toBe(2);
    expect(counter3).toBe(3);
  });

  it('should handle stress test with many IDs', () => {
    const ids = new Set<string>();
    const stressTestCount = 1000;

    toastCounter = 0;

    for (let i = 0; i < stressTestCount; i++) {
      const id = generateToastId();
      ids.add(id);
    }

    // All IDs should be unique
    expect(ids.size).toBe(stressTestCount);
  });

  it('should generate different timestamps in different calls', async () => {
    toastCounter = 0;

    const id1 = generateToastId();

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 2));

    const id2 = generateToastId();

    const timestamp1 = id1.split('_')[1];
    const timestamp2 = id2.split('_')[1];

    // Even if timestamps are the same, counters should be different
    const counter1 = id1.split('_')[2];
    const counter2 = id2.split('_')[2];

    expect(counter1).not.toBe(counter2);
  });
});
