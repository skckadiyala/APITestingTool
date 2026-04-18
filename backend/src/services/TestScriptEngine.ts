import { ExecutionResult } from '../types/request.types';
import ivm from 'isolated-vm';

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
  globalUpdates?: Record<string, any>;
}

export class TestScriptEngine {
  /**
   * Execute test scripts in a sandboxed environment using isolated-vm for maximum security
   * Provides true V8 isolation with separate memory space and hardware-enforced timeouts
   */
  async executeTests(
    script: string,
    result: ExecutionResult,
    _currentEnvironmentVariables?: Record<string, any>,
    _currentCollectionVariables?: Record<string, any>,
    _currentGlobalVariables?: Record<string, any>
  ): Promise<TestExecutionResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];
    const consoleOutput: string[] = [];
    const environmentUpdates: Record<string, any> = {};
    const collectionUpdates: Record<string, any> = {};
    const globalUpdates: Record<string, any> = {};

    // Create an isolated VM instance with memory limits (128MB)
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    
    try {
      // Create a context within the isolate
      const context = await isolate.createContext();
      const jail = context.global;
      
      // Set up global object
      await jail.set('global', jail.derefInto());
      
      // Set up console functions using callbacks to main context
      await jail.set('_consoleLog', new ivm.Reference((...args: any[]) => {
        consoleOutput.push(args.map(a => String(a)).join(' '));
      }));
      await jail.set('_consoleError', new ivm.Reference((...args: any[]) => {
        consoleOutput.push('[ERROR] ' + args.map(a => String(a)).join(' '));
      }));
      
      // Set up test function callback
      await jail.set('_addTest', new ivm.Reference((name: string, passed: boolean, error?: string) => {
        tests.push({ name, passed, error });
        if (passed) {
          consoleOutput.push(`✓ ${name}`);
        } else {
          consoleOutput.push(`✗ ${name}`);
          if (error) consoleOutput.push(`  ${error}`);
        }
      }));
      
      // Set up variable management callbacks
      await jail.set('_setEnvVar', new ivm.Reference((key: string, value: any) => {
        environmentUpdates[key] = value;
        consoleOutput.push(`Environment variable '${key}' set to '${value}'`);
      }));
      await jail.set('_setCollectionVar', new ivm.Reference((key: string, value: any) => {
        collectionUpdates[key] = value;
        consoleOutput.push(`Collection variable '${key}' set to '${value}'`);
      }));
      await jail.set('_setGlobalVar', new ivm.Reference((key: string, value: any) => {
        globalUpdates[key] = value;
        consoleOutput.push(`Global variable '${key}' set to '${value}'`);
      }));
      
      // Prepare response data
      const responseData = {
        code: result.response?.status,
        status: result.response?.statusText,
        headers: result.response?.headers || {},
        body: result.response?.body,
        responseTime: result.response?.timing?.total || 0,
        responseSize: result.response?.size?.total || 0,
      };
      
      // Transfer response data to isolated context as JSON string
      await jail.set('_responseData', JSON.stringify(responseData), { copy: true });
      
      // Create pm API bootstrap script that runs in the isolated context
      const bootstrapScript = `
        // Block dangerous functions
        const eval = undefined;
        const Function = undefined;
        
        const console = {
          log: function(...args) { _consoleLog.applySync(undefined, args, { arguments: { copy: true } }); },
          error: function(...args) { _consoleError.applySync(undefined, args, { arguments: { copy: true } }); },
          info: function(...args) { _consoleLog.applySync(undefined, args, { arguments: { copy: true } }); },
          warn: function(...args) { _consoleLog.applySync(undefined, args, { arguments: { copy: true } }); },
        };
        
        const _response = JSON.parse(_responseData);
        
        const pm = {
          response: {
            code: _response.code,
            status: _response.status,
            headers: _response.headers,
            body: _response.body,
            responseTime: _response.responseTime,
            responseSize: _response.responseSize,
            json: function() {
              if (typeof _response.body === 'object') {
                return _response.body;
              }
              try {
                return JSON.parse(_response.body || '{}');
              } catch (e) {
                throw new Error('Response body is not valid JSON');
              }
            },
            text: function() {
              if (typeof _response.body === 'string') {
                return _response.body;
              }
              return JSON.stringify(_response.body || '');
            },
          },
          environment: {
            get: function(key) {
              return undefined; // In tests, we don't have access to current env vars
            },
            set: function(key, value) {
              _setEnvVar.applySync(undefined, [key, value], { arguments: { copy: true } });
            },
            unset: function(key) {
              _setEnvVar.applySync(undefined, [key, undefined], { arguments: { copy: true } });
            },
          },
          collectionVariables: {
            get: function(key) {
              return undefined;
            },
            set: function(key, value) {
              _setCollectionVar.applySync(undefined, [key, value], { arguments: { copy: true } });
            },
            unset: function(key) {
              _setCollectionVar.applySync(undefined, [key, undefined], { arguments: { copy: true } });
            },
          },
          globals: {
            get: function(key) {
              return undefined;
            },
            set: function(key, value) {
              _setGlobalVar.applySync(undefined, [key, value], { arguments: { copy: true } });
            },
            unset: function(key) {
              _setGlobalVar.applySync(undefined, [key, undefined], { arguments: { copy: true } });
            },
          },
          test: function(name, fn) {
            try {
              fn();
              _addTest.applySync(undefined, [name, true], { arguments: { copy: true } });
            } catch (error) {
              _addTest.applySync(undefined, [name, false, error.message], { arguments: { copy: true } });
            }
          },
          expect: function(actual) {
            return {
              to: {
                equal: function(expected) {
                  if (actual !== expected) {
                    throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
                  }
                },
                eql: function(expected) {
                  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
                  }
                },
                include: function(substring) {
                  const actualStr = String(actual);
                  const substringStr = String(substring);
                  if (actualStr.indexOf(substringStr) === -1) {
                    throw new Error('Expected "' + actualStr + '" to include "' + substringStr + '"');
                  }
                },
                contain: function(substring) {
                  const actualStr = String(actual);
                  const substringStr = String(substring);
                  if (actualStr.indexOf(substringStr) === -1) {
                    throw new Error('Expected "' + actualStr + '" to contain "' + substringStr + '"');
                  }
                },
                be: {
                  a: function(type) {
                    const actualType = Array.isArray(actual) ? 'array' : typeof actual;
                    if (actualType !== type) {
                      throw new Error('Expected type ' + type + ' but got ' + actualType);
                    }
                  },
                  an: function(type) {
                    const actualType = Array.isArray(actual) ? 'array' : typeof actual;
                    if (actualType !== type) {
                      throw new Error('Expected type ' + type + ' but got ' + actualType);
                    }
                  },
                  above: function(value) {
                    if (actual <= value) {
                      throw new Error('Expected ' + actual + ' to be above ' + value);
                    }
                  },
                  below: function(value) {
                    if (actual >= value) {
                      throw new Error('Expected ' + actual + ' to be below ' + value);
                    }
                  },
                },
                have: {
                  property: function(prop, value) {
                    if (!actual || typeof actual !== 'object') {
                      throw new Error('Expected an object');
                    }
                    if (!(prop in actual)) {
                      throw new Error('Expected property "' + prop + '" to exist');
                    }
                    if (value !== undefined && actual[prop] !== value) {
                      throw new Error('Expected property "' + prop + '" to be ' + JSON.stringify(value) + ' but got ' + JSON.stringify(actual[prop]));
                    }
                  },
                  length: function(expected) {
                    const actualLength = actual && actual.length;
                    if (actualLength !== expected) {
                      throw new Error('Expected length ' + expected + ' but got ' + actualLength);
                    }
                  },
                },
              },
            };
          },
        };
      `;
      
      // Execute bootstrap script to set up pm API
      await isolate.compileScript(bootstrapScript).then(script => script.run(context));
      
      // Compile and execute the user's test script with 5-second timeout
      const compiledScript = await isolate.compileScript(script);
      await compiledScript.run(context, { timeout: 5000 });
      
    } catch (error: any) {
      // Script execution error (syntax, timeout, or runtime error)
      const errorMessage = error.message || 'Unknown error during script execution';
      
      // Check for specific error types
      if (errorMessage.includes('Script execution timed out') || errorMessage.includes('timeout')) {
        tests.push({
          name: 'Script Execution',
          passed: false,
          error: 'Script execution exceeded 5 second timeout limit',
        });
      } else if (errorMessage.includes('SyntaxError')) {
        tests.push({
          name: 'Script Execution',
          passed: false,
          error: `Syntax error: ${errorMessage}`,
        });
      } else {
        tests.push({
          name: 'Script Execution',
          passed: false,
          error: errorMessage,
        });
      }
    } finally {
      // Always dispose of the isolate to free resources
      isolate.dispose();
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
      globalUpdates: Object.keys(globalUpdates).length > 0 ? globalUpdates : undefined,
    };
  }
}
