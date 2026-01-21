import type { TestResult, ExecuteResponse } from './api.types';

export type DataFileFormat = 'csv' | 'json';

export interface DataFileRow {
  [key: string]: string | number | boolean | null;
}

export interface DataFile {
  id: string;
  name: string;
  format: DataFileFormat;
  preview: DataFileRow[];
  size?: number;
  uploadedAt?: string;
}

export interface RunnerState {
  isRunning: boolean;
  hasResults: boolean;
  runResults: RunnerResults | null;
  selectedIteration: number;
  selectedRequest: RequestResult | null;
  statusFilter: 'all' | 'passed' | 'failed';
}

export interface RunnerResults {
  collectionId: string;
  collectionName: string;
  totalRequests: number;
  passedRequests: number;
  totalPassed: number; // Alias for backward compatibility
  failedRequests: number;
  totalFailed: number; // Alias for backward compatibility
  totalDuration: number;
  totalTime: number; // Alias for backward compatibility
  iterations: IterationResult[];
  dataFile?: {
    format: DataFileFormat;
    rows: DataFileRow[];
  };
  startedAt: string;
  startTime: Date | string; // Alias for backward compatibility
  completedAt: string;
  endTime?: Date | string; // Alias for backward compatibility
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface IterationResult {
  iterationIndex: number;
  iteration: number; // Alias for backward compatibility
  dataRow?: DataFileRow;
  requests: RequestResult[];
  results: RequestResult[]; // Alias for backward compatibility
  duration: number;
  totalTime: number; // Alias for backward compatibility
  passed: boolean | number; // Can be boolean or count
  failed?: number;
}

export interface RequestResult {
  requestId: string;
  requestName: string; // Primary field
  name: string; // Alias for backward compatibility
  method: string;
  url: string;
  status: 'passed' | 'failed' | 'skipped';
  statusCode?: number;
  response: ExecuteResponse;
  responseTime?: number; // Backward compatibility
  testResults: TestResult[] | {
    passed: number;
    failed: number;
    tests: TestResult[];
  };
  duration: number;
  error?: string;
}
