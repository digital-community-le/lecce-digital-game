/**
 * Configuration interface for DevFest API
 */
export interface IDevFestApiConfig {
  badgeEndpoint: string;
  gameCompletionSecret: string;
}

/**
 * Test mode checker interface
 * Returns true for explicit test mode OR development environment
 */
export interface ITestModeChecker {
  isTestMode(): boolean;
}

/**
 * HTTP client interface for API calls
 */
export interface IHttpClient {
  post<TRequest, TResponse>(
    url: string,
    data: TRequest,
    headers?: Record<string, string>
  ): Promise<TResponse>;
}

/**
 * DevFest badge response interface
 */
export interface DevFestBadgeResponse {
  id: number;
  name: string;
  description: string;
  picture: string;
  owned: string;
}

/**
 * DevFest badge request interface
 */
export interface DevFestBadgeRequest {
  secret: string;
}

/**
 * Game completion result interface
 */
export interface GameCompletionResult {
  success: boolean;
  badge?: DevFestBadgeResponse;
  error?: string;
}

/**
 * DevFest API service interface
 */
export interface IDevFestApiService {
  claimGameCompletionBadge(): Promise<DevFestBadgeResponse>;
  handleGameCompletion(): Promise<GameCompletionResult>;
}
