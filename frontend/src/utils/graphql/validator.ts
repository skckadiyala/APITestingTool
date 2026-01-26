import { parse, validate, buildClientSchema, GraphQLError } from 'graphql';
import type { DocumentNode } from 'graphql';
import type { GraphQLSchema as CustomGraphQLSchema } from '../../types/request.types';

/**
 * Validation error with location information
 */
export interface GraphQLValidationError {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning';
  source: 'syntax' | 'validation';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: GraphQLValidationError[];
  ast?: DocumentNode;
}

/**
 * GraphQL Query Validator
 * 
 * Validates GraphQL queries for syntax errors and schema validation
 */
export class GraphQLValidator {
  private schema: any | undefined;

  constructor(schema?: CustomGraphQLSchema) {
    if (schema) {
      this.updateSchema(schema);
    }
  }

  /**
   * Update the schema used for validation
   */
  updateSchema(schema: CustomGraphQLSchema | undefined): void {
    if (!schema) {
      this.schema = undefined;
      return;
    }

    try {
      // Convert our custom schema format to GraphQL.js introspection format
      const introspectionResult = {
        __schema: {
          queryType: schema.queryType,
          mutationType: schema.mutationType,
          subscriptionType: schema.subscriptionType,
          types: schema.types,
          directives: schema.directives || [],
        },
      };

      // Build a client schema from the introspection result
      this.schema = buildClientSchema(introspectionResult as any);
    } catch (error) {
      console.error('Failed to build schema:', error);
      this.schema = undefined;
    }
  }

  /**
   * Validate a GraphQL query
   * Returns validation errors with location information
   */
  validate(query: string): ValidationResult {
    if (!query || query.trim() === '') {
      return {
        valid: true,
        errors: [],
      };
    }

    // Step 1: Parse the query (syntax validation)
    let ast: DocumentNode;
    try {
      ast = parse(query);
    } catch (error) {
      return {
        valid: false,
        errors: this.formatGraphQLErrors([error as GraphQLError], 'syntax'),
      };
    }

    // Step 2: Validate against schema (if available)
    if (this.schema) {
      try {
        const validationErrors = validate(this.schema, ast);
        
        if (validationErrors.length > 0) {
          return {
            valid: false,
            errors: this.formatGraphQLErrors(Array.from(validationErrors), 'validation'),
            ast,
          };
        }
      } catch (error) {
        console.error('Schema validation error:', error);
        // Continue without schema validation
      }
    }

    return {
      valid: true,
      errors: [],
      ast,
    };
  }

  /**
   * Validate query syntax only (without schema)
   */
  validateSyntax(query: string): ValidationResult {
    if (!query || query.trim() === '') {
      return {
        valid: true,
        errors: [],
      };
    }

    try {
      const ast = parse(query);
      return {
        valid: true,
        errors: [],
        ast,
      };
    } catch (error) {
      return {
        valid: false,
        errors: this.formatGraphQLErrors([error as GraphQLError], 'syntax'),
      };
    }
  }

  /**
   * Check if query has any syntax errors
   */
  hasSyntaxErrors(query: string): boolean {
    try {
      parse(query);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Format GraphQL errors to our error format
   */
  private formatGraphQLErrors(
    errors: GraphQLError[],
    source: 'syntax' | 'validation'
  ): GraphQLValidationError[] {
    return errors.map(error => {
      const location = error.locations?.[0];
      
      // Extract line and column information
      const line = location?.line || 1;
      const column = location?.column || 1;

      // Try to calculate end position for better error highlighting
      let endLine = line;
      let endColumn = column + 1;

      // For syntax errors, try to find the token length
      if (source === 'syntax' && error.message) {
        const tokenMatch = error.message.match(/"([^"]+)"/);
        if (tokenMatch) {
          endColumn = column + tokenMatch[1].length;
        }
      }

      return {
        message: this.cleanErrorMessage(error.message),
        line,
        column,
        endLine,
        endColumn,
        severity: 'error',
        source,
      };
    });
  }

  /**
   * Clean up error messages for better display
   */
  private cleanErrorMessage(message: string): string {
    // Remove "Syntax Error: " prefix
    message = message.replace(/^Syntax Error:\s*/i, '');
    
    // Remove location information that's redundant with line numbers
    message = message.replace(/\s*\(\d+:\d+\)\s*$/, '');
    
    return message;
  }

  /**
   * Get detailed error information for display
   */
  getErrorDetails(error: GraphQLValidationError): string {
    let details = `**${error.source === 'syntax' ? 'Syntax Error' : 'Validation Error'}**\n\n`;
    details += error.message + '\n\n';
    details += `Location: Line ${error.line}, Column ${error.column}`;
    
    return details;
  }

  /**
   * Check if a query is likely incomplete (for debouncing)
   */
  isIncompleteQuery(query: string): boolean {
    const trimmed = query.trim();
    
    // Empty queries are considered incomplete
    if (!trimmed) {
      return true;
    }

    // Check for unbalanced braces
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      return true;
    }

    // Check for incomplete operations
    if (/^(query|mutation|subscription)\s*$/.test(trimmed)) {
      return true;
    }

    // Check for trailing opening brace
    if (/\{\s*$/.test(trimmed)) {
      return true;
    }

    return false;
  }

  /**
   * Extract operation type from query
   */
  extractOperationType(query: string): 'query' | 'mutation' | 'subscription' | 'unknown' {
    const trimmed = query.trim();
    
    if (/^query\b/i.test(trimmed) || /^\{/.test(trimmed)) {
      return 'query';
    }
    
    if (/^mutation\b/i.test(trimmed)) {
      return 'mutation';
    }
    
    if (/^subscription\b/i.test(trimmed)) {
      return 'subscription';
    }
    
    return 'unknown';
  }

  /**
   * Get suggestions for fixing common errors
   */
  getSuggestions(error: GraphQLValidationError): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('expected') && message.includes('name')) {
      suggestions.push('Add a field name or close the selection set with }');
    }

    if (message.includes('cannot query field')) {
      suggestions.push('Check the field name spelling');
      suggestions.push('Verify the field exists in the schema');
      suggestions.push('Ensure you are querying the correct type');
    }

    if (message.includes('unknown argument')) {
      suggestions.push('Check the argument name spelling');
      suggestions.push('View the schema to see available arguments');
    }

    if (message.includes('missing required argument')) {
      suggestions.push('Add the required argument to the field');
      suggestions.push('Check the schema for argument requirements');
    }

    if (message.includes('expected type')) {
      suggestions.push('Check the argument type matches the schema');
      suggestions.push('Ensure variables are correctly typed');
    }

    if (message.includes('unbalanced') || message.includes('expected')) {
      suggestions.push('Check for matching braces { }');
      suggestions.push('Ensure all parentheses ( ) are balanced');
    }

    return suggestions;
  }
}

/**
 * Create a validator instance
 */
export function createValidator(schema?: CustomGraphQLSchema): GraphQLValidator {
  return new GraphQLValidator(schema);
}

/**
 * Quick validation function for one-off checks
 */
export function validateQuery(query: string, schema?: CustomGraphQLSchema): ValidationResult {
  const validator = new GraphQLValidator(schema);
  return validator.validate(query);
}
