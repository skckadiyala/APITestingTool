import { PrismaClient } from '@prisma/client';
import { RequestExecutor } from './RequestExecutor';
import type { RequestConfig } from '../types/request.types';

const prisma = new PrismaClient();

export interface RunOptions {
  environmentId?: string;
  iterations?: number;
  delay?: number;
  stopOnError?: boolean;
  folderId?: string;
}

export interface RunResult {
  requestId: string;
  requestName: string;
  method: string;
  url: string;
  status: 'passed' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  testResults?: {
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string }>;
  };
  error?: string;
  timestamp: Date;
}

export interface IterationResult {
  iteration: number;
  results: RunResult[];
  passed: number;
  failed: number;
  totalTime: number;
}

export interface CollectionRunResult {
  collectionId: string;
  collectionName: string;
  startTime: Date;
  endTime?: Date;
  totalRequests: number;
  totalPassed: number;
  totalFailed: number;
  totalTime: number;
  iterations: IterationResult[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

export class CollectionRunner {
  private executor: RequestExecutor;
  private cancelled: boolean = false;

  constructor() {
    this.executor = new RequestExecutor();
  }

  /**
   * Run a collection or folder
   */
  async run(
    collectionId: string,
    options: RunOptions = {}
  ): Promise<CollectionRunResult> {
    const startTime = new Date();
    this.cancelled = false;

    const {
      environmentId,
      iterations = 1,
      delay = 0,
      stopOnError = false,
      folderId,
    } = options;

    // Get collection
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Get all requests to execute
    const requests = await this.getRequestsToRun(collectionId, folderId);

    if (requests.length === 0) {
      throw new Error('No requests found to execute');
    }

    const result: CollectionRunResult = {
      collectionId,
      collectionName: collection.name,
      startTime,
      totalRequests: requests.length * iterations,
      totalPassed: 0,
      totalFailed: 0,
      totalTime: 0,
      iterations: [],
      status: 'running',
    };

    // Run iterations
    for (let i = 0; i < iterations; i++) {
      if (this.cancelled) {
        result.status = 'cancelled';
        break;
      }

      const iterationStart = Date.now();
      const iterationResult: IterationResult = {
        iteration: i + 1,
        results: [],
        passed: 0,
        failed: 0,
        totalTime: 0,
      };

      // Execute requests in order
      for (const request of requests) {
        if (this.cancelled) {
          result.status = 'cancelled';
          break;
        }

        const runResult = await this.executeRequest(
          request,
          collectionId,
          environmentId
        );

        iterationResult.results.push(runResult);

        if (runResult.status === 'passed') {
          iterationResult.passed++;
          result.totalPassed++;
        } else {
          iterationResult.failed++;
          result.totalFailed++;

          if (stopOnError) {
            result.status = 'failed';
            break;
          }
        }

        // Add delay between requests
        if (delay > 0 && requests.indexOf(request) < requests.length - 1) {
          await this.sleep(delay);
        }
      }

      iterationResult.totalTime = Date.now() - iterationStart;
      result.totalTime += iterationResult.totalTime;
      result.iterations.push(iterationResult);

      if (result.status === 'failed' || result.status === 'cancelled') {
        break;
      }
    }

    result.endTime = new Date();
    if (result.status === 'running') {
      result.status = 'completed';
    }

    return result;
  }

  /**
   * Get all requests in a collection or folder (recursively)
   */
  private async getRequestsToRun(
    collectionId: string,
    folderId?: string
  ): Promise<any[]> {
    const targetId = folderId || collectionId;

    // Get the target collection/folder
    const target = await prisma.collection.findUnique({
      where: { id: targetId },
      include: {
        requests: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!target) {
      return [];
    }

    let allRequests = target.requests || [];

    // Get child folders recursively
    const childFolders = await prisma.collection.findMany({
      where: { parentFolderId: targetId },
      orderBy: { orderIndex: 'asc' },
    });

    for (const folder of childFolders) {
      const folderRequests = await this.getRequestsToRun(collectionId, folder.id);
      allRequests = [...allRequests, ...folderRequests];
    }

    return allRequests;
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    request: any,
    collectionId: string,
    environmentId?: string
  ): Promise<RunResult> {
    const startTime = Date.now();

    try {
      // Build request config
      const config: RequestConfig = {
        method: request.method,
        url: request.url,
        headers: request.headers || [],
        params: request.params || [],
        body: request.body || { type: 'none' },
        auth: request.auth || { type: 'none' },
        testScript: request.testScript || '',
        preRequestScript: request.preRequestScript || '',
      };

      // Execute the request
      const result = await this.executor.execute(
        config,
        environmentId,
        collectionId
      );

      const responseTime = Date.now() - startTime;

      // Determine status based on test results
      let status: 'passed' | 'failed' = 'passed';
      if (result.testResults) {
        status = result.testResults.failed > 0 ? 'failed' : 'passed';
      } else if (result.response?.status && result.response.status >= 400) {
        status = 'failed';
      }

      return {
        requestId: request.id,
        requestName: request.name,
        method: request.method,
        url: request.url,
        status,
        statusCode: result.response?.status,
        responseTime,
        testResults: result.testResults
          ? {
              passed: result.testResults.passed,
              failed: result.testResults.failed,
              tests: result.testResults.tests,
            }
          : undefined,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error(`[CollectionRunner] Request failed: ${request.name}`, {
        url: request.url,
        method: request.method,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
      
      return {
        requestId: request.id,
        requestName: request.name,
        method: request.method,
        url: request.url,
        status: 'failed',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel the current run
   */
  cancel(): void {
    this.cancelled = true;
  }
}
