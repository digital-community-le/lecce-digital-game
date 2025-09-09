import { describe, it, expect } from 'vitest';
import { DevFestApiConfigProvider } from '../implementations/devfestApiConfigProvider';

/**
 * Test suite for DevFestApiConfigProvider
 * Updated for JWT authentication (no more bearer token in config)
 */
describe('DevFestApiConfigProvider', () => {
  describe('Configuration Loading', () => {
    it('should load configuration from game data correctly', () => {
      // Arrange
      const gameDataWithConfig = {
        gameConfig: {
          api: {
            badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/',
            gameCompletionSecret: 'test-secret'
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(gameDataWithConfig);

      // Act
      const config = configProvider.getConfig();

      // Assert
      expect(config).toEqual({
        badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/',
        gameCompletionSecret: 'test-secret'
      });
    });

    it('should handle different endpoint configurations', () => {
      // Arrange
      const customGameData = {
        gameConfig: {
          api: {
            badgeEndpoint: 'https://custom.api.example.com/badges/',
            gameCompletionSecret: 'custom-secret-456'
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(customGameData);

      // Act
      const config = configProvider.getConfig();

      // Assert
      expect(config.badgeEndpoint).toBe('https://custom.api.example.com/badges/');
      expect(config.gameCompletionSecret).toBe('custom-secret-456');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when API configuration is missing', () => {
      // Arrange
      const gameDataWithoutApiConfig = {
        gameConfig: {}
      };

      const configProvider = new DevFestApiConfigProvider(gameDataWithoutApiConfig);

      // Act & Assert
      expect(() => configProvider.getConfig()).toThrow('DevFest API configuration is missing in game-data.json');
    });

    it('should throw error when badgeEndpoint is missing', () => {
      // Arrange
      const gameDataWithoutEndpoint = {
        gameConfig: {
          api: {
            gameCompletionSecret: 'test-secret'
            // badgeEndpoint is missing
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(gameDataWithoutEndpoint);

      // Act & Assert
      expect(() => configProvider.getConfig()).toThrow('DevFest API configuration is missing in game-data.json');
    });

    it('should throw error when gameCompletionSecret is missing', () => {
      // Arrange
      const gameDataWithoutSecret = {
        gameConfig: {
          api: {
            badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/'
            // gameCompletionSecret is missing
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(gameDataWithoutSecret);

      // Act & Assert
      expect(() => configProvider.getConfig()).toThrow('DevFest API configuration is missing in game-data.json');
    });

    it('should throw error when gameConfig is completely missing', () => {
      // Arrange
      const gameDataWithoutGameConfig = {};

      const configProvider = new DevFestApiConfigProvider(gameDataWithoutGameConfig);

      // Act & Assert
      expect(() => configProvider.getConfig()).toThrow('DevFest API configuration is missing in game-data.json');
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration as valid', () => {
      // Arrange
      const validGameData = {
        gameConfig: {
          api: {
            badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/',
            gameCompletionSecret: 'valid-secret'
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(validGameData);

      // Act
      const isValid = configProvider.validateConfig();

      // Assert
      expect(isValid).toBe(true);
    });

    it('should validate incorrect configuration as invalid', () => {
      // Arrange
      const invalidGameData = {
        gameConfig: {
          api: {
            badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/'
            // gameCompletionSecret is missing
          }
        }
      };

      const configProvider = new DevFestApiConfigProvider(invalidGameData);

      // Act
      const isValid = configProvider.validateConfig();

      // Assert
      expect(isValid).toBe(false);
    });

    it('should validate missing api configuration as invalid', () => {
      // Arrange
      const gameDataWithoutApi = {
        gameConfig: {}
      };

      const configProvider = new DevFestApiConfigProvider(gameDataWithoutApi);

      // Act
      const isValid = configProvider.validateConfig();

      // Assert
      expect(isValid).toBe(false);
    });

    it('should validate completely empty data as invalid', () => {
      // Arrange
      const emptyGameData = {};

      const configProvider = new DevFestApiConfigProvider(emptyGameData);

      // Act
      const isValid = configProvider.validateConfig();

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
