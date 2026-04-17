import * as monaco from 'monaco-editor';

/**
 * Type definitions for the pm object (Postman-like API)
 * Used for IntelliSense in pre-request and test scripts
 */
export const PM_TYPE_DEFINITIONS = `
declare const pm: {
  /**
   * Request object - contains information about the current request
   */
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    params: Array<{key: string; value: string; enabled: boolean}>;
    /**
     * Path parameters as an object
     * Example: For URL /users/:userId/posts/:postId
     * Access as: pm.request.pathParams.userId
     */
    pathParams: Record<string, string>;
    /**
     * Get a specific path parameter value
     * @param key - The path parameter name
     * @returns The path parameter value or undefined
     */
    getPathParam(key: string): string | undefined;
    /**
     * Set a path parameter value (pre-request scripts only)
     * @param key - The path parameter name
     * @param value - The path parameter value
     */
    setPathParam(key: string, value: string): void;
  };

  /**
   * Response object - contains information about the HTTP response (test scripts only)
   */
  response: {
    code: number;
    status: string;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
    responseSize: number;
    /**
     * Parse response body as JSON
     * @returns Parsed JSON object
     */
    json(): any;
    /**
     * Get response body as text
     * @returns Response body as string
     */
    text(): string;
    to: {
      have: {
        /**
         * Assert response status code
         * @param expectedStatus - Expected HTTP status code
         */
        status(expectedStatus: number): void;
        /**
         * Assert response has a header
         * @param headerName - Header name
         * @param expectedValue - Optional expected header value
         */
        header(headerName: string, expectedValue?: string): void;
        /**
         * Validate response against JSON schema
         * @param schema - JSON Schema object
         */
        jsonSchema(schema: any): void;
      };
    };
  };

  /**
   * Environment variables - scoped to current environment (Dev, Staging, Prod, etc.)
   */
  environment: {
    /**
     * Get an environment variable
     * @param key - Variable name
     * @returns Variable value
     */
    get(key: string): any;
    /**
     * Set an environment variable
     * @param key - Variable name
     * @param value - Variable value
     */
    set(key: string, value: any): void;
    /**
     * Remove an environment variable
     * @param key - Variable name
     */
    unset(key: string): void;
  };

  /**
   * Collection variables - scoped to current collection
   */
  collectionVariables: {
    /**
     * Get a collection variable
     * @param key - Variable name
     * @returns Variable value
     */
    get(key: string): any;
    /**
     * Set a collection variable
     * @param key - Variable name
     * @param value - Variable value
     */
    set(key: string, value: any): void;
    /**
     * Remove a collection variable
     * @param key - Variable name
     */
    unset(key: string): void;
  };

  /**
   * Global variables - available across all workspaces
   */
  globals: {
    /**
     * Get a global variable
     * @param key - Variable name
     * @returns Variable value
     */
    get(key: string): any;
    /**
     * Set a global variable
     * @param key - Variable name
     * @param value - Variable value
     */
    set(key: string, value: any): void;
    /**
     * Remove a global variable
     * @param key - Variable name
     */
    unset(key: string): void;
  };

  /**
   * Define a test
   * @param name - Test name/description
   * @param fn - Test function
   */
  test(name: string, fn: () => void): void;

  /**
   * Chai-like expect assertions
   * @param actual - Actual value to test
   */
  expect(actual: any): {
    to: {
      /**
       * Assert strict equality (===)
       * @param expected - Expected value
       */
      equal(expected: any): void;
      /**
       * Assert deep equality (for objects/arrays)
       * @param expected - Expected value
       */
      eql(expected: any): void;
      /**
       * Assert string contains substring
       * @param substring - Expected substring
       */
      include(substring: any): void;
      /**
       * Assert string contains substring (alias for include)
       * @param substring - Expected substring
       */
      contain(substring: any): void;
      /**
       * Assert string matches regex pattern
       * @param pattern - Regular expression pattern
       */
      match(pattern: RegExp): void;
      be: {
        /**
         * Assert value is of type
         * @param type - Expected type ('string', 'number', 'boolean', 'array', etc.)
         */
        a(type: string): void;
        /**
         * Assert value is of type (alias for 'a')
         * @param type - Expected type
         */
        an(type: string): void;
        /**
         * Assert number is below value
         * @param value - Maximum value (exclusive)
         */
        below(value: number): void;
        /**
         * Assert number is above value
         * @param value - Minimum value (exclusive)
         */
        above(value: number): void;
        /**
         * Assert value is true
         */
        true(): void;
        /**
         * Assert value is false
         */
        false(): void;
      };
      have: {
        /**
         * Assert object has property
         * @param prop - Property name
         * @param value - Optional expected value
         */
        property(prop: string, value?: any): void;
        /**
         * Assert array/string has length
         * @param expected - Expected length
         */
        length(expected: number): void;
      };
    };
  };

  /**
   * Generic variables getter (searches all scopes)
   * @deprecated Use pm.environment.get(), pm.collectionVariables.get(), or pm.globals.get()
   */
  variables: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
};

/**
 * Console object for debugging
 */
declare const console: {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
};
`;

/**
 * Configure Monaco Editor with IntelliSense for scripting
 * Call this function when the Monaco Editor is initialized for scripts
 */
export function configureScriptIntelliSense() {
  // Add extra libraries for IntelliSense
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    PM_TYPE_DEFINITIONS,
    'ts:pm-api.d.ts'
  );

  // Configure JavaScript/TypeScript compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // Enable suggestions
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // Disable eager model sync to improve performance
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
}

/**
 * Get completion items for path parameters
 * This can be used to provide dynamic autocomplete based on the current request's path params
 */
export function getPathParamCompletions(
  pathParams: Array<{ key: string; value: string }>
): monaco.languages.CompletionItem[] {
  return pathParams.map((param) => ({
    label: param.key,
    kind: monaco.languages.CompletionItemKind.Property,
    documentation: `Path parameter: ${param.key}${param.value ? ` = ${param.value}` : ''}`,
    insertText: param.key,
    range: {} as any, // Will be provided by Monaco
  }));
}

/**
 * Example snippets for common script patterns
 */
export const SCRIPT_SNIPPETS = [
  {
    label: 'Test: Status code',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      'pm.test("Status code is ${1:200}", function() {',
      '  pm.response.to.have.status(${1:200});',
      '});',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Assert response status code',
  },
  {
    label: 'Test: Response time',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      'pm.test("Response time is acceptable", function() {',
      '  pm.expect(pm.response.responseTime).to.be.below(${1:1000});',
      '});',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Assert response time is below threshold',
  },
  {
    label: 'Test: Has property',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      'pm.test("Response has ${1:property}", function() {',
      '  const data = pm.response.json();',
      '  pm.expect(data).to.have.property("${1:property}");',
      '});',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Assert response has a property',
  },
  {
    label: 'Set path parameter',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'pm.request.pathParams.${1:paramName} = "${2:value}";',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Set a path parameter value',
  },
  {
    label: 'Set environment variable',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'pm.environment.set("${1:key}", "${2:value}");',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Set an environment variable',
  },
  {
    label: 'Get environment variable',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'pm.environment.get("${1:key}")',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Get an environment variable',
  },
  {
    label: 'Parse JSON response',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'const data = pm.response.json();',
    documentation: 'Parse response body as JSON',
  },
];
