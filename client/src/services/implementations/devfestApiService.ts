import {
  IDevFestApiConfig,
  ITestModeChecker,
  IHttpClient,
  IDevFestApiService,
  IAuthService,
  DevFestBadgeRequest,
  DevFestBadgeResponse,
  GameCompletionResult
} from '../interfaces/devfestApi.interfaces';

/**
 * DevFest API Service implementation
 * Single Responsibility: Handle DevFest API operations
 * Dependency Inversion: Depends on abstractions, not concretions
 * Open/Closed: Extensible through dependency injection
 */
export class DevFestApiService implements IDevFestApiService {
  constructor(
    private readonly config: IDevFestApiConfig,
    private readonly testModeChecker: ITestModeChecker,
    private readonly httpClient: IHttpClient,
    private readonly authService: IAuthService
  ) { }

  async claimGameCompletionBadge(): Promise<DevFestBadgeResponse> {
    const isTest = this.testModeChecker.isTestMode();

    const payload: DevFestBadgeRequest = {
      secret: this.config.gameCompletionSecret
    };

    if (isTest) {
      // Return mock response in test mode
      const mockResponse: DevFestBadgeResponse = {
        id: 1,
        name: "Sigillo di Lecce - Master Quest",
        description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
        picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
        owned: true
      };

      console.log('🧪 TEST MODE - DevFest API simulation completed');
      return mockResponse;
    }

    // Production mode: make real API call
    console.log('🚀 Calling DevFest API for game completion badge...');

    // Prepare headers with JWT bearer token
    const headers: Record<string, string> = {};
    const jwtToken = this.authService.getCurrentJwtToken();
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    try {
      const response = await this.httpClient.post<DevFestBadgeRequest, DevFestBadgeResponse>(
        this.config.badgeEndpoint,
        payload,
        headers
      );

      console.log('✅ DevFest badge claimed successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ DevFest API error:', error);
      throw error;
    }
  }

  async handleGameCompletion(): Promise<GameCompletionResult> {
    try {
      const badge = await this.claimGameCompletionBadge();
      return {
        success: true,
        badge
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
