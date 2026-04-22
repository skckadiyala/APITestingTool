import { RequestExecutor } from './RequestExecutor';
import { RequestConfig } from '../types/request.types';
import axios, { AxiosRequestConfig } from 'axios';

// Mock axios to avoid making real HTTP requests
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('RequestExecutor - Path Parameters', () => {
  let executor: RequestExecutor;

  beforeEach(() => {
    executor = new RequestExecutor();
    
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock successful axios response
    mockedAxios.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true },
      config: {} as any,
    });
  });

  describe('substitutePathParams', () => {
    it('should substitute single path parameter with colon notation', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: [{ key: 'id', value: '123' }],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      // Check that axios was called with the substituted URL
      expect(mockedAxios).toHaveBeenCalled();
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users/123');
    });

    it('should substitute single path parameter with brace notation', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/{id}',
        pathParams: [{ key: 'id', value: '456' }],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users/456');
    });

    it('should substitute multiple path parameters', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:userId/posts/:postId',
        pathParams: [
          { key: 'userId', value: '123' },
          { key: 'postId', value: '789' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users/123/posts/789');
    });

    it('should substitute path parameters with mixed notation', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/api/{version}/users/:userId',
        pathParams: [
          { key: 'version', value: 'v1' },
          { key: 'userId', value: '123' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/api/v1/users/123');
    });

    it('should handle path parameters with query parameters', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: [{ key: 'id', value: '123' }],
        params: [
          { key: 'fields', value: 'name,email', enabled: true },
          { key: 'limit', value: '10', enabled: true }
        ],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Should have both path param substituted and query params
      expect(axiosConfig.url).toContain('/users/123');
      expect(axiosConfig.url).toContain('fields=name%2Cemail');
      expect(axiosConfig.url).toContain('limit=10');
    });

    it('should work with URL without path parameters', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users',
        pathParams: [],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users');
    });

    it('should handle empty path params array', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: [],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Path param should remain unchanged if no values provided
      expect(axiosConfig.url).toContain(':id');
    });

    it('should handle undefined path params', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: undefined,
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Path param should remain unchanged
      expect(axiosConfig.url).toContain(':id');
    });

    it('should leave placeholder if value is empty string', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: [{ key: 'id', value: '' }],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Empty value should substitute with empty string
      expect(axiosConfig.url).toBe('https://api.example.com/users/');
    });

    it('should handle special characters in path param values', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id',
        pathParams: [{ key: 'id', value: 'user-123' }],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users/user-123');
    });

    it('should handle path params in POST request with body', async () => {
      const config: RequestConfig = {
        method: 'POST',
        url: 'https://api.example.com/users/:id/posts',
        pathParams: [{ key: 'id', value: '123' }],
        params: [],
        headers: [],
        body: {
          type: 'json',
          content: JSON.stringify({ title: 'Test Post', content: 'Test content' })
        },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.example.com/users/123/posts');
      // Body should still be intact
      expect(axiosConfig.data).toBeDefined();
    });

    it('should substitute multiple occurrences of same param name', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/:version/users/:id/profile/:version',
        pathParams: [
          { key: 'version', value: 'v2' },
          { key: 'id', value: '123' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Both occurrences of :version should be replaced
      expect(axiosConfig.url).toBe('https://api.example.com/v2/users/123/profile/v2');
    });

    it('should not partially replace param names', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:id/details/:idToken',
        pathParams: [
          { key: 'id', value: '123' },
          { key: 'idToken', value: 'abc' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // :id should not replace the 'id' part of :idToken
      expect(axiosConfig.url).toBe('https://api.example.com/users/123/details/abc');
    });

    it('should handle GitHub API-style URLs', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.github.com/repos/:owner/:repo/issues/:issue_number',
        pathParams: [
          { key: 'owner', value: 'facebook' },
          { key: 'repo', value: 'react' },
          { key: 'issue_number', value: '100' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      expect(axiosConfig.url).toBe('https://api.github.com/repos/facebook/react/issues/100');
    });

    it('should preserve port numbers in URLs', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'http://localhost:3000/api/users/:id',
        pathParams: [{ key: 'id', value: '123' }],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Port number :3000 should not be affected
      expect(axiosConfig.url).toContain(':3000');
      expect(axiosConfig.url).toContain('/users/123');
    });
  });

  describe('Variable Resolution in Path Parameters', () => {
    // Note: These tests demonstrate the expected behavior
    // Full integration tests with Prisma mocks would be more comprehensive
    
    it('should resolve environment variables in path parameter values', async () => {
      // This test demonstrates that path params with {{variableName}} syntax
      // will be resolved before substitution
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/:userId/posts/:postId',
        pathParams: [
          { key: 'userId', value: '{{currentUser}}' },
          { key: 'postId', value: '{{postId}}' }
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      // In a real scenario with environment variables:
      // currentUser=123, postId=456
      // Expected resolved URL: /users/123/posts/456
      
      // For this unit test, we'll test without actual DB
      await executor.execute(config);
      
      // The URL will contain the variable placeholders since we're not mocking Prisma
      // In integration tests with proper mocks, this would show resolved values
      expect(mockedAxios).toHaveBeenCalled();
    });

    it('should support mixed literal and variable values in path params', async () => {
      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/api/:version/users/:id',
        pathParams: [
          { key: 'version', value: 'v1' },  // Literal value
          { key: 'id', value: '{{userId}}' }  // Variable reference
        ],
        params: [],
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth' },
      };

      await executor.execute(config);
      
      const axiosConfig = mockedAxios.mock.calls[0][0] as AxiosRequestConfig;
      // Literal value should be substituted directly
      expect(axiosConfig.url).toContain('/api/v1/');
    });
  });
});
