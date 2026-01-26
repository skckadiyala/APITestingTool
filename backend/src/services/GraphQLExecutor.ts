import axios, { AxiosRequestConfig } from 'axios';
import { GraphQLSchema, GraphQLRequestConfig, GraphQLQueryVariables } from '../types/request.types';

interface GraphQLExecutionResult {
  data?: any;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: any;
  }>;
  extensions?: any;
}

export class GraphQLExecutor {
  /**
   * Execute a GraphQL query/mutation
   */
  async execute(
    url: string,
    query: string,
    variables?: GraphQLQueryVariables,
    operationName?: string,
    headers?: Record<string, string>
  ): Promise<GraphQLExecutionResult> {
    try {
      const requestBody: GraphQLRequestConfig = {
        query,
        variables: variables || {},
      };

      if (operationName) {
        requestBody.operationName = operationName;
      }

      const config: AxiosRequestConfig = {
        method: 'POST',
        url,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error(`GraphQL request failed: ${error.message}`);
    }
  }

  /**
   * Introspect GraphQL schema from endpoint
   */
  async introspectSchema(url: string, headers?: Record<string, string>): Promise<GraphQLSchema> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.execute(url, introspectionQuery, undefined, undefined, headers);
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Schema introspection failed: ${result.errors[0].message}`);
      }

      return result.data.__schema;
    } catch (error: any) {
      throw new Error(`Failed to introspect schema: ${error.message}`);
    }
  }

  /**
   * Validate GraphQL query syntax
   */
  validateQuerySyntax(query: string): { valid: boolean; errors?: string[] } {
    // Basic validation - check for query/mutation/subscription keywords
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return { valid: false, errors: ['Query cannot be empty'] };
    }

    const hasOperation = /^(query|mutation|subscription|fragment|\{)/i.test(trimmedQuery);
    
    if (!hasOperation) {
      return { 
        valid: false, 
        errors: ['Query must start with query, mutation, subscription, fragment, or {'] 
      };
    }

    // Check for balanced braces
    const openBraces = (trimmedQuery.match(/\{/g) || []).length;
    const closeBraces = (trimmedQuery.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return { valid: false, errors: ['Unbalanced braces in query'] };
    }

    return { valid: true };
  }

  /**
   * Format GraphQL errors for display
   */
  formatGraphQLErrors(errors: GraphQLExecutionResult['errors']): string {
    if (!errors || errors.length === 0) {
      return '';
    }

    return errors.map(error => {
      let message = error.message;
      
      if (error.locations && error.locations.length > 0) {
        const loc = error.locations[0];
        message += ` (line ${loc.line}, column ${loc.column})`;
      }
      
      if (error.path) {
        message += ` at path: ${error.path.join('.')}`;
      }
      
      return message;
    }).join('\n');
  }

  /**
   * Extract operation name from query
   */
  extractOperationName(query: string): string | undefined {
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1] : undefined;
  }
}

export default new GraphQLExecutor();
