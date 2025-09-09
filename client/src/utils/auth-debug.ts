/**
 * Utility functions for debugging authentication issues
 */
import { gameStorage } from '@/lib/storage';
import { validateJWT, generateFakeJWT, getUserIdFromToken } from '@/services/jwtService';
import {
  readUrlAuthParams,
  getCurrentJwtToken,
  getCurrentTokenInfo,
  persistTokenForUser,
  getStoredToken
} from '@/services/authService';

/**
 * Test JWT persistence by simulating different scenarios
 */
export function testJwtPersistence() {
  console.log('🧪 Testing JWT persistence...');

  // Get current state
  const currentState = getCurrentTokenInfo();
  console.log('Current state:', currentState);

  // Get last profile
  const lastProfile = gameStorage.getLastProfile();
  console.log('Last profile:', lastProfile);

  if (lastProfile?.userId) {
    // Check if token exists for this user
    const existingToken = getStoredToken(lastProfile.userId);
    console.log('Existing token for user:', existingToken ? 'exists' : 'missing');

    if (existingToken) {
      const validation = validateJWT(existingToken);
      console.log('Token validation:', validation);
    }
  }

  // Test token generation and persistence
  const testUserId = lastProfile?.userId || 'test-user-' + Date.now();
  const testToken = generateFakeJWT(testUserId);

  console.log('Generated test token:', testToken);

  // Test persistence
  persistTokenForUser(testUserId, testToken);
  console.log('Token persisted for user:', testUserId);

  // Verify persistence
  const retrievedToken = getStoredToken(testUserId);
  console.log('Retrieved token matches:', retrievedToken === testToken);

  return {
    currentState,
    lastProfile,
    testToken,
    persistenceSuccess: retrievedToken === testToken
  };
}

/**
 * Clear all authentication data for debugging
 */
export function clearAuthData() {
  console.log('🧹 Clearing all auth data...');

  const lastProfile = gameStorage.getLastProfile();
  if (lastProfile?.userId) {
    localStorage.removeItem(`ldc:auth:${lastProfile.userId}`);
    console.log('Cleared token for user:', lastProfile.userId);
  }

  // Clear other related data
  localStorage.removeItem('ldc:profile:last');
  console.log('Cleared last profile reference');

  console.log('Auth data cleared. Reload page to test.');
}

/**
 * Simulate URL token reception
 */
export function simulateUrlToken(token?: string) {
  const testToken = token || generateFakeJWT('test-user-' + Date.now());

  // Add token to URL
  const url = new URL(window.location.href);
  url.searchParams.set('t', testToken);

  console.log('🔗 Simulating URL token access:', url.toString());
  console.log('To test, open:', url.toString());

  return testToken;
}

/**
 * Comprehensive auth debugging info
 */
export function debugAuthInfo() {
  console.log('🔍 === AUTH DEBUG INFO ===');

  // URL params
  const urlParams = readUrlAuthParams();
  console.log('URL Params:', urlParams);

  // Current JWT
  const currentJwt = getCurrentJwtToken();
  console.log('Current JWT:', currentJwt ? 'present' : 'missing');

  if (currentJwt) {
    const validation = validateJWT(currentJwt);
    console.log('JWT Validation:', validation);

    if (validation.valid && validation.decoded) {
      console.log('JWT Payload:', validation.decoded);
      const userId = getUserIdFromToken(currentJwt);
      console.log('User ID from token:', userId);
    }
  }

  // Token info
  const tokenInfo = getCurrentTokenInfo();
  console.log('Token Info:', tokenInfo);

  // Last profile
  const lastProfile = gameStorage.getLastProfile();
  console.log('Last Profile:', lastProfile);

  if (lastProfile?.userId) {
    const storedToken = getStoredToken(lastProfile.userId);
    console.log('Stored Token for user:', storedToken ? 'exists' : 'missing');
  }

  // Storage keys
  console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('ldc:')));

  console.log('=== END DEBUG INFO ===');
}

// Make functions available globally in development
if (import.meta.env.DEV) {
  (window as any).authDebug = {
    test: testJwtPersistence,
    clear: clearAuthData,
    simulate: simulateUrlToken,
    info: debugAuthInfo
  };

  console.log('🛠️ Auth debug tools available at window.authDebug');
  console.log('- window.authDebug.test() - Test persistence');
  console.log('- window.authDebug.clear() - Clear auth data');
  console.log('- window.authDebug.simulate() - Simulate URL token');
  console.log('- window.authDebug.info() - Show debug info');
}
