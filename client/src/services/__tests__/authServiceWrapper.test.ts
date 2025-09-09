import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthServiceWrapper } from '../implementations/authServiceWrapper';
import * as authService from '../authService';

// Mock the authService module
vi.mock('../authService', () => ({
  getCurrentJwtToken: vi.fn()
}));

describe('AuthServiceWrapper', () => {
  let authServiceWrapper: AuthServiceWrapper;

  beforeEach(() => {
    authServiceWrapper = new AuthServiceWrapper();
    vi.clearAllMocks();
  });

  describe('getCurrentJwtToken', () => {
    it('should call and return result from authService.getCurrentJwtToken', () => {
      // Arrange
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      vi.mocked(authService.getCurrentJwtToken).mockReturnValue(expectedToken);

      // Act
      const result = authServiceWrapper.getCurrentJwtToken();

      // Assert
      expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(result).toBe(expectedToken);
    });

    it('should return null when authService returns null', () => {
      // Arrange
      vi.mocked(authService.getCurrentJwtToken).mockReturnValue(null);

      // Act
      const result = authServiceWrapper.getCurrentJwtToken();

      // Assert
      expect(authService.getCurrentJwtToken).toHaveBeenCalledOnce();
      expect(result).toBeNull();
    });

    it('should pass through any token value from authService', () => {
      // Arrange
      const testCases = [
        'valid.jwt.token',
        '',
        'invalid-token',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.test'
      ];

      testCases.forEach(testToken => {
        vi.mocked(authService.getCurrentJwtToken).mockReturnValue(testToken);

        // Act
        const result = authServiceWrapper.getCurrentJwtToken();

        // Assert
        expect(result).toBe(testToken);
      });
    });
  });
});
