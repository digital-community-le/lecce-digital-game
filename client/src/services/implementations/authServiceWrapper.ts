import { IAuthService } from '../interfaces/devfestApi.interfaces';
import { getCurrentJwtToken } from '../authService';

/**
 * Wrapper for authService to implement IAuthService interface
 * Single Responsibility: Provide JWT token for API authentication
 */
export class AuthServiceWrapper implements IAuthService {
  getCurrentJwtToken(): string | null {
    return getCurrentJwtToken();
  }
}
