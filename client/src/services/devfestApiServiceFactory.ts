import { DevFestApiService } from './implementations/devfestApiService';
import { DevFestApiConfigProvider } from './implementations/devfestApiConfigProvider';
import { TestModeChecker } from './implementations/testModeChecker';
import { FetchHttpClient, MockHttpClient } from './implementations/httpClient';
import { IDevFestApiService, GameCompletionResult } from './interfaces/devfestApi.interfaces';

/**
 * Service Factory - Dependency Injection Container
 * Single Responsibility: Create and wire up services
 * Dependency Inversion: Creates services based on abstractions
 */
class DevFestServiceFactory {
  private static instance: DevFestServiceFactory;
  private devFestApiService: IDevFestApiService | null = null;

  private constructor() {}

  static getInstance(): DevFestServiceFactory {
    if (!DevFestServiceFactory.instance) {
      DevFestServiceFactory.instance = new DevFestServiceFactory();
    }
    return DevFestServiceFactory.instance;
  }

  createDevFestApiService(): IDevFestApiService {
    if (this.devFestApiService) {
      return this.devFestApiService;
    }

    // Create dependencies
    const configProvider = new DevFestApiConfigProvider();
    const config = configProvider.getConfig();
    const testModeChecker = new TestModeChecker();
    
    // Choose HTTP client based on test mode
    const httpClient = testModeChecker.isTestMode() 
      ? new MockHttpClient()
      : new FetchHttpClient();

    // Setup mock responses if in test mode
    if (httpClient instanceof MockHttpClient) {
      httpClient.setMockResponse(config.badgeEndpoint, {
        id: 1,
        name: "Sigillo di Lecce - Master Quest",
        description: "Badge ottenuto completando la Quest Digitale di Lecce al DevFest 2025",
        picture: "https://api.devfest.gdglecce.it/assets/badges/lecce-quest-master.png",
        owned: new Date().toISOString()
      });
    }

    // Create service with injected dependencies
    this.devFestApiService = new DevFestApiService(
      config,
      testModeChecker,
      httpClient
    );

    return this.devFestApiService;
  }

  // For testing: allows injection of custom dependencies
  createDevFestApiServiceWithDependencies(
    config: any,
    testModeChecker: any,
    httpClient: any
  ): IDevFestApiService {
    return new DevFestApiService(config, testModeChecker, httpClient);
  }
}

// Public API - maintains backward compatibility
export async function handleGameCompletion(): Promise<GameCompletionResult> {
  const service = DevFestServiceFactory.getInstance().createDevFestApiService();
  return await service.handleGameCompletion();
}

// Export factory for testing
export { DevFestServiceFactory };

// Export interfaces for external use
export type { GameCompletionResult, DevFestBadgeResponse } from './interfaces/devfestApi.interfaces';
