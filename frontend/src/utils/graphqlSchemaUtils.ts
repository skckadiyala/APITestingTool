import type { GraphQLSchema, GraphQLSchemaType, GraphQLField, GraphQLType } from '../types/request.types';

/**
 * GraphQL Schema Utility Functions
 * 
 * Helper functions for navigating, filtering, and analyzing GraphQL schemas
 */

/**
 * Format a GraphQL type to a human-readable string
 */
export const formatGraphQLType = (type: GraphQLType): string => {
  if (type.name) {
    return type.name;
  }
  if (type.ofType) {
    const innerType = formatGraphQLType(type.ofType);
    if (type.kind === 'NON_NULL') {
      return `${innerType}!`;
    }
    if (type.kind === 'LIST') {
      return `[${innerType}]`;
    }
  }
  return 'Unknown';
};

/**
 * Get the root type name for a given operation type
 */
export const getRootTypeName = (
  schema: GraphQLSchema,
  operationType: 'query' | 'mutation' | 'subscription'
): string | null => {
  switch (operationType) {
    case 'query':
      return schema.queryType?.name || null;
    case 'mutation':
      return schema.mutationType?.name || null;
    case 'subscription':
      return schema.subscriptionType?.name || null;
    default:
      return null;
  }
};

/**
 * Get a type by name from the schema
 */
export const getTypeByName = (schema: GraphQLSchema, typeName: string): GraphQLSchemaType | null => {
  return schema.types.find((t) => t.name === typeName) || null;
};

/**
 * Filter types by search term (searches name, fields, and description)
 */
export const filterTypes = (types: GraphQLSchemaType[], searchTerm: string): GraphQLSchemaType[] => {
  if (!searchTerm) return types;

  const search = searchTerm.toLowerCase();
  return types.filter((type) => {
    const nameMatch = type.name.toLowerCase().includes(search);
    const fieldMatch = type.fields?.some((f) => f.name.toLowerCase().includes(search));
    const descMatch = type.description?.toLowerCase().includes(search);
    return nameMatch || fieldMatch || descMatch;
  });
};

/**
 * Get all custom types (excluding introspection and scalars)
 */
export const getCustomTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter(
    (type) =>
      !type.name.startsWith('__') && // Exclude introspection types
      type.kind !== 'SCALAR' && // Exclude scalar types
      !['Query', 'Mutation', 'Subscription'].includes(type.name) // Exclude root types
  );
};

/**
 * Get all scalar types
 */
export const getScalarTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter((type) => type.kind === 'SCALAR' && !type.name.startsWith('__'));
};

/**
 * Get all enum types
 */
export const getEnumTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter((type) => type.kind === 'ENUM');
};

/**
 * Get all interface types
 */
export const getInterfaceTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter((type) => type.kind === 'INTERFACE');
};

/**
 * Get all union types
 */
export const getUnionTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter((type) => type.kind === 'UNION');
};

/**
 * Get all input types
 */
export const getInputTypes = (schema: GraphQLSchema): GraphQLSchemaType[] => {
  return schema.types.filter((type) => type.kind === 'INPUT_OBJECT');
};

/**
 * Search for a field across all types
 */
export const searchFieldAcrossTypes = (
  schema: GraphQLSchema,
  fieldName: string
): Array<{ type: GraphQLSchemaType; field: GraphQLField }> => {
  const results: Array<{ type: GraphQLSchemaType; field: GraphQLField }> = [];

  schema.types.forEach((type) => {
    if (type.fields) {
      const matchingField = type.fields.find((f) => f.name === fieldName);
      if (matchingField) {
        results.push({ type, field: matchingField });
      }
    }
  });

  return results;
};

/**
 * Check if a type is deprecated
 */
export const isTypeDeprecated = (type: GraphQLSchemaType): boolean => {
  if (!type.fields) return false;
  return type.fields.some((field) => field.isDeprecated);
};

/**
 * Get all deprecated fields from a type
 */
export const getDeprecatedFields = (type: GraphQLSchemaType): GraphQLField[] => {
  if (!type.fields) return [];
  return type.fields.filter((field) => field.isDeprecated);
};

/**
 * Build a field path string (e.g., "User.posts.comments")
 */
export const buildFieldPath = (typeName: string, fieldNames: string[]): string => {
  return `${typeName}.${fieldNames.join('.')}`;
};

/**
 * Generate a sample query for a field
 */
export const generateSampleQuery = (type: GraphQLSchemaType, field: GraphQLField): string => {
  const args = field.args
    ?.map((arg) => {
      const argType = formatGraphQLType(arg.type);
      const isRequired = argType.endsWith('!');
      if (isRequired) {
        return `${arg.name}: $${arg.name}`;
      }
      return null;
    })
    .filter(Boolean)
    .join(', ');

  const queryName = `${field.name}Query`;
  const variables = field.args
    ?.filter((arg) => formatGraphQLType(arg.type).endsWith('!'))
    .map((arg) => {
      const argType = formatGraphQLType(arg.type);
      return `$${arg.name}: ${argType}`;
    })
    .join(', ');

  const variableDeclaration = variables ? `(${variables})` : '';
  const argsString = args ? `(${args})` : '';

  return `query ${queryName}${variableDeclaration} {
  ${field.name}${argsString} {
    # Add fields here
  }
}`;
};

/**
 * Get schema statistics
 */
export const getSchemaStats = (schema: GraphQLSchema) => {
  return {
    totalTypes: schema.types.length,
    customTypes: getCustomTypes(schema).length,
    scalars: getScalarTypes(schema).length,
    enums: getEnumTypes(schema).length,
    interfaces: getInterfaceTypes(schema).length,
    unions: getUnionTypes(schema).length,
    inputs: getInputTypes(schema).length,
    queries: schema.queryType
      ? getTypeByName(schema, schema.queryType.name)?.fields?.length || 0
      : 0,
    mutations: schema.mutationType
      ? getTypeByName(schema, schema.mutationType.name)?.fields?.length || 0
      : 0,
    subscriptions: schema.subscriptionType
      ? getTypeByName(schema, schema.subscriptionType.name)?.fields?.length || 0
      : 0,
  };
};

/**
 * Validate if a schema is valid and has required fields
 */
export const validateSchema = (schema: GraphQLSchema): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!schema.types || schema.types.length === 0) {
    errors.push('Schema has no types');
  }

  if (!schema.queryType) {
    errors.push('Schema has no query type');
  }

  const queryType = schema.queryType ? getTypeByName(schema, schema.queryType.name) : null;
  if (queryType && (!queryType.fields || queryType.fields.length === 0)) {
    errors.push('Query type has no fields');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sort types alphabetically
 */
export const sortTypes = (types: GraphQLSchemaType[]): GraphQLSchemaType[] => {
  return [...types].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Group types by kind
 */
export const groupTypesByKind = (
  types: GraphQLSchemaType[]
): Record<string, GraphQLSchemaType[]> => {
  return types.reduce((acc, type) => {
    if (!acc[type.kind]) {
      acc[type.kind] = [];
    }
    acc[type.kind].push(type);
    return acc;
  }, {} as Record<string, GraphQLSchemaType[]>);
};
