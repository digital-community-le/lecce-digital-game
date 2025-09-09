import { gameStorage } from '@/lib/storage';
import { validateJWT, generateFakeJWT, getUserIdFromToken } from './jwtService';

export type UrlAuthParams = { token?: string; test?: boolean };

export type AuthResult = {
  success: boolean;
  token: string | null;
  error: string | null;
  isTestMode: boolean;
  tokenSource?: 'local' | 'url' | 'generated';
};

/**
 * Read auth-related params from the current window location.
 * Supports short param `t` and optional `test` (0/1).
 */
export function readUrlAuthParams(): UrlAuthParams {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('t') || urlParams.get('token') || undefined;
  const testRaw = urlParams.get('test');
  const test = testRaw === '1';
  return { token, test };
}

/** Persist token for a user into the local storage. */
export function persistTokenForUser(userId: string, token: string): void {
  if (!userId || !token) return;
  gameStorage.saveAuthToken(userId, token);
}

/** Get stored token for a user, or null. */
export function getStoredToken(userId: string): string | null {
  return gameStorage.getAuthToken(userId);
}

/** Get current token info for debugging/logging. */
export function getCurrentTokenInfo(): { hasLocal: boolean; localValid: boolean; userId: string | null } {
  const lastProfile = gameStorage.getLastProfile();
  if (!lastProfile?.userId) {
    return { hasLocal: false, localValid: false, userId: null };
  }

  const localToken = getStoredToken(lastProfile.userId);
  if (!localToken) {
    return { hasLocal: false, localValid: false, userId: lastProfile.userId };
  }

  const validation = validateJWT(localToken);
  return {
    hasLocal: true,
    localValid: validation.valid,
    userId: lastProfile.userId
  };
}

/**
 * Initialize auth from URL params and validate/generate token as needed.
 * Returns auth result with validation status.
 * 
 * Priority logic for external platform integration:
 * 1. If URL token present, always use it (it's the current session from calling platform)
 * 2. If no URL token, fallback to local token (prevents accidental loss)
 * 3. If no valid token and test mode, generate fake token
 * 4. If no valid token and production mode, show error
 */
export function initAuthFromUrl(): AuthResult & { test?: boolean } {
  const params = readUrlAuthParams();
  const isTestMode = !!params.test;

  let token = params.token;
  let error: string | null = null;
  let tokenSource: 'local' | 'url' | 'generated' = 'url';

  // If URL token is present, always prefer it (external platform session)
  if (token) {
    const validation = validateJWT(token);
    if (!validation.valid) {
      return {
        success: false,
        token: null,
        error: validation.error || 'Token non valido',
        isTestMode,
        tokenSource: 'url',
        test: params.test
      };
    }

    // Persist valid URL token
    const userId = getUserIdFromToken(token);
    if (userId) {
      persistTokenForUser(userId, token);
    } else {
      // Fallback: use last profile to persist token
      const lastProfile = gameStorage.getLastProfile();
      if (lastProfile?.userId) {
        persistTokenForUser(lastProfile.userId, token);
      }
    }

    tokenSource = 'url';
  } else {
    // No URL token, check for valid local token as fallback
    const lastProfile = gameStorage.getLastProfile();
    if (lastProfile?.userId) {
      const localToken = getStoredToken(lastProfile.userId);
      if (localToken) {
        const localValidation = validateJWT(localToken);
        if (localValidation.valid) {
          token = localToken;
          tokenSource = 'local';
        }
      }
    }

    // If still no valid token and test mode, generate fake
    if (!token && isTestMode) {
      token = generateFakeJWT('test-user-' + Date.now());
      tokenSource = 'generated';
    }
  }

  // If not test mode and no token, it's an error
  if (!isTestMode && !token) {
    return {
      success: false,
      token: null,
      error: 'Token di accesso richiesto ma non fornito',
      isTestMode,
      tokenSource,
      test: params.test
    };
  }

  return {
    success: true,
    token: token || null,
    error: null,
    isTestMode,
    tokenSource,
    test: params.test
  };
}

/**
 * Get the current JWT token from URL or local storage
 * Returns the token that should be used for API calls
 */
export function getCurrentJwtToken(): string | null {
  const params = readUrlAuthParams();

  // Priority 1: URL token (external platform session)
  if (params.token) {
    const validation = validateJWT(params.token);
    if (validation.valid) {
      return params.token;
    }
  }

  // Priority 2: Local stored token (fallback)
  const lastProfile = gameStorage.getLastProfile();
  if (lastProfile?.userId) {
    const localToken = getStoredToken(lastProfile.userId);
    if (localToken) {
      const validation = validateJWT(localToken);
      if (validation.valid) {
        return localToken;
      }
    }
  }

  return null;
}
