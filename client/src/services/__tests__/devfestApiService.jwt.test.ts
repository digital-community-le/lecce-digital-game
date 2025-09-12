import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevFestApiService } from '../implementations/devfestApiService';
import {
  IDevFestApiConfig,
  ITestModeChecker,
  IHttpClient,
  IAuthService,
  DevFestBadgeResponse
} from '../interfaces/devfestApi.interfaces';

/**
 * Test suite for DevFestApiService
 * Focuses on testing JWT bearer token inclusion in API calls
 */
describe('DevFestApiService', () => {
  let mockConfig: IDevFestApiConfig;
  let mockTestModeChecker: ITestModeChecker;
  let mockHttpClient: IHttpClient;
  let mockAuthService: IAuthService;
  let devfestApiService: DevFestApiService;

  beforeEach(() => {
    mockConfig = {
      badgeEndpoint: 'https://api.devfest.gdglecce.it/badges',
      gameCompletionSecret: 'test-secret'
    };

    mockTestModeChecker = {
      isTestMode: vi.fn()
    };

    mockHttpClient = {
      post: vi.fn()
    };

    mockAuthService = {
      getCurrentJwtToken: vi.fn()
    };

    devfestApiService = new DevFestApiService(
      mockConfig,
      mockTestModeChecker,
      mockHttpClient,
      mockAuthService
    );
  });

  describe('claimGameCompletionBadge', () => {
    it('should return mock response in test mode without making API call', async () => {
      // Arrange
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(true);

      // Act
      const result = await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(result).toEqual({
        id: 1,
        name: "Sigillo di Lecce - Master Quest",
        description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
        picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
        owned: true
      });
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockAuthService.getCurrentJwtToken).not.toHaveBeenCalled();
    });

    it('should make API call with JWT bearer token in production mode', async () => {
      // Arrange
      const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MzQ1NjQ4MDAsImV4cCI6MTYzNDY1MTIwMH0.test-signature';
      const mockResponse: DevFestBadgeResponse = {
        id: 2,
        name: "Production Badge",
        description: "Real badge from API",
        picture: "https://api.devfest.gdglecce.it/assets/badges/real-badge.png",
        owned: true
      };

      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(mockJwtToken);
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      const result = await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges',
        { secret: 'test-secret' },
        { 'Authorization': `Bearer ${mockJwtToken}` }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make API call without Authorization header when JWT token is null', async () => {
      // Arrange
      const mockResponse: DevFestBadgeResponse = {
        id: 3,
        name: "No Auth Badge",
        description: "Badge without auth header",
        picture: "https://api.devfest.gdglecce.it/assets/badges/no-auth.png",
        owned: true
      };

      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(null);
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      const result = await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges',
        { secret: 'test-secret' },
        {} // Empty headers object when no JWT token
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make API call without Authorization header when JWT token is empty string', async () => {
      // Arrange
      const mockResponse: DevFestBadgeResponse = {
        id: 4,
        name: "Empty Token Badge",
        description: "Badge with empty token",
        picture: "https://api.devfest.gdglecce.it/assets/badges/empty-token.png",
        owned: true
      };

      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('');
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      const result = await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges',
        { secret: 'test-secret' },
        {} // Empty headers object when JWT token is empty
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors and throw them', async () => {
      // Arrange
      const mockError = new Error('API Error');
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('mock-token');
      vi.mocked(mockHttpClient.post).mockRejectedValue(mockError);

      // Act & Assert
      await expect(devfestApiService.claimGameCompletionBadge()).rejects.toThrow('API Error');
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledOnce();
    });

    it('should include valid JWT structure in Authorization header', async () => {
      // Arrange
      const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.signature';
      const mockResponse: DevFestBadgeResponse = {
        id: 5,
        name: "JWT Badge",
        description: "Badge with valid JWT",
        picture: "https://api.devfest.gdglecce.it/assets/badges/jwt-badge.png",
        owned: true
      };

      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue(validJwtToken);
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      // Act
      await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.devfest.gdglecce.it/badges',
        { secret: 'test-secret' },
        { 'Authorization': `Bearer ${validJwtToken}` }
      );
    });
  });

  describe('handleGameCompletion', () => {
    it('should return success result when badge claim succeeds', async () => {
      // Arrange
      const mockBadge: DevFestBadgeResponse = {
        id: 1,
        name: "Test Badge",
        description: "Test description",
        picture: "test-picture.png",
        owned: true
      };

      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(true);

      // Act
      const result = await devfestApiService.handleGameCompletion();

      // Assert
      expect(result.success).toBe(true);
      expect(result.badge).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error result when badge claim fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('mock-token');
      vi.mocked(mockHttpClient.post).mockRejectedValue(mockError);

      // Act
      const result = await devfestApiService.handleGameCompletion();

      // Assert
      expect(result.success).toBe(false);
      expect(result.badge).toBeUndefined();
      expect(result.error).toBe('Network error');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('mock-token');
      vi.mocked(mockHttpClient.post).mockRejectedValue('String error');

      // Act
      const result = await devfestApiService.handleGameCompletion();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('JWT Token Integration', () => {
    it('should call authService.getCurrentJwtToken exactly once per API call', async () => {
      // Arrange
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(false);
      vi.mocked(mockAuthService.getCurrentJwtToken).mockReturnValue('test-token');
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        id: 1,
        name: "Test",
        description: "Test",
        picture: "test.png",
        owned: true
      });

      // Act
      await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).toHaveBeenCalledTimes(1);
    });

    it('should not call authService.getCurrentJwtToken in test mode', async () => {
      // Arrange
      vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(true);

      // Act
      await devfestApiService.claimGameCompletionBadge();

      // Assert
      expect(mockAuthService.getCurrentJwtToken).not.toHaveBeenCalled();
    });
  });
});
