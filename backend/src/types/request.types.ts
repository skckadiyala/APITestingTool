export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type RequestType = 'REST' | 'GRAPHQL' | 'WEBSOCKET';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'x-www-form-urlencoded' | 'form-data' | 'xml' | 'raw' | 'binary';
export type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

// ============================================
// GraphQL Type Definitions
// ============================================

// Type-safe GraphQL variable values supporting nested structures
export type GraphQLVariableValue = 
  | string 
  | number 
  | boolean 
  | null
  | GraphQLVariableValue[]
  | { [key: string]: GraphQLVariableValue };

export interface GraphQLQueryVariables {
  [key: string]: GraphQLVariableValue;
}

export interface GraphQLSchemaType {
  name: string;
  kind: string;
  description?: string;
  fields?: GraphQLField[];
  inputFields?: GraphQLInputField[];
  possibleTypes?: GraphQLType[];
}

export interface GraphQLField {
  name: string;
  type: GraphQLType;
  args?: GraphQLInputField[];
  description?: string;
  isDeprecated?: boolean;
  deprecationReason?: string;
}

export interface GraphQLInputField {
  name: string;
  type: GraphQLType;
  defaultValue?: any;
  description?: string;
}

export interface GraphQLType {
  kind: string;
  name?: string;
  ofType?: GraphQLType;
}

export interface GraphQLSchema {
  queryType?: { name: string };
  mutationType?: { name: string };
  subscriptionType?: { name: string };
  types: GraphQLSchemaType[];
  directives?: any[];
}

export interface GraphQLRequestConfig {
  query: string;
  variables?: GraphQLQueryVariables;
  operationName?: string;
}

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
  requestType?: RequestType;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: {
    type: BodyType;
    content: string;
  };
  auth: AuthConfig;
  
  // GraphQL-specific fields
  graphqlQuery?: string;
  graphqlVariables?: GraphQLQueryVariables;
  
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
  environmentUpdates?: Record<string, any>;
  collectionUpdates?: Record<string, any>;
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
