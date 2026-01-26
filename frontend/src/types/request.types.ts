export type RequestType = 'REST' | 'GRAPHQL' | 'WEBSOCKET';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
  description?: string;
}

export interface RequestParam extends KeyValuePair {}
export interface RequestHeader extends KeyValuePair {}

export type RequestBodyType = 'none' | 'json' | 'xml' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

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

export interface RequestBody {
  type: RequestBodyType;
  content: string | Record<string, unknown> | FormData;
  raw?: string;
}

export interface Variable {
  id?: string;
  key: string;
  value: string;
  type?: 'default' | 'secret';
  enabled?: boolean;
}
