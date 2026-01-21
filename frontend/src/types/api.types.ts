export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export interface ExecuteResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  body: string;
  size: number;
  time: number;
  testResults?: TestResult[];
  environmentUpdates?: Record<string, string>;
  collectionUpdates?: Record<string, string>;
}
