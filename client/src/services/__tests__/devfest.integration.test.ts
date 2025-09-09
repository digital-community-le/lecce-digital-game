import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevFestApiService } from '../implementations/devfestApiService';
import { AuthServiceWrapper } from '../implementations/authServiceWrapper';
import * as authService from '../authService';
import {
  IDevFestApiConfig,
  ITestModeChecker,
  IHttpClient
} from '../interfaces/devfestApi.interfaces';

/**
 * Integration test suite for DevFest API with JWT authentication
 * Tests the full flow from URL JWT extraction to API calls
 */
describe('DevFest API JWT Integration', () => {
  let mockConfig: IDevFestApiConfig;
  let mockTestModeChecker: ITestModeChecker;
  let mockHttpClient: IHttpClient;
  let authServiceWrapper: AuthServiceWrapper;
  let devfestApiService: DevFestApiService;

  beforeEach(() => {
    mockConfig = {
      badgeEndpoint: 'https://api.devfest.gdglecce.it/badges',
      gameCompletionSecret: 'integration-test-secret'
    };

    mockTestModeChecker = {
      isTestMode: vi.fn().mockReturnValue(false)
    };

    mockHttpClient = {
      post: vi.fn()
    };

    authServiceWrapper = new AuthServiceWrapper();
    devfestApiService = new DevFestApiService(
      mockConfig,
      mockTestModeChecker,
      mockHttpClient,
      authServiceWrapper
    );

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should extract JWT from URL and include it in API call headers', async () => {
    // Arrange - Mock URL with JWT token
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZmZXN0LXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature';

    // Mock the getCurrentJwtToken to return our test token
    vi.spyOn(authService, 'getCurrentJwtToken').mockReturnValue(jwtToken);

    const mockApiResponse = {
      id: 100,
      name: "DevFest Integration Badge",
      description: "Badge from integration test",
      picture: "https://api.devfest.gdglecce.it/assets/badges/integration.png",
      owned: new Date().toISOString()
    };

    vi.mocked(mockHttpClient.post).mockResolvedValue(mockApiResponse);

    // Act
    const result = await devfestApiService.claimGameCompletionBadge();

    // Assert - Verify JWT token was extracted and used in API call
    expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'https://api.devfest.gdglecce.it/badges',
      { secret: 'integration-test-secret' },
      { 'Authorization': `Bearer ${jwtToken}` }
    );
    expect(result).toEqual(mockApiResponse);
  });

  it('should handle JWT token extraction failure gracefully', async () => {
    // Arrange - Mock authService to return null (no token found)
    vi.spyOn(authService, 'getCurrentJwtToken').mockReturnValue(null);

    const mockApiResponse = {
      id: 101,
      name: "No JWT Badge",
      description: "Badge without JWT token",
      picture: "https://api.devfest.gdglecce.it/assets/badges/no-jwt.png",
      owned: new Date().toISOString()
    };

    vi.mocked(mockHttpClient.post).mockResolvedValue(mockApiResponse);

    // Act
    const result = await devfestApiService.claimGameCompletionBadge();

    // Assert - Verify API call is made without Authorization header
    expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'https://api.devfest.gdglecce.it/badges',
      { secret: 'integration-test-secret' },
      {} // No Authorization header when JWT is null
    );
    expect(result).toEqual(mockApiResponse);
  });

  it('should not call authService in test mode', async () => {
    // Arrange
    vi.mocked(mockTestModeChecker.isTestMode).mockReturnValue(true);
    vi.spyOn(authService, 'getCurrentJwtToken');

    // Act
    const result = await devfestApiService.claimGameCompletionBadge();

    // Assert
    expect(authService.getCurrentJwtToken).not.toHaveBeenCalled();
    expect(mockHttpClient.post).not.toHaveBeenCalled();
    expect(result.name).toBe("Sigillo di Lecce - Master Quest");
  });

  it('should propagate API errors with JWT authentication context', async () => {
    // Arrange
    const jwtToken = 'test.jwt.token';
    vi.spyOn(authService, 'getCurrentJwtToken').mockReturnValue(jwtToken);

    const apiError = new Error('DevFest API authentication failed');
    vi.mocked(mockHttpClient.post).mockRejectedValue(apiError);

    // Act & Assert
    await expect(devfestApiService.claimGameCompletionBadge()).rejects.toThrow('DevFest API authentication failed');

    // Verify JWT was retrieved and used in the failed call
    expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'https://api.devfest.gdglecce.it/badges',
      { secret: 'integration-test-secret' },
      { 'Authorization': `Bearer ${jwtToken}` }
    );
  });

  it('should handle game completion flow with JWT authentication', async () => {
    // Arrange
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnYW1lLWNvbXBsZXRlciJ9.sig';
    vi.spyOn(authService, 'getCurrentJwtToken').mockReturnValue(jwtToken);

    const completionBadge = {
      id: 200,
      name: "Game Completion Master",
      description: "Completed the entire DevFest quest",
      picture: "https://api.devfest.gdglecce.it/assets/badges/completion.png",
      owned: new Date().toISOString()
    };

    vi.mocked(mockHttpClient.post).mockResolvedValue(completionBadge);

    // Act
    const result = await devfestApiService.handleGameCompletion();

    // Assert
    expect(result.success).toBe(true);
    expect(result.badge).toEqual(completionBadge);
    expect(result.error).toBeUndefined();

    // Verify JWT authentication was used
    expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'https://api.devfest.gdglecce.it/badges',
      { secret: 'integration-test-secret' },
      { 'Authorization': `Bearer ${jwtToken}` }
    );
  });
});
