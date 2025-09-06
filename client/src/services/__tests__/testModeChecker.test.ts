/**
 * Unit tests for TestModeChecker
 * Demonstrates testability through dependency injection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { TestModeChecker } from '../implementations/testModeChecker';

describe('TestModeChecker', () => {
  let mockUrlSearchParams: URLSearchParams;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockUrlSearchParams = new URLSearchParams();
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
  });

  describe('isTestMode', () => {
    it('should return true when URL param test=1', () => {
      // Arrange
      mockUrlSearchParams.set('test', '1');
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when URL param test=0', () => {
      // Arrange
      mockUrlSearchParams.set('test', '0');
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, false);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when localStorage has test flag', () => {
      // Arrange
      const gameData = JSON.stringify({ test: true });
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue(gameData);
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, false);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('lecce-digital-game');
    });

    it('should handle localStorage parsing errors gracefully', () => {
      // Arrange
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, false);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse stored game data for test mode check:',
        expect.any(SyntaxError)
      );
      
      consoleSpy.mockRestore();
    });

    it('should prioritize URL params over localStorage', () => {
      // Arrange
      mockUrlSearchParams.set('test', '1');
      const gameData = JSON.stringify({ test: false });
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue(gameData);
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(true);
      // Should not call localStorage since URL param takes precedence
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('should return false when no test indicators are present', () => {
      // Arrange
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue(null);
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, false);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle empty localStorage data', () => {
      // Arrange
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue('{}');
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, false);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true in development mode when override is enabled', () => {
      // Arrange
      (mockLocalStorage.getItem as MockedFunction<any>).mockReturnValue(null);
      const checker = new TestModeChecker(mockUrlSearchParams, mockLocalStorage, true);

      // Act
      const result = checker.isTestMode();

      // Assert
      expect(result).toBe(true);
    });
  });
});
