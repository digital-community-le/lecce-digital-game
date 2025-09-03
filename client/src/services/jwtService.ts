/**
 * JWT Service for token validation and fake token generation
 */

export type JWTValidationResult = {
  valid: boolean;
  decoded?: any;
  error?: string;
};

/**
 * Basic JWT validation - checks structure and optionally decodes payload.
 * For production use, this should validate signature against a public key.
 */
export function validateJWT(token: string): JWTValidationResult {
  if (!token) {
    return { valid: false, error: 'Token is empty' };
  }

  // Basic JWT structure check (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT structure' };
  }

  try {
    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration if present
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, decoded: payload };
  } catch (e) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Generate a fake JWT token for testing purposes.
 * Contains basic payload with user info and long expiration.
 */
export function generateFakeJWT(userId: string = 'test-user'): string {
  const header = {
    typ: 'JWT',
    alg: 'HS256'
  };

  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    test: true
  };

  // Create fake signature (not cryptographically secure)
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signature = btoa(`fake-signature-${Date.now()}`);

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Extract user ID from JWT payload if valid
 */
export function getUserIdFromToken(token: string): string | null {
  const result = validateJWT(token);
  if (!result.valid || !result.decoded) return null;
  return result.decoded.sub || result.decoded.userId || null;
}
