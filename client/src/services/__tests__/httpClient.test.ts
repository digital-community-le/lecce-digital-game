import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchHttpClient, MockHttpClient } from '../implementations/httpClient';

/**
 * Test suite for HTTP Client implementations
 * Focuses on testing header handling, especially Authorization headers
 */
describe('HTTP Client', () => {
  describe('FetchHttpClient', () => {
    let httpClient: FetchHttpClient;
    let fetchMock: any;

    beforeEach(() => {
      httpClient = new FetchHttpClient();

      // Mock global fetch
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });

    describe('Header Handling', () => {
      it('should include Authorization header when provided', async () => {
        // Arrange
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer test-token' };

        // Act
        await httpClient.post(url, data, headers);

        // Assert
        expect(fetchMock).toHaveBeenCalledWith(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          },
          body: JSON.stringify(data)
        });
      });

      it('should include default Content-Type header', async () => {
        // Arrange
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };

        // Act
        await httpClient.post(url, data);

        // Assert
        expect(fetchMock).toHaveBeenCalledWith(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      });

      it('should merge custom headers with default headers', async () => {
        // Arrange
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = {
          Authorization: 'Bearer test-token',
          'X-Custom-Header': 'custom-value'
        };

        // Act
        await httpClient.post(url, data, headers);

        // Assert
        expect(fetchMock).toHaveBeenCalledWith(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
            'X-Custom-Header': 'custom-value'
          },
          body: JSON.stringify(data)
        });
      });

      it('should allow overriding Content-Type header', async () => {
        // Arrange
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

        // Act
        await httpClient.post(url, data, headers);

        // Assert
        expect(fetchMock).toHaveBeenCalledWith(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: JSON.stringify(data)
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error when response is not ok', async () => {
        // Arrange
        const mockResponse = {
          ok: false,
          status: 401,
          text: vi.fn().mockResolvedValue('Unauthorized')
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer invalid-token' };

        // Act & Assert
        await expect(httpClient.post(url, data, headers)).rejects.toThrow(
          'HTTP 401: Unauthorized'
        );
      });

      it('should include authorization header even in failed requests', async () => {
        // Arrange
        const mockResponse = {
          ok: false,
          status: 403,
          text: vi.fn().mockResolvedValue('Forbidden')
        };
        fetchMock.mockResolvedValue(mockResponse);

        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer test-token' };

        // Act
        try {
          await httpClient.post(url, data, headers);
        } catch (error) {
          // Expected to throw
        }

        // Assert
        expect(fetchMock).toHaveBeenCalledWith(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          },
          body: JSON.stringify(data)
        });
      });
    });
  });

  describe('MockHttpClient', () => {
    let mockHttpClient: MockHttpClient;
    let consoleSpy: any;

    beforeEach(() => {
      mockHttpClient = new MockHttpClient();
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    });

    describe('Header Logging', () => {
      it('should log Authorization header when provided', async () => {
        // Arrange
        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer test-token' };
        const mockResponse = { success: true };

        mockHttpClient.setMockResponse(url, mockResponse);

        // Act
        await mockHttpClient.post(url, data, headers);

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('📋 Headers:', headers);
      });

      it('should log undefined when no headers provided', async () => {
        // Arrange
        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const mockResponse = { success: true };

        mockHttpClient.setMockResponse(url, mockResponse);

        // Act
        await mockHttpClient.post(url, data);

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('📋 Headers:', undefined);
      });

      it('should log empty object when empty headers provided', async () => {
        // Arrange
        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = {};
        const mockResponse = { success: true };

        mockHttpClient.setMockResponse(url, mockResponse);

        // Act
        await mockHttpClient.post(url, data, headers);

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('📋 Headers:', {});
      });
    });

    describe('Mock Response Handling', () => {
      it('should throw error when no mock response is configured', async () => {
        // Arrange
        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer test-token' };

        // Act & Assert
        await expect(mockHttpClient.post(url, data, headers)).rejects.toThrow(
          'No mock response configured for URL: https://api.example.com/test'
        );
      });

      it('should return configured mock response', async () => {
        // Arrange
        const url = 'https://api.example.com/test';
        const data = { test: 'data' };
        const headers = { Authorization: 'Bearer test-token' };
        const mockResponse = { id: 1, name: 'Test Badge' };

        mockHttpClient.setMockResponse(url, mockResponse);

        // Act
        const result = await mockHttpClient.post(url, data, headers);

        // Assert
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
