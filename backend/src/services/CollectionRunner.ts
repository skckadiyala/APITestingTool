import { RequestExecutor } from './RequestExecutor';
import { TestScriptEngine } from './TestScriptEngine';
import { VariableService } from './VariableService';
import type { RequestConfig } from '../types/request.types';
import { prisma } from '../config/prisma';

export interface RunOptions {
  environmentId?: string;
  iterations?: number;
  delay?: number;
  stopOnError?: boolean;
  folderId?: string;
  dataFileId?: string;
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
  dataRow?: any;
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
  private testEngine: TestScriptEngine;
  private variableService: VariableService;
  private cancelled: boolean = false;

  constructor() {
    this.executor = new RequestExecutor();
    this.testEngine = new TestScriptEngine();
    this.variableService = new VariableService(prisma);
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
      dataFileId,
    } = options;

    // Get collection
    let collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { workspace: true },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    // If running a folder, find the root collection for pre-request scripts
    let rootCollection = collection;
    if (collection.type === 'FOLDER') {
      let currentId: string | undefined = collection.parentFolderId || undefined;
      
      while (currentId) {
        const parent = await prisma.collection.findUnique({
          where: { id: currentId },
          include: { workspace: true },
        });
        
        if (!parent) break;
        
        if (parent.type === 'COLLECTION') {
          rootCollection = parent;
          break;
        }
        
        currentId = parent.parentFolderId || undefined;
      }
    }

    // Get workspace settings for SSL verification
    const workspaceSettings = (collection.workspace.settings as any) || {};
    const validateSSL = workspaceSettings.validateSSL !== undefined ? workspaceSettings.validateSSL : false;

    // Get all requests to execute
    const requests = await this.getRequestsToRun(collectionId, folderId);

    if (requests.length === 0) {
      throw new Error('No requests found to execute');
    }

    // Load data file if provided
    let dataRows: any[] = [];
    if (dataFileId) {
      const dataFile = await prisma.dataFile.findUnique({
        where: { id: dataFileId },
      });

      if (!dataFile) {
        throw new Error('Data file not found');
      }

      dataRows = dataFile.parsedData as any[];
      
      // Override iterations with data file row count
      if (dataRows.length > 0) {
        options.iterations = dataRows.length;
      }
    }

    const finalIterations = dataFileId && dataRows.length > 0 ? dataRows.length : iterations;

    const result: CollectionRunResult = {
      collectionId,
      collectionName: collection.name,
      startTime,
      totalRequests: requests.length * finalIterations,
      totalPassed: 0,
      totalFailed: 0,
      totalTime: 0,
      iterations: [],
      status: 'running',
    };

    // Run iterations
    for (let i = 0; i < finalIterations; i++) {
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

      // If using data file, add data row to iteration
      if (dataFileId && dataRows.length > 0) {
        iterationResult.dataRow = dataRows[i];
      }

      // Execute collection-level pre-request script before iteration (use rootCollection)
      if (rootCollection.preRequestScript && rootCollection.preRequestScript.trim()) {
        try {
          const tempResult: any = {
            success: true,
            request: { method: 'GET', url: '', headers: {}, body: { type: 'none' } },
            response: undefined,
            executedAt: new Date(),
          };
          
          // Get current environment and collection variables
          let currentEnvVariables: Record<string, any> = {};
          if (environmentId) {
            const environment = await prisma.environment.findUnique({
              where: { id: environmentId },
            });
            if (environment && environment.variables) {
              const variables = environment.variables as any[];
              currentEnvVariables = variables.reduce((acc, v) => {
                if (v.enabled !== false) acc[v.key] = v.value;
                return acc;
              }, {} as Record<string, any>);
            }
          }
          
          let currentCollectionVariables: Record<string, any> = {};
          if (rootCollection.variables) {
            const variables = rootCollection.variables as any[];
            currentCollectionVariables = variables.reduce((acc, v) => {
              if (v.enabled !== false) acc[v.key] = v.value;
              return acc;
            }, {} as Record<string, any>);
          }
          
          let currentGlobalVariables: Record<string, any> = {};
          const workspaceSettings = (rootCollection.workspace.settings as any) || {};
          if (workspaceSettings.globalVariables && Array.isArray(workspaceSettings.globalVariables)) {
            currentGlobalVariables = workspaceSettings.globalVariables.reduce((acc: Record<string, any>, v: any) => {
              if (v.enabled !== false) acc[v.key] = v.value;
              return acc;
            }, {});
          }
          
          const preRequestResults = await this.testEngine.executeTests(
            rootCollection.preRequestScript,
            tempResult,
            currentEnvVariables,
            currentCollectionVariables,
            currentGlobalVariables
          );

          // Persist variable updates immediately so they're available for requests
          if (environmentId && preRequestResults.environmentUpdates) {
            await this.variableService.updateEnvironmentVariables(environmentId, preRequestResults.environmentUpdates);
          }

          if (preRequestResults.collectionUpdates) {
            await this.variableService.updateCollectionVariables(rootCollection.id, preRequestResults.collectionUpdates);
          }

          if (preRequestResults.globalUpdates) {
            await this.variableService.updateGlobalVariables(rootCollection.workspace.id, preRequestResults.globalUpdates);
          }
        } catch (error: any) {
          console.error('Collection pre-request script execution failed:', error);
          console.error('Error details:', error.stack);
        }
      }

      // Execute requests in order
      for (const request of requests) {
        if (this.cancelled) {
          result.status = 'cancelled';
          break;
        }

        const runResult = await this.executeRequest(
          request,
          collectionId,
          environmentId,
          validateSSL,
          iterationResult.dataRow
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
    environmentId: string | undefined,
    validateSSL: boolean,
    dataRow?: any
  ): Promise<RunResult> {
    const startTime = Date.now();

    try {
      // Build request config
      let config: RequestConfig = {
        method: request.method,
        url: request.url,
        headers: request.headers || [],
        params: request.params || [],
        body: request.body || { type: 'none' },
        auth: request.auth || { type: 'none' },
        testScript: request.testScript || '',
        preRequestScript: request.preRequestScript || '',
        validateSSL: validateSSL,
      };

      // If data row is provided, inject variables into config
      if (dataRow) {
        config = this.injectDataRowVariables(config, dataRow);
      }

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
        method: result.request.method,
        url: result.request.url,
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
   * Inject data row variables into request config
   */
  private injectDataRowVariables(config: RequestConfig, dataRow: any): RequestConfig {
    const replaceVariables = (str: string): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (dataRow.hasOwnProperty(key)) {
          return String(dataRow[key]);
        }
        return match; // Keep original if not found in data row
      });
    };

    const replaceInObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return replaceVariables(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(replaceInObject);
      }
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = replaceInObject(obj[key]);
        }
        return result;
      }
      return obj;
    };

    return {
      ...config,
      url: replaceVariables(config.url),
      headers: replaceInObject(config.headers),
      params: replaceInObject(config.params),
      body: replaceInObject(config.body),
    };
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
