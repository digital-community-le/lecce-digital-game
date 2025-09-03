import { ITestModeChecker } from '../interfaces/devfestApi.interfaces';

/**
 * Test mode checker implementation
 * Single Responsibility: Only checks for test mode
 */
export class TestModeChecker implements ITestModeChecker {
  private readonly urlSearchParams: URLSearchParams;
  private readonly localStorage: Storage;

  constructor(
    urlSearchParams: URLSearchParams = new URLSearchParams(window.location.search),
    localStorage: Storage = window.localStorage
  ) {
    this.urlSearchParams = urlSearchParams;
    this.localStorage = localStorage;
  }

  isTestMode(): boolean {
    // Check URL params first
    if (this.urlSearchParams.get('test') === '1') {
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
}
