import { ExecutionResult } from '../types/request.types';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

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
  environmentUpdates?: Record<string, any>;
  collectionUpdates?: Record<string, any>;
}

export class TestScriptEngine {
  /**
   * Execute test scripts in a sandboxed environment
   */
  async executeTests(
    script: string,
    result: ExecutionResult,
    currentEnvironmentVariables?: Record<string, any>,
    currentCollectionVariables?: Record<string, any>
  ): Promise<TestExecutionResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];
    const consoleOutput: string[] = [];
    const environmentUpdates: Record<string, any> = {};
    const collectionUpdates: Record<string, any> = {};

    try {
      // Create a sandboxed environment with pm API
      const pm = this.createPmAPI(result, tests, consoleOutput, environmentUpdates, collectionUpdates, currentEnvironmentVariables || {}, currentCollectionVariables || {});

      // Create a safe function execution context
      const scriptFunction = new Function('pm', 'console', script);
      
      // Execute the test script
      scriptFunction(pm, this.createConsole(consoleOutput));

    } catch (error: any) {
      // Script execution error
      tests.push({
        name: 'Script Execution',
        passed: false,
        error: error.message,
      });
    }

    const endTime = Date.now();
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    return {
      tests,
      passed,
      failed,
      totalTime: endTime - startTime,
      consoleOutput,
      environmentUpdates: Object.keys(environmentUpdates).length > 0 ? environmentUpdates : undefined,
      collectionUpdates: Object.keys(collectionUpdates).length > 0 ? collectionUpdates : undefined,
    };
  }

  /**
   * Create pm API object (Postman-like API)
   */
  private createPmAPI(
    result: ExecutionResult,
    tests: TestResult[],
    consoleOutput: string[],
    environmentUpdates: Record<string, any>,
    collectionUpdates: Record<string, any>,
    currentEnvironmentVariables: Record<string, any>,
    currentCollectionVariables: Record<string, any>
  ) {
    const response = result.response;

    return {
      // Response object
      response: {
        code: response?.status,
        status: response?.statusText,
        headers: response?.headers || {},
        body: response?.body,
        responseTime: response?.timing?.total || 0,
        responseSize: response?.size?.total || 0,

        // Helper methods
        json: () => {
          if (typeof response?.body === 'object') {
            return response.body;
          }
          try {
            return JSON.parse(response?.body as string || '{}');
          } catch (error) {
            throw new Error('Response body is not valid JSON');
          }
        },

        text: () => {
          if (typeof response?.body === 'string') {
            return response.body;
          }
          return JSON.stringify(response?.body || '');
        },

        to: {
          have: {
            status: (expectedStatus: number) => {
              const actual = response?.status;
              if (actual !== expectedStatus) {
                throw new Error(
                  `Expected status ${expectedStatus} but got ${actual}`
                );
              }
            },
            header: (headerName: string, expectedValue?: string) => {
              const headers = response?.headers || {};
              const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
              
              if (!headerValue) {
                throw new Error(`Header '${headerName}' not found in response`);
              }
              
              if (expectedValue !== undefined && headerValue !== expectedValue) {
                throw new Error(
                  `Expected header '${headerName}' to be '${expectedValue}' but got '${headerValue}'`
                );
              }
            },
            jsonSchema: (schema: any) => {
              const validate = ajv.compile(schema);
              const data = typeof response?.body === 'object' 
                ? response.body 
                : JSON.parse(response?.body as string || '{}');
              
              const valid = validate(data);
              
              if (!valid) {
                const errors = validate.errors?.map(err => 
                  `${err.instancePath || '/'} ${err.message}`
                ).join(', ');
                throw new Error(`JSON schema validation failed: ${errors}`);
              }
            },
          },
        },
      },

      // Request object
      request: {
        method: result.request?.method,
        url: result.request?.url,
        headers: result.request?.headers || {},
        body: result.request?.body,
      },

      // Test function
      test: (name: string, fn: () => void) => {
        try {
          fn();
          tests.push({ name, passed: true });
          consoleOutput.push(`✓ ${name}`);
        } catch (error: any) {
          tests.push({ name, passed: false, error: error.message });
          consoleOutput.push(`✗ ${name}`);
          consoleOutput.push(`  ${error.message}`);
        }
      },

      // Expect function (Chai-like assertions)
      expect: (actual: any) => ({
        to: {
          equal: (expected: any) => {
            if (actual !== expected) {
              throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
            }
          },
          eql: (expected: any) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
            }
          },
          be: {
            a: (type: string) => {
              const actualType = Array.isArray(actual) ? 'array' : typeof actual;
              if (actualType !== type) {
                throw new Error(`Expected type ${type} but got ${actualType}`);
              }
            },
            an: (type: string) => {
              const actualType = Array.isArray(actual) ? 'array' : typeof actual;
              if (actualType !== type) {
                throw new Error(`Expected type ${type} but got ${actualType}`);
              }
            },
            below: (value: number) => {
              if (actual >= value) {
                throw new Error(`Expected ${actual} to be below ${value}`);
              }
            },
            above: (value: number) => {
              if (actual <= value) {
                throw new Error(`Expected ${actual} to be above ${value}`);
              }
            },
            true: () => {
              if (actual !== true) {
                throw new Error(`Expected true but got ${actual}`);
              }
            },
            false: () => {
              if (actual !== false) {
                throw new Error(`Expected false but got ${actual}`);
              }
            },
          },
          have: {
            property: (prop: string, value?: any) => {
              if (!actual || typeof actual !== 'object') {
                throw new Error('Expected an object');
              }
              if (!(prop in actual)) {
                throw new Error(`Expected property '${prop}' to exist`);
              }
              if (value !== undefined && actual[prop] !== value) {
                throw new Error(
                  `Expected property '${prop}' to be ${JSON.stringify(value)} but got ${JSON.stringify(actual[prop])}`
                );
              }
            },
            length: (expected: number) => {
              const actualLength = actual?.length;
              if (actualLength !== expected) {
                throw new Error(`Expected length ${expected} but got ${actualLength}`);
              }
            },
          },
        },
      }),

      // Environment variables
      environment: {
        get: (key: string) => {
          // Check if already updated in this session
          if (key in environmentUpdates) {
            return environmentUpdates[key];
          }
          // Otherwise return current value
          return currentEnvironmentVariables[key];
        },
        set: (key: string, value: any) => {
          environmentUpdates[key] = value;
          consoleOutput.push(`Environment variable '${key}' set to '${value}'`);
        },
        unset: (key: string) => {
          environmentUpdates[key] = undefined;
          consoleOutput.push(`Environment variable '${key}' unset`);
        },
      },

      // Collection variables
      collectionVariables: {
        get: (key: string) => {
          // Check if there's a pending update first
          if (key in collectionUpdates) {
            return collectionUpdates[key];
          }
          // Otherwise return current value
          return currentCollectionVariables[key];
        },
        set: (key: string, value: any) => {
          collectionUpdates[key] = value;
          consoleOutput.push(`Collection variable '${key}' set to '${value}'`);
        },
        unset: (key: string) => {
          collectionUpdates[key] = undefined;
          consoleOutput.push(`Collection variable '${key}' unset`);
        },
      },

      // Global variables (placeholder)
      globals: {
        get: (_key: string) => undefined,
        set: (key: string, _value: any) => {
          consoleOutput.push(`Global variable '${key}' set (not persisted yet)`);
        },
      },
    };
  }

  /**
   * Create safe console object that captures output
   */
  private createConsole(consoleOutput: string[]) {
    return {
      log: (...args: any[]) => {
        consoleOutput.push(args.map(a => String(a)).join(' '));
      },
      info: (...args: any[]) => {
        consoleOutput.push('[INFO] ' + args.map(a => String(a)).join(' '));
      },
      warn: (...args: any[]) => {
        consoleOutput.push('[WARN] ' + args.map(a => String(a)).join(' '));
      },
      error: (...args: any[]) => {
        consoleOutput.push('[ERROR] ' + args.map(a => String(a)).join(' '));
      },
    };
  }
}
