import React, { useState, useMemo } from 'react';
import type { GraphQLSchema, GraphQLSchemaType, GraphQLField, GraphQLType } from '../../types/request.types';

interface GraphQLSchemaExplorerProps {
  schema?: GraphQLSchema;
  loading?: boolean;
  onInsertField?: (field: string) => void;
  onQueryGenerate?: (query: string) => void;
}

/**
 * GraphQL Schema Explorer Component (Postman-style)
 * 
 * Displays schema types in a collapsible tree view with search functionality.
 * Similar to Postman's left schema panel.
 */
export const GraphQLSchemaExplorer: React.FC<GraphQLSchemaExplorerProps> = ({
  schema,
  loading = false,
  onInsertField,
  onQueryGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['Query', 'Mutation', 'Subscription']));
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  /**
   * Get the actual type name, unwrapping LIST and NON_NULL wrappers
   */
  const getTypeName = (type: GraphQLType): string => {
    if (type.name) return type.name;
    if (type.ofType) return getTypeName(type.ofType);
    return 'Unknown';
  };

  /**
   * Check if a type is a scalar or built-in type
   */
  const isScalarType = (typeName: string): boolean => {
    const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'ID'];
    return scalarTypes.includes(typeName) || typeName.startsWith('__');
  };

  /**
   * Get type details from schema by name
   */
  const getTypeByName = (typeName: string): GraphQLSchemaType | undefined => {
    return schema?.types.find(t => t.name === typeName);
  };

  /**
   * Get root operations (Query, Mutation, Subscription)
   */
  const rootOperations = useMemo(() => {
    if (!schema) return [];

    const ops = [];
    if (schema.queryType) {
      const queryType = schema.types.find(t => t.name === schema.queryType?.name);
      if (queryType) ops.push({ name: 'Query', type: queryType });
    }
    if (schema.mutationType) {
      const mutationType = schema.types.find(t => t.name === schema.mutationType?.name);
      if (mutationType) ops.push({ name: 'Mutation', type: mutationType });
    }
    if (schema.subscriptionType) {
      const subscriptionType = schema.types.find(t => t.name === schema.subscriptionType?.name);
      if (subscriptionType) ops.push({ name: 'Subscription', type: subscriptionType });
    }
    return ops;
  }, [schema]);

  /**
   * Filter fields by search term
   */
  const filterFields = (fields: GraphQLField[] | undefined) => {
    if (!fields) return [];
    if (!searchTerm) return fields;

    const search = searchTerm.toLowerCase();
    return fields.filter(f => 
      f.name.toLowerCase().includes(search) ||
      f.description?.toLowerCase().includes(search)
    );
  };

  /**
   * Toggle type expansion
   */
  const toggleExpanded = (typeName: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName);
    } else {
      newExpanded.add(typeName);
    }
    setExpandedTypes(newExpanded);
  };

  /**
   * Toggle field expansion
   */
  const toggleFieldExpanded = (fieldPath: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldPath)) {
      newExpanded.delete(fieldPath);
    } else {
      newExpanded.add(fieldPath);
    }
    setExpandedFields(newExpanded);
  };

  /**
   * Get all parent paths for a field path
   */
  const getParentPaths = (fieldPath: string): string[] => {
    const parts = fieldPath.split('.');
    const parents: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      parents.push(parts.slice(0, i + 1).join('.'));
    }
    return parents;
  };

  /**
   * Get all child paths for a field path
   */
  const getChildPaths = (fieldPath: string): string[] => {
    const children: string[] = [];
    selectedFields.forEach(path => {
      if (path.startsWith(fieldPath + '.') && path !== fieldPath) {
        children.push(path);
      }
    });
    return children;
  };

  /**
   * Toggle field selection with auto-parent selection
   */
  const toggleField = (fieldPath: string) => {
    const newSelected = new Set(selectedFields);
    
    if (newSelected.has(fieldPath)) {
      // Deselect field and all its children
      newSelected.delete(fieldPath);
      const children = getChildPaths(fieldPath);
      children.forEach(child => newSelected.delete(child));
    } else {
      // Select field and all its parents
      newSelected.add(fieldPath);
      const parents = getParentPaths(fieldPath);
      parents.forEach(parent => newSelected.add(parent));
    }
    
    setSelectedFields(newSelected);
    
    // Generate query from selected fields
    if (onQueryGenerate) {
      const query = generateQueryFromSelection(newSelected);
      onQueryGenerate(query);
    }
  };

  /**
   * Generate GraphQL query from selected fields
   */
  const generateQueryFromSelection = (selected: Set<string>): string => {
    if (selected.size === 0) return '';

    // Group selections by root operation
    const selectionsByRoot: { [key: string]: Set<string> } = {};
    
    selected.forEach(path => {
      const root = path.split('.')[0];
      if (!selectionsByRoot[root]) {
        selectionsByRoot[root] = new Set();
      }
      selectionsByRoot[root].add(path);
    });

    // Build query for each root operation
    const queries: string[] = [];
    
    Object.entries(selectionsByRoot).forEach(([root, paths]) => {
      const rootOp = rootOperations.find(op => op.name === root);
      if (!rootOp) return;

      const tree = buildFieldTree(paths, root);
      const fields = formatFieldTree(tree, 1);
      
      const operationType = root.toLowerCase();
      queries.push(`${operationType} {
${fields}
}`);
    });

    return queries.join('\n\n');
  };

  /**
   * Build a tree structure from flat field paths
   */
  const buildFieldTree = (paths: Set<string>, rootPrefix: string): any => {
    const tree: any = {};
    
    paths.forEach(path => {
      const parts = path.replace(rootPrefix + '.', '').split('.');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      });
    });
    
    return tree;
  };

  /**
   * Format field tree into GraphQL query string
   */
  const formatFieldTree = (tree: any, indent: number): string => {
    const spaces = '  '.repeat(indent);
    const fields: string[] = [];
    
    Object.keys(tree).forEach(key => {
      const children = tree[key];
      const hasChildren = Object.keys(children).length > 0;
      
      if (hasChildren) {
        fields.push(`${spaces}${key} {`);
        fields.push(formatFieldTree(children, indent + 1));
        fields.push(`${spaces}}`);
      } else {
        fields.push(`${spaces}${key}`);
      }
    });
    
    return fields.join('\n');
  };

  /**
   * Handle field click to insert into query
   */
  const handleFieldClick = (field: GraphQLField) => {
    if (onInsertField) {
      onInsertField(field.name);
    }
  };

  /**
   * Recursively render field and its nested fields
   */
  const renderField = (field: GraphQLField, depth: number, parentPath: string, rootType: string) => {
    const fieldPath = `${parentPath}.${field.name}`;
    const isSelected = selectedFields.has(fieldPath);
    const typeName = getTypeName(field.type);
    const fieldType = getTypeByName(typeName);
    const hasNestedFields = fieldType && fieldType.fields && fieldType.fields.length > 0 && !isScalarType(typeName);
    const isExpanded = expandedFields.has(fieldPath);

    return (
      <div key={fieldPath} style={{ marginLeft: `${depth * 12}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '5px 8px',
            cursor: 'pointer',
            backgroundColor: isSelected ? '#094771' : 'transparent',
            borderRadius: '3px',
            marginBottom: '2px',
            textAlign: 'left',
          }}
          title={field.description || field.name}
        >
          {hasNestedFields && (
            <svg
              onClick={(e) => {
                e.stopPropagation();
                toggleFieldExpanded(fieldPath);
              }}
              style={{
                width: '12px',
                height: '12px',
                marginRight: '6px',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                fill: '#858585',
                flexShrink: 0,
              }}
              viewBox="0 0 24 24"
            >
              <path d="M10 17l5-5-5-5v10z"/>
            </svg>
          )}
          {!hasNestedFields && <div style={{ width: '18px', flexShrink: 0 }} />}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleField(fieldPath)}
            onClick={(e) => e.stopPropagation()}
            style={{
              marginRight: '8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <span
            onClick={() => handleFieldClick(field)}
            style={{
              fontSize: '12px',
              color: '#d4d4d4',
              flex: 1,
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {field.name}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#858585',
              marginLeft: '8px',
              flexShrink: 0,
            }}
          >
            {typeName}
          </span>
        </div>

        {/* Nested fields */}
        {hasNestedFields && isExpanded && fieldType?.fields && (
          <div>
            {fieldType.fields.map(nestedField => 
              renderField(nestedField, depth + 1, fieldPath, rootType)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              border: '3px solid #454545',
              borderTop: '3px solid #0e639c',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ fontSize: '12px' }}>Loading schema...</p>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#1e1e1e',
          color: '#858585',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
        <p style={{ fontSize: '12px', marginBottom: '8px' }}>No Schema Loaded</p>
        <p style={{ fontSize: '11px', color: '#656565' }}>
          Schema will load automatically when you enter a GraphQL endpoint
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
        borderRight: '1px solid #454545',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #454545',
          backgroundColor: '#252526',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: '8px',
          }}
        >
          <input
            type="text"
            placeholder="Search fields"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              fontSize: '12px',
              backgroundColor: '#3c3c3c',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#d4d4d4',
              outline: 'none',
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              fill: '#858585',
            }}
            viewBox="0 0 24 24"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        <div style={{ fontSize: '11px', color: '#858585', fontWeight: 500 }}>
          SCHEMA
        </div>
      </div>

      {/* Schema Tree */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
        }}
      >
        {rootOperations.map(({ name, type }) => {
          const isExpanded = expandedTypes.has(name);
          const filteredFields = filterFields(type.fields);

          if (searchTerm && filteredFields.length === 0) {
            return null;
          }

          return (
            <div key={name} style={{ marginBottom: '4px' }}>
              {/* Root Type Header */}
              <div
                onClick={() => toggleExpanded(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? '#2d2d30' : 'transparent',
                  borderRadius: '3px',
                  color: '#d4d4d4',
                  fontSize: '13px',
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                <svg
                  style={{
                    width: '12px',
                    height: '12px',
                    marginRight: '6px',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    fill: '#858585',
                  }}
                  viewBox="0 0 24 24"
                >
                  <path d="M10 17l5-5-5-5v10z"/>
                </svg>
                <span>{name}</span>
                <span style={{ marginLeft: 'auto', color: '#858585', fontSize: '11px' }}>
                  {type.name}
                </span>
              </div>

              {/* Fields */}
              {isExpanded && (
                <div style={{ marginLeft: '0px', marginTop: '4px' }}>
                  {filteredFields.map((field) => renderField(field, 0, name, name))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { GraphQLSchemaExplorer as default };
