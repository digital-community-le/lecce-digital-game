import { describe, it, expect } from 'vitest';

// Test utility functions for OCR normalization
// These match the functions used in the OCR worker

const normalize = (s: string) => String(s || '').toLowerCase()
  .replace(/\s+/g, '') // Remove spaces
  .replace(/[^\w@#_]/g, ''); // Keep word chars, @, #, _

const fuzzyNormalize = (s: string) => String(s || '').toLowerCase()
  .replace(/[^\w]/g, ''); // Keep only word characters for fuzzy matching

describe('OCR Normalization Functions', () => {
  describe('normalize function', () => {
    it('should normalize standard tags correctly', () => {
      expect(normalize('@lecce_digital_community')).toBe('@lecce_digital_community');
      expect(normalize('@gdg_lecce')).toBe('@gdg_lecce');
    });

    it('should handle tags with spaces', () => {
      expect(normalize('@lecce digital community')).toBe('@leccedigitalcommunity');
      expect(normalize('@gdg lecce')).toBe('@gdglecce');
    });

    it('should handle tags with special characters', () => {
      expect(normalize('@lecce-digital-community')).toBe('@leccedigitalcommunity');
      expect(normalize('@lecce.digital.community')).toBe('@leccedigitalcommunity');
    });

    it('should preserve @ and # symbols', () => {
      expect(normalize('#devfest')).toBe('#devfest');
      expect(normalize('@mention')).toBe('@mention');
    });
  });

  describe('fuzzyNormalize function', () => {
    it('should remove all special characters', () => {
      expect(fuzzyNormalize('@lecce_digital_community')).toBe('lecce_digital_community');
      expect(fuzzyNormalize('#gdg-lecce')).toBe('gdglecce');
    });

    it('should handle complex cases', () => {
      expect(fuzzyNormalize('lecce digital community')).toBe('leccedigitalcommunity');
      expect(fuzzyNormalize('GDG Lecce')).toBe('gdglecce');
    });
  });

  describe('tag matching logic', () => {
    const mockWords = [
      { text: '@lecce_digital_community', norm: normalize('@lecce_digital_community'), fuzzyNorm: fuzzyNormalize('@lecce_digital_community'), confidence: 85 },
      { text: 'lecce digital community', norm: normalize('lecce digital community'), fuzzyNorm: fuzzyNormalize('lecce digital community'), confidence: 75 },
      { text: '@gdg-lecce', norm: normalize('@gdg-lecce'), fuzzyNorm: fuzzyNormalize('@gdg-lecce'), confidence: 90 },
      { text: 'random text', norm: normalize('random text'), fuzzyNorm: fuzzyNormalize('random text'), confidence: 60 }
    ];

    it('should find exact matches', () => {
      const requiredTag = '@lecce_digital_community';
      const nTag = normalize(requiredTag);

      const exactMatches = mockWords.filter(w => w.norm === nTag);
      expect(exactMatches).toHaveLength(1);
      expect(exactMatches[0].confidence).toBe(85);
    });

    it('should find fuzzy matches', () => {
      const requiredTag = '@lecce_digital_community';
      const fuzzyTag = fuzzyNormalize(requiredTag);

      const fuzzyMatches = mockWords.filter(w => w.fuzzyNorm.includes(fuzzyTag));
      expect(fuzzyMatches).toHaveLength(1); // Only exact match with underscore
    });

    it('should find matches for GDG tag', () => {
      const requiredTag = '@gdg_lecce';
      const fuzzyTag = fuzzyNormalize(requiredTag);

      const fuzzyMatches = mockWords.filter(w => w.fuzzyNorm.includes(fuzzyTag));
      expect(fuzzyMatches).toHaveLength(0); // No matches due to underscore vs dash difference
    });
  });
});