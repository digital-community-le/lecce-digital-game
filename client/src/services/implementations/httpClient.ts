import { IHttpClient, DevFestBadgeResponse } from '../interfaces/devfestApi.interfaces';

/**
 * Fetch-based HTTP client implementation
 * Single Responsibility: Handle HTTP requests
 */
export class FetchHttpClient implements IHttpClient {
  async post<TRequest, TResponse>(
    url: string,
    data: TRequest,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }
}

/**
 * Mock HTTP client for testing
 * Dependency Inversion: Same interface, different implementation
 */
export class MockHttpClient implements IHttpClient {
  private mockResponses: Map<string, any> = new Map();

  setMockResponse<TResponse>(url: string, response: TResponse): void {
    this.mockResponses.set(url, response);
  }

  async post<TRequest, TResponse>(
    url: string,
    data: TRequest,
    headers?: Record<string, string>
  ): Promise<TResponse> {
    console.log('🧪 MOCK HTTP CLIENT - POST Request:');
    console.log('📍 URL:', url);
    console.log('📋 Headers:', headers);
    console.log('📦 Payload:', JSON.stringify(data, null, 2));

    const mockResponse = this.mockResponses.get(url);
    if (!mockResponse) {
      throw new Error(`No mock response configured for URL: ${url}`);
    }

    console.log('✅ MOCK Response:', mockResponse);
    return Promise.resolve(mockResponse);
  }
}
