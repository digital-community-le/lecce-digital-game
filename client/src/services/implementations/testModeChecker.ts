import { ITestModeChecker } from '../interfaces/devfestApi.interfaces';

/**
 * Test mode checker implementation
 * Single Responsibility: Only checks for test mode
 */
export class TestModeChecker implements ITestModeChecker {
  private readonly urlSearchParams: URLSearchParams;
  private readonly localStorage: Storage;
  private readonly developmentModeOverride?: boolean;

  constructor(
    urlSearchParams: URLSearchParams = new URLSearchParams(window.location.search),
    localStorage: Storage = window.localStorage,
    developmentModeOverride?: boolean
  ) {
    this.urlSearchParams = urlSearchParams;
    this.localStorage = localStorage;
    this.developmentModeOverride = developmentModeOverride;
  }

  isTestMode(): boolean {
    // Check URL params first
    if (this.urlSearchParams.get('test') === '1') {
      return true;
    }
    
    // Auto-enable test mode in development environment
    if (this.isDevelopmentMode()) {
      return true;
    }
    
    // Check localStorage for persisted test flag
    try {
      const storedGame = this.localStorage.getItem('lecce-digital-game');
      if (storedGame) {
        const parsed = JSON.parse(storedGame);
        return !!parsed.test;
      }
    } catch (e) {
      // ignore parsing errors
      console.warn('Failed to parse stored game data for test mode check:', e);
    }
    
    return false;
  }

  /**
   * Check if we're running in development mode
   * @private
   */
  private isDevelopmentMode(): boolean {
    // Allow override for testing
    if (this.developmentModeOverride !== undefined) {
      return this.developmentModeOverride;
    }
    
    // Check for development environment indicators
    return (
      // Vite development mode
      import.meta.env?.DEV === true ||
      // Development server ports and hosts
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5000' ||
      window.location.port === '3000' ||
      window.location.port === '5173'
    );
  }
}
