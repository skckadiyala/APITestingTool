import type { languages, Position, IRange } from 'monaco-editor';
import type { GraphQLSchema, GraphQLSchemaType, GraphQLField, GraphQLInputField, GraphQLType } from '../../types/request.types';

/**
 * Context type for determining what kind of suggestions to provide
 */
type CompletionContext = 
  | 'query-root'        // At the root level, suggest query/mutation/subscription
  | 'field'             // Inside a type, suggest fields
  | 'argument'          // Inside field arguments, suggest argument names
  | 'argument-value'    // For argument values, suggest enum values or types
  | 'directive'         // After @, suggest directives
  | 'fragment'          // After ..., suggest fragments
  | 'type';             // In type definitions

/**
 * Parsed query context at cursor position
 */
interface QueryContext {
  type: CompletionContext;
  currentTypeName?: string;      // The type we're currently inside
  currentFieldName?: string;     // The field we're currently inside
  currentArgumentName?: string;  // The argument we're currently inside
  parentPath: string[];          // Path from root to current position
  textBeforeCursor: string;
  textAfterCursor: string;
}

/**
 * GraphQL Completion Provider for Monaco Editor
 */
export class GraphQLCompletionProvider {
  private schema: GraphQLSchema | undefined;

  constructor(schema?: GraphQLSchema) {
    this.schema = schema;
  }

  /**
   * Update the schema used for completions
   */
  updateSchema(schema: GraphQLSchema | undefined): void {
    this.schema = schema;
  }

  /**
   * Provide completion items for Monaco Editor
   */
  provideCompletionItems(
    model: any,
    position: Position
  ): languages.CompletionList | null {
    if (!this.schema) {
      return null;
    }

    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    const context = this.parseQueryContext(textUntilPosition, position);
    const suggestions = this.generateSuggestions(context);

    return {
      suggestions,
      incomplete: false,
    };
  }

  /**
   * Provide hover information for types and fields
   */
  provideHover(model: any, position: Position): languages.Hover | null {
    if (!this.schema) {
      return null;
    }

    const word = model.getWordAtPosition(position);
    if (!word) {
      return null;
    }

    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    const context = this.parseQueryContext(textUntilPosition, position);
    const hoverInfo = this.getHoverInfo(word.word, context);

    if (!hoverInfo) {
      return null;
    }

    return {
      contents: [{ value: hoverInfo }],
      range: {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      },
    };
  }

  /**
   * Provide signature help for field arguments
   */
  provideSignatureHelp(
    model: any,
    position: Position
  ): languages.SignatureHelpResult | null {
    if (!this.schema) {
      return null;
    }

    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    const context = this.parseQueryContext(textUntilPosition, position);
    
    if (context.type !== 'argument' || !context.currentTypeName || !context.currentFieldName) {
      return null;
    }

    const type = this.findType(context.currentTypeName);
    if (!type || !type.fields) {
      return null;
    }

    const field = type.fields.find(f => f.name === context.currentFieldName);
    if (!field || !field.args || field.args.length === 0) {
      return null;
    }

    // Build signature help
    const parameters = field.args.map(arg => ({
      label: `${arg.name}: ${this.formatGraphQLType(arg.type)}`,
      documentation: arg.description,
    }));

    const signature = {
      label: `${field.name}(${field.args.map(a => `${a.name}: ${this.formatGraphQLType(a.type)}`).join(', ')})`,
      documentation: field.description,
      parameters,
    };

    return {
      value: {
        signatures: [signature],
        activeSignature: 0,
        activeParameter: 0,
      },
      dispose: () => {},
    };
  }

  /**
   * Parse the query to determine current context
   */
  private parseQueryContext(text: string, position: Position): QueryContext {
    const lines = text.split('\n');
    const currentLine = lines[position.lineNumber - 1] || '';
    const textBeforeCursor = currentLine.substring(0, position.column - 1);
    const textAfterCursor = currentLine.substring(position.column - 1);

    // Check if we're at the root level (query/mutation/subscription)
    const trimmedText = text.trim();
    if (!trimmedText || /^(query|mutation|subscription)?\s*$/.test(trimmedText)) {
      return {
        type: 'query-root',
        parentPath: [],
        textBeforeCursor,
        textAfterCursor,
      };
    }

    // Check if we're after @ (directive)
    if (/@\w*$/.test(textBeforeCursor)) {
      return {
        type: 'directive',
        parentPath: [],
        textBeforeCursor,
        textAfterCursor,
      };
    }

    // Check if we're after ... (fragment spread)
    if (/\.\.\.\s*\w*$/.test(textBeforeCursor)) {
      return {
        type: 'fragment',
        parentPath: [],
        textBeforeCursor,
        textAfterCursor,
      };
    }

    // Check if we're inside field arguments
    if (/\(\s*\w*$/.test(textBeforeCursor) || /,\s*\w*$/.test(textBeforeCursor)) {
      const currentTypeName = this.extractCurrentType(text, position);
      const currentFieldName = this.extractCurrentField(textBeforeCursor);
      
      return {
        type: 'argument',
        currentTypeName,
        currentFieldName,
        parentPath: [],
        textBeforeCursor,
        textAfterCursor,
      };
    }

    // Default: field completion
    const currentTypeName = this.extractCurrentType(text, position);
    
    return {
      type: 'field',
      currentTypeName,
      parentPath: [],
      textBeforeCursor,
      textAfterCursor,
    };
  }

  /**
   * Extract the current type name from the query
   */
  private extractCurrentType(text: string, position: Position): string | undefined {
    // Look for the operation type (query/mutation/subscription)
    const queryMatch = text.match(/^\s*(query|mutation|subscription)/i);
    
    if (queryMatch) {
      const operationType = queryMatch[1].toLowerCase();
      
      if (operationType === 'query' && this.schema?.queryType) {
        return this.schema.queryType.name;
      } else if (operationType === 'mutation' && this.schema?.mutationType) {
        return this.schema.mutationType.name;
      } else if (operationType === 'subscription' && this.schema?.subscriptionType) {
        return this.schema.subscriptionType.name;
      }
    }

    // Default to Query type if no explicit operation
    return this.schema?.queryType?.name || 'Query';
  }

  /**
   * Extract the current field name from the text before cursor
   */
  private extractCurrentField(textBeforeCursor: string): string | undefined {
    const fieldMatch = textBeforeCursor.match(/(\w+)\s*\(\s*\w*$/);
    return fieldMatch ? fieldMatch[1] : undefined;
  }

  /**
   * Generate completion suggestions based on context
   */
  private generateSuggestions(context: QueryContext): languages.CompletionItem[] {
    switch (context.type) {
      case 'query-root':
        return this.getOperationSuggestions();
      
      case 'field':
        return this.getFieldSuggestions(context.currentTypeName);
      
      case 'argument':
        return this.getArgumentSuggestions(
          context.currentTypeName,
          context.currentFieldName
        );
      
      case 'directive':
        return this.getDirectiveSuggestions();
      
      case 'fragment':
        return []; // Fragment suggestions would require parsing existing fragments
      
      default:
        return [];
    }
  }

  /**
   * Get operation type suggestions (query, mutation, subscription)
   */
  private getOperationSuggestions(): languages.CompletionItem[] {
    const suggestions: languages.CompletionItem[] = [];

    if (this.schema?.queryType) {
      suggestions.push({
        label: 'query',
        kind: 14, // languages.CompletionItemKind.Keyword
        insertText: 'query {\n  \n}',
        insertTextRules: 4, // languages.CompletionItemInsertTextRule.InsertAsSnippet
        documentation: 'GraphQL query operation',
        range: {} as IRange,
      });
    }

    if (this.schema?.mutationType) {
      suggestions.push({
        label: 'mutation',
        kind: 14,
        insertText: 'mutation {\n  \n}',
        insertTextRules: 4,
        documentation: 'GraphQL mutation operation',
        range: {} as IRange,
      });
    }

    if (this.schema?.subscriptionType) {
      suggestions.push({
        label: 'subscription',
        kind: 14,
        insertText: 'subscription {\n  \n}',
        insertTextRules: 4,
        documentation: 'GraphQL subscription operation',
        range: {} as IRange,
      });
    }

    return suggestions;
  }

  /**
   * Get field suggestions for a given type
   */
  private getFieldSuggestions(typeName?: string): languages.CompletionItem[] {
    if (!typeName) {
      return [];
    }

    const type = this.findType(typeName);
    if (!type || !type.fields) {
      return [];
    }

    return type.fields.map(field => {
      const hasArgs = field.args && field.args.length > 0;
      const insertText = hasArgs 
        ? `${field.name}($1) {\n  $2\n}`
        : `${field.name} {\n  $1\n}`;

      return {
        label: field.name,
        kind: 5, // languages.CompletionItemKind.Field
        insertText,
        insertTextRules: 4,
        documentation: this.buildFieldDocumentation(field),
        detail: this.formatGraphQLType(field.type),
        range: {} as IRange,
      };
    });
  }

  /**
   * Get argument suggestions for a field
   */
  private getArgumentSuggestions(
    typeName?: string,
    fieldName?: string
  ): languages.CompletionItem[] {
    if (!typeName || !fieldName) {
      return [];
    }

    const type = this.findType(typeName);
    if (!type || !type.fields) {
      return [];
    }

    const field = type.fields.find(f => f.name === fieldName);
    if (!field || !field.args) {
      return [];
    }

    return field.args.map(arg => ({
      label: arg.name,
      kind: 20, // languages.CompletionItemKind.Property
      insertText: `${arg.name}: $1`,
      insertTextRules: 4,
      documentation: arg.description || `Type: ${this.formatGraphQLType(arg.type)}`,
      detail: this.formatGraphQLType(arg.type),
      range: {} as IRange,
    }));
  }

  /**
   * Get directive suggestions
   */
  private getDirectiveSuggestions(): languages.CompletionItem[] {
    const commonDirectives = [
      { name: 'include', description: 'Conditionally include a field', args: 'if: Boolean!' },
      { name: 'skip', description: 'Conditionally skip a field', args: 'if: Boolean!' },
      { name: 'deprecated', description: 'Mark a field as deprecated', args: 'reason: String' },
    ];

    return commonDirectives.map(directive => ({
      label: directive.name,
      kind: 14, // languages.CompletionItemKind.Keyword
      insertText: `${directive.name}(${directive.args})`,
      insertTextRules: 4,
      documentation: directive.description,
      range: {} as IRange,
    }));
  }

  /**
   * Get hover information for a word
   */
  private getHoverInfo(word: string, context: QueryContext): string | null {
    if (!context.currentTypeName) {
      return null;
    }

    const type = this.findType(context.currentTypeName);
    if (!type || !type.fields) {
      return null;
    }

    const field = type.fields.find(f => f.name === word);
    if (!field) {
      return null;
    }

    let hoverText = `**${field.name}**: ${this.formatGraphQLType(field.type)}`;
    
    if (field.description) {
      hoverText += `\n\n${field.description}`;
    }

    if (field.args && field.args.length > 0) {
      hoverText += '\n\n**Arguments:**\n';
      field.args.forEach(arg => {
        hoverText += `- ${arg.name}: ${this.formatGraphQLType(arg.type)}`;
        if (arg.description) {
          hoverText += ` - ${arg.description}`;
        }
        hoverText += '\n';
      });
    }

    if (field.isDeprecated) {
      hoverText += `\n\n⚠️ **Deprecated**`;
      if (field.deprecationReason) {
        hoverText += `: ${field.deprecationReason}`;
      }
    }

    return hoverText;
  }

  /**
   * Find a type in the schema by name
   */
  private findType(typeName: string): GraphQLSchemaType | undefined {
    if (!this.schema) {
      return undefined;
    }

    return this.schema.types.find(t => t.name === typeName);
  }

  /**
   * Format a GraphQL type for display
   */
  private formatGraphQLType(type: GraphQLType): string {
    if (type.kind === 'NON_NULL' && type.ofType) {
      return `${this.formatGraphQLType(type.ofType)}!`;
    }

    if (type.kind === 'LIST' && type.ofType) {
      return `[${this.formatGraphQLType(type.ofType)}]`;
    }

    return type.name || type.kind;
  }

  /**
   * Build field documentation
   */
  private buildFieldDocumentation(field: GraphQLField): string {
    let doc = '';

    if (field.description) {
      doc += field.description + '\n\n';
    }

    doc += `**Type:** ${this.formatGraphQLType(field.type)}`;

    if (field.args && field.args.length > 0) {
      doc += '\n\n**Arguments:**\n';
      field.args.forEach(arg => {
        doc += `- ${arg.name}: ${this.formatGraphQLType(arg.type)}`;
        if (arg.description) {
          doc += ` - ${arg.description}`;
        }
        doc += '\n';
      });
    }

    if (field.isDeprecated) {
      doc += '\n\n⚠️ **Deprecated**';
      if (field.deprecationReason) {
        doc += `: ${field.deprecationReason}`;
      }
    }

    return doc;
  }
}

/**
 * Create and return a completion provider instance
 */
export function createCompletionProvider(schema?: GraphQLSchema): GraphQLCompletionProvider {
  return new GraphQLCompletionProvider(schema);
}
