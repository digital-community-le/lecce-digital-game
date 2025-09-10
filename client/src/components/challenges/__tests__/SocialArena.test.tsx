/**
 * @fileoverview Test suite for SocialArena component
 * @description Tests to verify that skip functionality has been removed from Social Arena challenge.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('SocialArena Component - Skip Button Removal', () => {
  it('should not contain "Salta condivisione" text in the source code', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify that "Salta condivisione" text is not present
    expect(sourceCode).not.toContain('Salta condivisione');
  });

  it('should not contain handleSkipChallenge function in the source code', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify that handleSkipChallenge function is not present
    expect(sourceCode).not.toContain('handleSkipChallenge');
  });

  it('should not contain skip-related functionality in button onClick handlers', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify that no button calls handleSkipChallenge
    expect(sourceCode).not.toContain('onClick={() => handleSkipChallenge()}');
    expect(sourceCode).not.toMatch(/onClick.*handleSkipChallenge/);
  });

  it('should have removed all skip-related text variations', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Check for various skip-related terms that should not be present
    const skipTerms = [
      'Salta condivisione',
      'salta la challenge',
      'skip challenge',
      'saltare',
      'skip.*challenge',
    ];

    skipTerms.forEach((term) => {
      expect(sourceCode).not.toMatch(new RegExp(term, 'i'));
    });
  });
});
