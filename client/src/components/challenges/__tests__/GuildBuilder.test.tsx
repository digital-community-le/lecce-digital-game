/**
 * Unit tests for Guild Builder component
 * Focus on pure logic testing to avoid complex React context setup
 */

import { describe, it, expect } from 'vitest';
import { getSuggestion } from '../GuildBuilder';

describe('GuildBuilder getSuggestion Function', () => {
  const requiredRoles = ['Social Media Wizard', 'Designer', 'Speaker'];
  const questText = 'Migliora la visibilità sui social con una squadra bilanciata';

  it('should provide specific suggestion for Developer role', () => {
    const suggestion = getSuggestion('Developer', requiredRoles, questText);
    
    expect(suggestion).toContain('Developer');
    expect(suggestion).toContain('Social Media Wizard');
    expect(suggestion.length).toBeGreaterThan(20);
  });

  it('should provide specific suggestion for Tester role', () => {
    const suggestion = getSuggestion('Tester', requiredRoles, questText);
    
    expect(suggestion).toContain('Tester');
    expect(suggestion.length).toBeGreaterThan(20);
  });

  it('should provide specific suggestion for Project Manager role', () => {
    const suggestion = getSuggestion('Project Manager', requiredRoles, questText);
    
    expect(suggestion).toContain('Project Manager');
    expect(suggestion.length).toBeGreaterThan(20);
  });

  it('should provide generic suggestion for unknown roles', () => {
    const suggestion = getSuggestion('Unknown Role', requiredRoles, questText);
    
    expect(suggestion).toContain('competenze diverse');
    expect(suggestion.length).toBeGreaterThan(20);
  });

  it('should handle empty required roles array', () => {
    const suggestion = getSuggestion('Developer', [], questText);
    
    expect(typeof suggestion).toBe('string');
    expect(suggestion.length).toBeGreaterThan(0);
  });

  it('should handle empty quest text', () => {
    const suggestion = getSuggestion('Developer', requiredRoles, '');
    
    expect(typeof suggestion).toBe('string');
    expect(suggestion.length).toBeGreaterThan(0);
  });

  it('should return different suggestions for different roles', () => {
    const developerSuggestion = getSuggestion('Developer', requiredRoles, questText);
    const testerSuggestion = getSuggestion('Tester', requiredRoles, questText);
    
    expect(developerSuggestion).not.toBe(testerSuggestion);
  });

  it('should include role-specific guidance', () => {
    const suggestion = getSuggestion('Developer', requiredRoles, questText);
    
    // Verifica che il suggerimento contenga informazioni specifiche per il role
    expect(suggestion.toLowerCase()).toMatch(/developer|sviluppatore/);
  });

  it('should provide consistent suggestions for same inputs', () => {
    const suggestion1 = getSuggestion('Developer', requiredRoles, questText);
    const suggestion2 = getSuggestion('Developer', requiredRoles, questText);
    
    // La funzione dovrebbe essere deterministica
    expect(suggestion1).toBe(suggestion2);
  });

  it('should handle multiple required roles', () => {
    const multipleRoles = ['Developer', 'Designer', 'Tester', 'Project Manager'];
    const suggestion = getSuggestion('Social Media Wizard', multipleRoles, questText);
    
    expect(typeof suggestion).toBe('string');
    expect(suggestion.length).toBeGreaterThan(10);
  });
});
