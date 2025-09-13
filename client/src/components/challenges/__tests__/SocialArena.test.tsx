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

describe('SocialArena Component - All Required Tags Logic', () => {
  it('should use .every() instead of .some() for tag verification', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify that the code uses .every() to check ALL tags instead of .some() for ANY tag
    expect(sourceCode).toContain('requiredTags.every');
    expect(sourceCode).not.toContain(
      'Object.values(result.tagConfidences).some'
    );
  });

  it('should check that all required tags meet the confidence threshold', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify the comment indicates checking ALL tags
    expect(sourceCode).toContain(
      'Check if ALL required tags meet the confidence threshold'
    );

    // Verify the logic checks all required tags
    expect(sourceCode).toMatch(/requiredTags\.every\s*\(/);
  });

  it('should verify each tag meets the confidence threshold individually', async () => {
    // Read the SocialArena component source code
    const componentPath = join(__dirname, '..', 'SocialArena.tsx');
    const sourceCode = await readFile(componentPath, 'utf-8');

    // Verify that the logic checks each tag's confidence
    expect(sourceCode).toContain('result.tagConfidences?.[tag]');
    expect(sourceCode).toContain(
      'result.tagConfidences[tag] >= confidenceThreshold'
    );
  });
});
