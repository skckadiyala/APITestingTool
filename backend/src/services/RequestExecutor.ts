import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import https from 'https';
import http from 'http';
import {
  RequestConfig,
  ExecutionResponse,
  ExecutionResult,
  KeyValuePair,
} from '../types/request.types';
import { TestScriptEngine } from './TestScriptEngine';
import { VariableService } from './VariableService';
import GraphQLExecutor from './GraphQLExecutor';
import { prisma } from '../config/prisma';

export class RequestExecutor {
  private testEngine: TestScriptEngine;
  private variableService: VariableService;

  constructor() {
    this.testEngine = new TestScriptEngine();
    this.variableService = new VariableService(prisma);
  }

  /**
   * Execute an HTTP request with the provided configuration
   */
  async execute(config: RequestConfig, environmentId?: string | null, collectionId?: string | null): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Ensure required fields have default values
    config.headers = config.headers || [];
    config.params = config.params || [];
    config.auth = config.auth || { type: 'none' };
    config.body = config.body || { type: 'none' };

    // Get workspace ID from collection or environment
    let workspaceId: string | null = null;
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { workspaceId: true },
      });
      workspaceId = collection?.workspaceId || null;
    } else if (environmentId) {
      const environment = await prisma.environment.findUnique({
        where: { id: environmentId },
        select: { workspaceId: true },
      });
      workspaceId = environment?.workspaceId || null;
    }

    // Get global variables from workspace
    let currentGlobalVariables: Record<string, any> = {};
    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (workspace && workspace.settings) {
        const settings = workspace.settings as any;
        if (settings.globalVariables && Array.isArray(settings.globalVariables)) {
          currentGlobalVariables = settings.globalVariables.reduce((acc: Record<string, any>, v: any) => {
            if (v.enabled !== false) {
              acc[v.key] = v.value;
            }
            return acc;
          }, {});
        }
      }
    }

    // Get current environment variables if environmentId is provided
    let currentEnvVariables: Record<string, any> = {};
    if (environmentId) {
      const environment = await prisma.environment.findUnique({
        where: { id: environmentId },
      });
      if (environment && environment.variables) {
        const variables = environment.variables as any[];
        currentEnvVariables = variables.reduce((acc, v) => {
          if (v.enabled !== false) {
            acc[v.key] = v.value;
          }
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Get current collection variables for test scripts
    let currentCollectionVariables: Record<string, any> = {};
    if (collectionId) {
      let collection = await prisma.collection.findUnique({
        where: { id: collectionId },
      });

      // If it's a folder, find the root collection
      if (collection && collection.type === 'FOLDER' && collection.parentFolderId) {
        let currentId: string | undefined = collection.parentFolderId;
        let rootCollection: any = null;

        while (currentId) {
          const parent: any = await prisma.collection.findUnique({
            where: { id: currentId },
          });

          if (!parent) break;

          if (parent.type === 'COLLECTION') {
            rootCollection = parent;
            break;
          }

          currentId = parent.parentFolderId || undefined;
        }

        if (rootCollection) {
          collection = rootCollection;
        }
      }

      if (collection && (collection as any).variables) {
        const variables = (collection as any).variables as any[];
        currentCollectionVariables = variables.reduce((acc, v) => {
          if (v.enabled !== false) {
            acc[v.key] = v.value;
          }
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Resolve variables from both environment and collection
    if (environmentId || collectionId) {
      config = await this.resolveVariables(config, environmentId, collectionId);
    }

    // Execute pre-request script if provided
    if (config.preRequestScript && config.preRequestScript.trim()) {
      try {
        // Create a temporary result object for pre-request script execution
        const tempResult: ExecutionResult = {
          success: true,
          request: {
            method: config.method,
            url: config.url,
            headers: this.buildHeaders(config.headers, config.auth),
            body: config.body,
          },
          response: undefined,
          executedAt: new Date(),
        };

        const preRequestResults = await this.testEngine.executeTests(
          config.preRequestScript,
          tempResult,
          currentEnvVariables,
          currentCollectionVariables,
          currentGlobalVariables
        );

        // Apply environment variable updates from pre-request script
        if (environmentId && preRequestResults.environmentUpdates) {
          await this.variableService.updateEnvironmentVariables(environmentId, preRequestResults.environmentUpdates);
          // Update current variables for request resolution
          Object.assign(currentEnvVariables, preRequestResults.environmentUpdates);
          // Re-resolve variables with updated environment
          config = await this.resolveVariables(config, environmentId, collectionId);
        }

        // Apply collection variable updates from pre-request script
        if (collectionId && preRequestResults.collectionUpdates) {
          await this.variableService.updateCollectionVariables(collectionId, preRequestResults.collectionUpdates);
          // Update current variables
          Object.assign(currentCollectionVariables, preRequestResults.collectionUpdates);
          // Re-resolve variables with updated collection
          config = await this.resolveVariables(config, environmentId, collectionId);
        }

        // Apply global variable updates from pre-request script
        if (workspaceId && preRequestResults.globalUpdates) {
          await this.variableService.updateGlobalVariables(workspaceId, preRequestResults.globalUpdates);
          // Update current variables
          Object.assign(currentGlobalVariables, preRequestResults.globalUpdates);
          // Re-resolve variables with updated globals
          config = await this.resolveVariables(config, environmentId, collectionId);
        }
      } catch (error: any) {
        console.error('Pre-request script execution failed:', error);
      }
    }

    try {
      let response: AxiosResponse;
      let actualUrl: string;

      // Check if this is a GraphQL request
      if (config.requestType === 'GRAPHQL') {
        // Execute GraphQL request
        actualUrl = config.url;
        const graphqlResult = await GraphQLExecutor.execute(
          config.url,
          config.graphqlQuery || '',
          config.graphqlVariables,
          undefined, // operationName can be extracted from query if needed
          this.buildHeaders(config.headers, config.auth)
        );

        // Convert GraphQL result to Axios-like response format
        response = {
          data: graphqlResult,
          status: graphqlResult.errors ? 400 : 200,
          statusText: graphqlResult.errors ? 'GraphQL Error' : 'OK',
          headers: { 'content-type': 'application/json' },
          config: {} as any,
        } as AxiosResponse;
      } else {
        // Build the request for REST
        const axiosConfig = this.buildAxiosConfig(config);
        actualUrl = axiosConfig.url!; // Store the actual URL with query params

        // Execute the REST request
        response = await axios(axiosConfig);
      }

      const endTime = Date.now();

      // Parse and return the result
      const result = this.buildSuccessResult(config, response, startTime, endTime, actualUrl);

      // Execute test scripts if provided
      if (config.testScript && config.testScript.trim()) {
        try {
          const testResults = await this.testEngine.executeTests(config.testScript, result, currentEnvVariables, currentCollectionVariables, currentGlobalVariables);
          result.testResults = testResults;

          // Persist environment variable updates
          if (environmentId && testResults.environmentUpdates) {
            await this.variableService.updateEnvironmentVariables(environmentId, testResults.environmentUpdates);
          }

          // Persist collection variable updates
          if (collectionId && testResults.collectionUpdates) {
            await this.variableService.updateCollectionVariables(collectionId, testResults.collectionUpdates);
          }

          // Persist global variable updates
          if (workspaceId && testResults.globalUpdates) {
            await this.variableService.updateGlobalVariables(workspaceId, testResults.globalUpdates);
          }
        } catch (error: any) {
          console.error('Test script execution failed:', error);
          result.testResults = {
            tests: [{
              name: 'Test Execution Error',
              passed: false,
              error: error.message,
            }],
            passed: 0,
            failed: 1,
            totalTime: 0,
            consoleOutput: [error.message],
          };
        }
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const axiosConfig = this.buildAxiosConfig(config);
      const actualUrl = axiosConfig.url!;
      const result = this.buildErrorResult(config, error as AxiosError, startTime, endTime, actualUrl);

      // Execute test scripts even on error (to allow tests to check error conditions)
      if (config.testScript && config.testScript.trim()) {
        try {
          const testResults = await this.testEngine.executeTests(config.testScript, result, currentEnvVariables, currentCollectionVariables, currentGlobalVariables);
          result.testResults = testResults;

          // Persist environment variable updates
          if (environmentId && testResults.environmentUpdates) {
            await this.variableService.updateEnvironmentVariables(environmentId, testResults.environmentUpdates);
          }

          // Persist collection variable updates
          if (collectionId && testResults.collectionUpdates) {
            await this.variableService.updateCollectionVariables(collectionId, testResults.collectionUpdates);
          }

          // Persist global variable updates
          if (workspaceId && testResults.globalUpdates) {
            await this.variableService.updateGlobalVariables(workspaceId, testResults.globalUpdates);
          }
        } catch (testError: any) {
          console.error('Test script execution failed:', testError);
        }
      }

      return result;
    }
  }

  /**
   * Build axios configuration from our request config
   */
  private buildAxiosConfig(config: RequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url: this.buildUrl(config.url, config.params),
      headers: this.buildHeaders(config.headers, config.auth),
      timeout: config.timeout || 30000, // 30 seconds default
      maxRedirects: config.maxRedirects ?? 5,
      validateStatus: () => true, // Accept all status codes
      maxContentLength: 50 * 1024 * 1024, // 50MB limit
      maxBodyLength: 50 * 1024 * 1024,
    };

    // Handle redirects
    if (config.followRedirects === false) {
      axiosConfig.maxRedirects = 0;
    }

    // Handle SSL validation
    if (config.validateSSL === false) {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
    }

    // Add body if applicable
    if (config.method !== 'GET' && config.method !== 'HEAD') {
      // Handle GraphQL request body format
      if (config.requestType === 'GRAPHQL') {
        axiosConfig.data = {
          query: config.graphqlQuery,
          variables: config.graphqlVariables || {},
        };
        axiosConfig.headers = axiosConfig.headers || {};
        axiosConfig.headers['Content-Type'] = 'application/json';
      } else {
        // REST request body
        axiosConfig.data = this.buildBody(config.body);

        const hasContentType = axiosConfig.headers &&
          (axiosConfig.headers['Content-Type'] || axiosConfig.headers['content-type']);

        if (!hasContentType) {
          axiosConfig.headers = axiosConfig.headers || {};

          // Set Content-Type based on body type
          if (config.body.type === 'x-www-form-urlencoded') {
            axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          } else if (config.body.type === 'json') {
            axiosConfig.headers['Content-Type'] = 'application/json';
          } else if (config.body.type === 'raw') {
            axiosConfig.headers['Content-Type'] = 'text/plain';
          }
          // form-data will be handled by axios automatically with proper boundaries
        }
      }
    }

    // Keep connection alive for better performance
    axiosConfig.httpAgent = new http.Agent({ keepAlive: true });
    axiosConfig.httpsAgent = axiosConfig.httpsAgent || new https.Agent({ keepAlive: true });

    return axiosConfig;
  }

  /**
   * Build complete URL with query parameters
   */
  private buildUrl(baseUrl: string, params: KeyValuePair[] | undefined): string {
    // Add http:// if no protocol is specified
    let normalizedUrl = baseUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    if (!params) return normalizedUrl;
    const enabledParams = params.filter(p => p.enabled !== false); // Treat missing 'enabled' as true
    if (enabledParams.length === 0) return normalizedUrl;

    // Split URL into base and query string to avoid duplicates
    // The params array is the source of truth for query parameters
    const urlParts = normalizedUrl.split('?');
    const baseUrlOnly = urlParts[0];

    const url = new URL(baseUrlOnly);
    enabledParams.forEach(param => {
      // Only append if the key and value are not empty
      if (param.key && param.key.trim()) {
        url.searchParams.append(param.key, param.value);
      }
    });
    return url.toString();
  }

  /**
   * Build headers including authentication
   */
  private buildHeaders(
    headers: KeyValuePair[] | undefined,
    auth: RequestConfig['auth']
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // Add custom headers
    if (headers) {
      headers
        .filter(h => h.enabled !== false) // Treat missing 'enabled' as true
        .forEach(header => {
          result[header.key] = header.value;
        });
    }

    // Add authentication headers
    switch (auth.type) {
      case 'bearer':
        if (auth.bearer?.token) {
          result['Authorization'] = `Bearer ${auth.bearer.token}`;
        }
        break;

      case 'basic':
        if (auth.basic?.username && auth.basic?.password) {
          const credentials = Buffer.from(
            `${auth.basic.username}:${auth.basic.password}`
          ).toString('base64');
          result['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'apikey':
        if (auth.apikey?.key && auth.apikey?.value && auth.apikey.addTo === 'header') {
          result[auth.apikey.key] = auth.apikey.value;
        }
        break;
    }

    return result;
  }

  /**
   * Build request body based on body type
   */
  private buildBody(body: RequestConfig['body']): any {
    if (body.type === 'none' || !body.content) {
      return undefined;
    }

    switch (body.type) {
      case 'json':
        try {
          return JSON.parse(body.content);
        } catch (error) {
          throw new Error('Invalid JSON in request body');
        }

      case 'x-www-form-urlencoded':
        // Parse the content as key-value pairs and convert to URLSearchParams format
        try {
          const data = typeof body.content === 'string' ? JSON.parse(body.content) : body.content;
          if (Array.isArray(data)) {
            // Convert array of {key, value, enabled} to URLSearchParams format
            const params = new URLSearchParams();
            data.filter((item: any) => item.enabled !== false)
              .forEach((item: any) => {
                params.append(item.key, item.value);
              });
            return params.toString();
          }
          return body.content;
        } catch (error) {
          return body.content;
        }

      case 'xml':
      case 'raw':
        return body.content;

      case 'form-data':
        // For now, return as-is. In a full implementation, 
        // you'd use FormData or multipart handling
        return body.content;

      default:
        return body.content;
    }
  }

  /**
   * Build successful execution result
   */
  private buildSuccessResult(
    config: RequestConfig,
    response: AxiosResponse,
    startTime: number,
    endTime: number,
    actualUrl: string
  ): ExecutionResult {
    const responseTime = endTime - startTime;

    // Extract cookies from Set-Cookie header
    const cookies = this.parseCookies(response.headers['set-cookie']);

    // Calculate sizes
    const bodySize = this.calculateSize(response.data);
    const headersSize = this.calculateHeadersSize(response.headers);

    // Convert headers to Record<string, string>
    const responseHeaders: Record<string, string> = {};
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          responseHeaders[key] = String(value);
        }
      });
    }

    const executionResponse: ExecutionResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: response.data,
      cookies,
      timing: {
        total: responseTime,
      },
      size: {
        body: bodySize,
        headers: headersSize,
        total: bodySize + headersSize,
      },
    };

    return {
      success: true,
      request: {
        method: config.method,
        url: actualUrl,
        headers: this.buildHeaders(config.headers, config.auth),
        body: config.body.type !== 'none' ? this.buildBody(config.body) : undefined,
      },
      response: executionResponse,
      executedAt: new Date(startTime),
    };
  }

  /**
   * Build error execution result
   */
  private buildErrorResult(
    config: RequestConfig,
    error: AxiosError,
    startTime: number,
    endTime: number,
    actualUrl: string
  ): ExecutionResult {
    const responseTime = endTime - startTime;

    // If we got a response (e.g., 4xx, 5xx), include it
    if (error.response) {
      const cookies = this.parseCookies(error.response.headers['set-cookie']);
      const bodySize = this.calculateSize(error.response.data);
      const headersSize = this.calculateHeadersSize(error.response.headers);

      // Convert headers to Record<string, string>
      const errorHeaders: Record<string, string> = {};
      if (error.response.headers) {
        Object.entries(error.response.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            errorHeaders[key] = String(value);
          }
        });
      }

      return {
        success: false,
        request: {
          method: config.method,
          url: config.url,
          headers: this.buildHeaders(config.headers, config.auth),
          body: config.body.type !== 'none' ? this.buildBody(config.body) : undefined,
        },
        response: {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: errorHeaders,
          body: error.response.data,
          cookies,
          timing: { total: responseTime },
          size: {
            body: bodySize,
            headers: headersSize,
            total: bodySize + headersSize,
          },
        },
        error: {
          message: error.message,
          code: error.code,
        },
        executedAt: new Date(startTime),
      };
    }

    // Network error or timeout
    return {
      success: false,
      request: {
        method: config.method,
        url: actualUrl,
        headers: this.buildHeaders(config.headers, config.auth),
        body: config.body.type !== 'none' ? this.buildBody(config.body) : undefined,
      },
      error: {
        message: error.message || 'Request failed',
        code: error.code,
        stack: error.stack,
      },
      executedAt: new Date(startTime),
    };
  }

  /**
   * Parse Set-Cookie header into cookie objects
   */
  private parseCookies(setCookieHeader?: string | string[]): ExecutionResponse['cookies'] {
    if (!setCookieHeader) return [];

    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    return cookies.map(cookie => {
      const parts = cookie.split(';').map(p => p.trim());
      const [nameValue] = parts;
      const [name, value] = nameValue.split('=');

      const result: any = { name, value };

      parts.slice(1).forEach(part => {
        const [key, val] = part.split('=');
        const lowerKey = key.toLowerCase();

        if (lowerKey === 'domain') result.domain = val;
        if (lowerKey === 'path') result.path = val;
        if (lowerKey === 'expires') result.expires = val;
      });

      return result;
    });
  }

  /**
   * Calculate size of response body
   */
  private calculateSize(data: any): number {
    if (!data) return 0;
    if (typeof data === 'string') return Buffer.byteLength(data);
    if (Buffer.isBuffer(data)) return data.length;
    return Buffer.byteLength(JSON.stringify(data));
  }

  /**
   * Calculate size of headers
   */
  private calculateHeadersSize(headers: Record<string, any>): number {
    const headerString = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
    return Buffer.byteLength(headerString);
  }

  /**
   * Resolve environment variables in the request configuration
   * Optimized to fetch each resource only once
   */
  private async resolveVariables(config: RequestConfig, environmentId?: string | null, collectionId?: string | null): Promise<RequestConfig> {
    try {
      // Build variables map with priority: environment > collection > global
      const variablesMap: Record<string, string> = {};

      let workspaceId: string | null = null;
      let environment: any = null;
      let collection: any = null;

      // Fetch environment if provided (single query)
      if (environmentId) {
        environment = await prisma.environment.findUnique({
          where: { id: environmentId },
          select: {
            workspaceId: true,
            variables: true,
          },
        });
        workspaceId = environment?.workspaceId || null;
      }

      // Fetch collection if provided (single query)
      if (collectionId) {
        collection = await prisma.collection.findUnique({
          where: { id: collectionId },
          select: {
            id: true,
            workspaceId: true,
            type: true,
            variables: true,
            parentFolderId: true,
          },
        });

        // Use collection's workspaceId if environment didn't provide one
        if (!workspaceId && collection) {
          workspaceId = collection.workspaceId;
        }

        // If this is a folder, find the root collection (optimized with single query)
        if (collection && collection.type === 'FOLDER' && collection.parentFolderId) {
          // Fetch all parent collections in a single query to avoid N+1
          const allCollections = await prisma.collection.findMany({
            where: {
              workspaceId: collection.workspaceId,
            },
            select: {
              id: true,
              type: true,
              variables: true,
              parentFolderId: true,
            },
          });

          // Build a map for O(1) lookup
          const collectionMap = new Map(allCollections.map(c => [c.id, c]));

          // Traverse up to find root collection
          let currentId: string | undefined = collection.parentFolderId;
          while (currentId) {
            const parent = collectionMap.get(currentId);
            if (!parent) break;

            if (parent.type === 'COLLECTION') {
              collection = parent;
              break;
            }

            currentId = parent.parentFolderId || undefined;
          }
        }
      }

      // Fetch workspace for global variables if we have a workspaceId (single query)
      if (workspaceId) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { settings: true },
        });

        if (workspace && workspace.settings) {
          const settings = workspace.settings as any;
          if (settings.globalVariables && Array.isArray(settings.globalVariables)) {
            settings.globalVariables.forEach((v: any) => {
              if (v.enabled !== false && v.key) {
                variablesMap[v.key] = v.value || '';
              }
            });
          }
        }
      }

      // Add collection variables (medium priority - overrides global vars)
      if (collection && (collection as any).variables) {
        const collectionVars = (collection as any).variables as any[];
        collectionVars.forEach(v => {
          if (v.enabled !== false && v.key) {
            variablesMap[v.key] = v.value || '';
          }
        });
      }

      // Add environment variables (highest priority - overrides collection vars)
      if (environment && environment.variables) {
        const envVars = environment.variables as any[];
        envVars.forEach(v => {
          if (v.enabled !== false && v.key) {
            variablesMap[v.key] = v.value || '';
          }
        });
      }

      // If no variables to resolve, return original config
      if (Object.keys(variablesMap).length === 0) {
        return config;
      }

      // Helper function to replace variables in a string
      const replaceVars = (str: string): string => {
        if (!str) return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
          const trimmedName = varName.trim();
          return variablesMap[trimmedName] !== undefined ? variablesMap[trimmedName] : match;
        });
      };

      // Clone config to avoid modifying the original
      const resolvedConfig = { ...config };

      // Resolve URL
      if (resolvedConfig.url) {
        resolvedConfig.url = replaceVars(resolvedConfig.url);
      }

      // Resolve headers
      if (resolvedConfig.headers) {
        resolvedConfig.headers = resolvedConfig.headers.map(header => ({
          ...header,
          key: replaceVars(header.key),
          value: replaceVars(header.value),
        }));
      }

      // Resolve query params
      if (resolvedConfig.params) {
        resolvedConfig.params = resolvedConfig.params.map(param => ({
          ...param,
          key: replaceVars(param.key),
          value: replaceVars(param.value),
        }));
      }

      // Resolve GraphQL query and variables
      if (resolvedConfig.requestType === 'GRAPHQL') {
        if (resolvedConfig.graphqlQuery) {
          resolvedConfig.graphqlQuery = replaceVars(resolvedConfig.graphqlQuery);
        }
        
        if (resolvedConfig.graphqlVariables) {
          // Convert variables object to string, replace, and parse back
          const varsStr = JSON.stringify(resolvedConfig.graphqlVariables);
          const resolvedVarsStr = replaceVars(varsStr);
          try {
            resolvedConfig.graphqlVariables = JSON.parse(resolvedVarsStr);
          } catch (error) {
            console.error('Error parsing resolved GraphQL variables:', error);
          }
        }
      }

      // Resolve body
      if (resolvedConfig.body) {
        if (resolvedConfig.body.type === 'json' && resolvedConfig.body.content) {
          const bodyStr = typeof resolvedConfig.body.content === 'string'
            ? resolvedConfig.body.content
            : JSON.stringify(resolvedConfig.body.content);

          resolvedConfig.body = {
            ...resolvedConfig.body,
            content: replaceVars(bodyStr),
          };
        } else if (resolvedConfig.body.type === 'raw' && resolvedConfig.body.content) {
          resolvedConfig.body.content = replaceVars(resolvedConfig.body.content as string);
        } else if (resolvedConfig.body.type === 'xml' && resolvedConfig.body.content) {
          resolvedConfig.body.content = replaceVars(resolvedConfig.body.content as string);
        } else if (resolvedConfig.body.type === 'binary' && resolvedConfig.body.content) {
          // Binary content might be a string path or base64, only replace if it's a string
          if (typeof resolvedConfig.body.content === 'string') {
            resolvedConfig.body.content = replaceVars(resolvedConfig.body.content);
          }
        } else if (resolvedConfig.body.type === 'x-www-form-urlencoded') {
          // Handle both array and string content
          let contentArray: any[] = [];
          if (typeof resolvedConfig.body.content === 'string') {
            try {
              contentArray = JSON.parse(resolvedConfig.body.content);
            } catch {
              contentArray = [];
            }
          } else if (Array.isArray(resolvedConfig.body.content)) {
            contentArray = resolvedConfig.body.content;
          }

          if (contentArray.length > 0) {
            resolvedConfig.body.content = contentArray.map((item: any) => ({
              ...item,
              key: replaceVars(item.key),
              value: replaceVars(item.value),
            })) as any;
          }
        } else if (resolvedConfig.body.type === 'form-data') {
          // Handle both array and string content
          let contentArray: any[] = [];
          if (typeof resolvedConfig.body.content === 'string') {
            try {
              contentArray = JSON.parse(resolvedConfig.body.content);
            } catch {
              contentArray = [];
            }
          } else if (Array.isArray(resolvedConfig.body.content)) {
            contentArray = resolvedConfig.body.content;
          }

          if (contentArray.length > 0) {
            resolvedConfig.body.content = contentArray.map((item: any) => ({
              ...item,
              key: replaceVars(item.key),
              value: item.type === 'text' ? replaceVars(item.value) : item.value,
            })) as any;
          }
        }
      }

      return resolvedConfig;
    } catch (error) {
      console.error('Error resolving variables:', error);
      return config; // Return original config if resolution fails
    }
  }
}
