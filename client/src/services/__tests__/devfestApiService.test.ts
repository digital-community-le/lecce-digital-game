import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DevFestApiService } from '../implementations/devfestApiService';
import {
  IDevFestApiConfig,
  ITestModeChecker,
  IHttpClient,
  IAuthService,
  DevFestBadgeResponse
} from '../interfaces/devfestApi.interfaces';

/**
 * Test suite for DevFestApiService (Legacy tests updated for JWT auth)
 * Focuses on testing general functionality with JWT authentication
 */
describe('DevFestApiService', () => {
  let service: DevFestApiService;
  let mockConfig: IDevFestApiConfig;
  let mockTestModeChecker: ITestModeChecker;
  let mockHttpClient: IHttpClient;
  let mockAuthService: IAuthService;

  beforeEach(() => {
    // Mock configuration
    mockConfig = {
      badgeEndpoint: 'https://api.devfest.gdglecce.it/badges/@scan/',
      gameCompletionSecret: 'test-secret'
    };

    // Mock test mode checker (production mode for API tests)
    mockTestModeChecker = {
      isTestMode: vi.fn().mockReturnValue(false)
    };

    // Mock HTTP client with spy functions
    mockHttpClient = {
      post: vi.fn()
    };

    // Mock auth service
    mockAuthService = {
      getCurrentJwtToken: vi.fn().mockReturnValue('test-jwt-token-123')
    };

    service = new DevFestApiService(mockConfig, mockTestModeChecker, mockHttpClient, mockAuthService);
  });

  describe('Bearer Token Authentication', () => {
    it('should include JWT bearer token in Authorization header when available', async () => {
      // Arrange
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(jwtToken);

      const expectedResponse: DevFestBadgeResponse = {
        id: 1,
        name: "Test Badge",
        description: "Test Description",
        picture: "https://example.com/badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedResponse);

      // Act
      const result = await service.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges/@scan/',
        { secret: 'test-secret' },
        { 'Authorization': `Bearer ${jwtToken}` }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should not include Authorization header when JWT token is not available', async () => {
      // Arrange
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(null);

      const expectedResponse: DevFestBadgeResponse = {
        id: 2,
        name: "No Auth Badge",
        description: "Badge without authorization",
        picture: "https://example.com/badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedResponse);

      // Act
      const result = await service.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges/@scan/',
        { secret: 'test-secret' },
        {} // Empty headers when no JWT token
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should not include Authorization header when JWT token is empty string', async () => {
      // Arrange
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('');

      const expectedResponse: DevFestBadgeResponse = {
        id: 3,
        name: "Empty Token Badge",
        description: "Badge with empty token",
        picture: "https://example.com/badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedResponse);

      // Act
      const result = await service.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges/@scan/',
        { secret: 'test-secret' },
        {} // Empty headers when JWT token is empty
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should format JWT bearer token correctly with Bearer prefix', async () => {
      // Arrange
      const customToken = 'custom-jwt-token-456';
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(customToken);

      const expectedResponse: DevFestBadgeResponse = {
        id: 4,
        name: "Custom Token Badge",
        description: "Badge with custom token",
        picture: "https://example.com/badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedResponse);

      // Act
      await service.claimGameCompletionBadge();

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges/@scan/',
        { secret: 'test-secret' },
        { 'Authorization': `Bearer ${customToken}` }
      );
    });
  });

  describe('Test Mode Behavior', () => {
    it('should not make HTTP calls in test mode', async () => {
      // Arrange
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(true);

      // Act
      const result = await service.claimGameCompletionBadge();

      // Assert
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockAuthService.getCurrentJwtToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        name: "Sigillo di Lecce - Master Quest",
        description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
        picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
        owned: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP client errors correctly', async () => {
      // Arrange
      const networkError = new Error('Network error');
      vi.mocked(mockHttpClient.post).mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.claimGameCompletionBadge()).rejects.toThrow('Network error');
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
    });

    it('should return error result in handleGameCompletion when API fails', async () => {
      // Arrange
      const errorMessage = 'API Error';
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await service.handleGameCompletion();

      // Assert
      expect(result).toEqual({
        success: false,
        error: errorMessage
      });
    });

    it('should return success result in handleGameCompletion when API succeeds', async () => {
      // Arrange
      const expectedBadge: DevFestBadgeResponse = {
        id: 1,
        name: "Test Badge",
        description: "Test Description",
        picture: "https://example.com/badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedBadge);

      // Act
      const result = await service.handleGameCompletion();

      // Assert
      expect(result).toEqual({
        success: true,
        badge: expectedBadge
      });
    });
  });

  describe('Configuration Requirements', () => {
    it('should use correct API endpoint from config', async () => {
      // Arrange
      const mockResponse: DevFestBadgeResponse = {
        id: 1,
        name: "Config Test Badge",
        description: "Badge from config test",
        picture: "https://example.com/config-badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      await service.claimGameCompletionBadge();

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges/@scan/',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use correct secret from config', async () => {
      // Arrange
      const mockResponse: DevFestBadgeResponse = {
        id: 1,
        name: "Secret Test Badge",
        description: "Badge from secret test",
        picture: "https://example.com/secret-badge.png",
        owned: new Date().toISOString()
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      await service.claimGameCompletionBadge();

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        { secret: 'test-secret' },
        expect.any(Object)
      );
    });
  });
});
