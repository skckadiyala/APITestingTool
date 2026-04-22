import { TestScriptEngine } from '../TestScriptEngine';
import { ExecutionResult } from '../../types/request.types';

describe('TestScriptEngine - Security Tests', () => {
  let engine: TestScriptEngine;
  let mockResult: ExecutionResult;

  beforeEach(() => {
    engine = new TestScriptEngine();
    mockResult = {
      success: true,
      request: {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
      },
      response: {
        status: 200,
        statusText: 'OK',
        headers: {},
        body: { message: 'Test response' },
        timing: { total: 100 },
        size: { body: 30, headers: 20, total: 50 },
        cookies: [],
      },
      executedAt: new Date(),
    };
  });

  describe('Sandbox Security', () => {
    it('should prevent access to Node.js process object', async () => {
      const maliciousScript = `
        pm.test('Try to access process', () => {
          const env = process.env;
          pm.expect(env).to.be.an('object');
        });
      `;

      const result = await engine.executeTests(maliciousScript, mockResult);

      // Should fail because process is not accessible in sandbox
      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
      expect(result.tests[0].error).toContain('process is not defined');
    });

    it('should prevent access to require()', async () => {
      const maliciousScript = `
        pm.test('Try to use require', () => {
          const fs = require('fs');
          pm.expect(fs).to.be.an('object');
        });
      `;

      const result = await engine.executeTests(maliciousScript, mockResult);

      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
      expect(result.tests[0].error).toContain('require is not defined');
    });

    it('should prevent filesystem access', async () => {
      const maliciousScript = `
        pm.test('Try to access filesystem', () => {
          const fs = global.require('fs');
          const data = fs.readFileSync('/etc/passwd', 'utf8');
          pm.expect(data).to.be.a('string');
        });
      `;

      const result = await engine.executeTests(maliciousScript, mockResult);

      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
    });

    it('should prevent access to dangerous global properties', async () => {
      const maliciousScript = `
        pm.test('Try to access dangerous globals', () => {
          // These should not be accessible
          pm.expect(typeof process).to.equal('undefined');
          pm.expect(typeof require).to.equal('undefined');
        });
      `;

      const result = await engine.executeTests(maliciousScript, mockResult);

      // Should pass because dangerous globals are not accessible
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should prevent eval() execution', async () => {
      const maliciousScript = `
        pm.test('Try to use eval', () => {
          const result = eval('2 + 2');
          pm.expect(result).to.equal(4);
        });
      `;

      const result = await engine.executeTests(maliciousScript, mockResult);

      // eval is disabled in vm2 configuration
      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
    });

    it('should enforce 5 second timeout', async () => {
      const infiniteLoopScript = `
        pm.test('Infinite loop', () => {
          while(true) {
            // This will timeout
          }
        });
      `;

      const result = await engine.executeTests(infiniteLoopScript, mockResult);

      expect(result.failed).toBe(1);
      expect(result.tests[0].error).toContain('timeout');
    }, 10000); // Allow 10 seconds for test to complete

    it('should allow legitimate test scripts', async () => {
      const legitimateScript = `
        pm.test('Status code is 200', () => {
          pm.expect(pm.response.code).to.equal(200);
        });

        pm.test('Response has message', () => {
          const json = pm.response.json();
          pm.expect(json).to.have.property('message');
          pm.expect(json.message).to.equal('Test response');
        });

        pm.environment.set('testVar', 'testValue');
        console.log('Test completed successfully');
      `;

      const result = await engine.executeTests(legitimateScript, mockResult);

      expect(result.passed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.consoleOutput).toContain('✓ Status code is 200');
      expect(result.consoleOutput).toContain('✓ Response has message');
      expect(result.consoleOutput).toContain('Test completed successfully');
      expect(result.environmentUpdates).toEqual({ testVar: 'testValue' });
    });

    it('should provide access only to whitelisted APIs', async () => {
      const script = `
        pm.test('Whitelisted APIs available', () => {
          // These should be available
          pm.expect(pm).to.be.an('object');
          pm.expect(console).to.be.an('object');
          pm.expect(pm.response).to.be.an('object');
          pm.expect(pm.environment).to.be.an('object');
          pm.expect(pm.test).to.be.a('function');
        });
      `;

      const result = await engine.executeTests(script, mockResult);

      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const syntaxErrorScript = `
        pm.test('Syntax error', () => {
          const invalid = {{{;
        });
      `;

      const result = await engine.executeTests(syntaxErrorScript, mockResult);

      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
      expect(result.tests[0].error).toBeDefined();
    });

    it('should handle runtime errors in tests', async () => {
      const runtimeErrorScript = `
        pm.test('Runtime error', () => {
          throw new Error('Intentional test error');
        });
      `;

      const result = await engine.executeTests(runtimeErrorScript, mockResult);

      expect(result.failed).toBe(1);
      expect(result.tests[0].passed).toBe(false);
      expect(result.tests[0].error).toContain('Intentional test error');
    });
  });
});
