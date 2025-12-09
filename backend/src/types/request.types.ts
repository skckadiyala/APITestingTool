export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'x-www-form-urlencoded' | 'form-data' | 'xml' | 'raw' | 'binary';
export type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

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
  preRequestScript?: string;
  testScript?: string;
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

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TestExecutionResult {
  tests: TestResult[];
  passed: number;
  failed: number;
  totalTime: number;
  consoleOutput: string[];
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
  testResults?: TestExecutionResult;
  executedAt: Date;
}
