import apiClient from './api';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  type?: 'secret' | 'default';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'form-data' | 'xml' | 'raw' | 'binary';
export type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'none';

export interface AuthConfig {
  type: AuthType;
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apikey?: {
    key: string;
    value: string;
    addTo: 'header' | 'query';
  };
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: {
    type: BodyType;
    content: string;
  };
  auth: AuthConfig;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  validateSSL?: boolean;
  testScript?: string;
  preRequestScript?: string;
}

export interface ExecutionResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  cookies: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
  }>;
  timing: {
    total: number;
    dns?: number;
    tcp?: number;
    tls?: number;
    firstByte?: number;
    download?: number;
  };
  size: {
    body: number;
    headers: number;
    total: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: ExecutionResponse;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  testResults?: {
    tests: Array<{
      name: string;
      passed: boolean;
      error?: string;
    }>;
    passed: number;
    failed: number;
    totalTime: number;
    consoleOutput: string[];
    environmentUpdates?: Record<string, any>;
    collectionUpdates?: Record<string, any>;
  };
  executedAt: string;
  historyId?: string;
}

export interface HistoryEntry {
  id: string;
  requestId: string | null;
  userId: string;
  requestBodyId: string;
  responseBodyId: string | null;
  statusCode: number | null;
  responseTime: number | null;
  executedAt: string;
  request?: {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
  };
}

export interface HistoryResponse {
  history: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

class RequestService {
  /**
   * Execute an HTTP request
   */
  async execute(config: RequestConfig, _userId?: string, requestId?: string, environmentId?: string | null, collectionId?: string | null): Promise<ExecutionResult> {
    try {
      const response = await apiClient.post<ExecutionResult>('/requests/execute', {
        ...config,
        requestId,
        environmentId,
        collectionId,
      });

      return response.data;
    } catch (error: any) {
      // If axios error, the backend returned an error response
      if (error.response?.data) {
        return error.response.data;
      }

      // Network or other error
      throw new Error(error.message || 'Failed to execute request');
    }
  }

  /**
   * Get request history
   */
  async getHistory(options: {
    userId?: string;
    limit?: number;
    offset?: number;
    requestId?: string;
    statusCode?: number;
  } = {}): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.requestId) params.append('requestId', options.requestId);
    if (options.statusCode) params.append('statusCode', options.statusCode.toString());

    const response = await apiClient.get<HistoryResponse>(`/requests/history?${params.toString()}`);
    return response.data;
  }

  /**
   * Get history entry detail
   */
  async getHistoryDetail(historyId: string, _userId?: string) {
    const response = await apiClient.get(`/requests/history/${historyId}`);
    return response.data;
  }

  /**
   * Delete history entry
   */
  async deleteHistory(historyId: string, userId?: string) {
    const params = new URLSearchParams();
    params.append('userId', userId || 'demo-user');

    const response = await apiClient.delete(`/requests/history/${historyId}?${params.toString()}`);
    return response.data;
  }

  /**
   * Clear all history
   */
  async clearHistory(userId?: string) {
    const params = new URLSearchParams();
    params.append('userId', userId || 'demo-user');

    const response = await apiClient.delete(`/requests/history?${params.toString()}`);
    return response.data;
  }
}

export const requestService = new RequestService();
