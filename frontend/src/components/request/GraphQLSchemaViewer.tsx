import React, { useState, useMemo } from 'react';
import type { GraphQLSchema, GraphQLSchemaType, GraphQLField, GraphQLType } from '../../types/request.types';

interface GraphQLSchemaViewerProps {
  schema?: GraphQLSchema;
  schemaUrl?: string;
  lastFetched?: Date;
  onFetchSchema?: () => void;
  onRefreshSchema?: () => void;
  onInsertField?: (field: string) => void;
  loading?: boolean;
}

/**
 * GraphQL Schema Viewer Component
 * 
 * Displays GraphQL schema documentation with hierarchical tree view,
 * search functionality, and type details panel.
 */
export const GraphQLSchemaViewer: React.FC<GraphQLSchemaViewerProps> = ({
  schema,
  schemaUrl,
  lastFetched,
  onFetchSchema,
  onRefreshSchema,
  onInsertField,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'query' | 'mutation' | 'subscription' | 'types'>('query');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  /**
   * Get formatted type string
   */
  const formatType = (type: GraphQLType): string => {
    if (type.name) {
      return type.name;
    }
    if (type.ofType) {
      const innerType = formatType(type.ofType);
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
   * Get root types based on active tab
   */
  const getRootTypes = (): GraphQLSchemaType[] => {
    if (!schema) return [];

    const rootTypeName =
      activeTab === 'query'
        ? schema.queryType?.name
        : activeTab === 'mutation'
        ? schema.mutationType?.name
        : activeTab === 'subscription'
        ? schema.subscriptionType?.name
        : null;

    if (!rootTypeName && activeTab !== 'types') return [];

    if (activeTab === 'types') {
      return schema.types.filter(
        (type) =>
          !type.name.startsWith('__') && // Exclude introspection types
          type.kind !== 'SCALAR' // Can show scalars separately
      );
    }

    const rootType = schema.types.find((t) => t.name === rootTypeName);
    return rootType ? [rootType] : [];
  };

  /**
   * Filter types by search term
   */
  const filteredTypes = useMemo(() => {
    const types = getRootTypes();
    if (!searchTerm) return types;

    const search = searchTerm.toLowerCase();
    return types.filter((type) => {
      const nameMatch = type.name.toLowerCase().includes(search);
      const fieldMatch = type.fields?.some((f) => f.name.toLowerCase().includes(search));
      const descMatch = type.description?.toLowerCase().includes(search);
      return nameMatch || fieldMatch || descMatch;
    });
  }, [schema, activeTab, searchTerm]);

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
   * Handle field click
   */
  const handleFieldClick = (field: GraphQLField) => {
    if (onInsertField) {
      const fieldStr = `${field.name}`;
      onInsertField(fieldStr);
    }
  };

  if (!schema && !loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
        <h3 style={{ marginBottom: '10px', color: '#d4d4d4' }}>No Schema Available</h3>
        <p style={{ color: '#858585', marginBottom: '20px', textAlign: 'center' }}>
          Fetch the GraphQL schema from your endpoint to view documentation
        </p>
        {onFetchSchema && (
          <button
            onClick={onFetchSchema}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              backgroundColor: '#0e639c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Fetch Schema
          </button>
        )}
        {schemaUrl && (
          <p style={{ color: '#858585', marginTop: '16px', fontSize: '12px' }}>
            Endpoint: {schemaUrl}
          </p>
        )}
      </div>
    );
  }

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
              width: '40px',
              height: '40px',
              border: '4px solid #454545',
              borderTop: '4px solid #0e639c',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p>Fetching schema...</p>
        </div>
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
        color: '#d4d4d4',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #454545',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>GraphQL Schema</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRefreshSchema && (
              <button
                onClick={onRefreshSchema}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#0e639c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                title="Refresh schema"
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>
        {lastFetched && (
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#858585' }}>
            Last updated: {new Date(lastFetched).toLocaleString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 16px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #454545',
        }}
      >
        {['query', 'mutation', 'subscription', 'types'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              backgroundColor: activeTab === tab ? '#0e639c' : 'transparent',
              color: activeTab === tab ? 'white' : '#d4d4d4',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', backgroundColor: '#252526', borderBottom: '1px solid #454545' }}>
        <input
          type="text"
          placeholder="Search types and fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            backgroundColor: '#3c3c3c',
            color: '#d4d4d4',
            border: '1px solid #454545',
            borderRadius: '4px',
            outline: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {filteredTypes.length === 0 ? (
          <p style={{ color: '#858585', textAlign: 'center', marginTop: '40px' }}>
            No types found
          </p>
        ) : (
          filteredTypes.map((type) => (
            <div
              key={type.name}
              style={{
                marginBottom: '16px',
                backgroundColor: '#252526',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {/* Type Header */}
              <div
                onClick={() => toggleExpanded(type.name)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#2d2d2d',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ color: '#4ec9b0', fontWeight: 500 }}>{type.name}</span>
                  <span style={{ color: '#858585', marginLeft: '8px', fontSize: '12px' }}>
                    {type.kind}
                  </span>
                </div>
                <span style={{ color: '#858585' }}>
                  {expandedTypes.has(type.name) ? '▼' : '▶'}
                </span>
              </div>

              {/* Type Details */}
              {expandedTypes.has(type.name) && (
                <div style={{ padding: '12px 16px' }}>
                  {type.description && (
                    <p style={{ color: '#858585', fontSize: '13px', marginBottom: '12px' }}>
                      {type.description}
                    </p>
                  )}

                  {type.fields && type.fields.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '12px', color: '#858585', marginBottom: '8px' }}>
                        Fields:
                      </h4>
                      {type.fields.map((field) => (
                        <div
                          key={field.name}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#1e1e1e',
                            borderRadius: '4px',
                            marginBottom: '6px',
                            cursor: onInsertField ? 'pointer' : 'default',
                          }}
                          onClick={() => handleFieldClick(field)}
                          title={onInsertField ? 'Click to insert' : ''}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9cdcfe' }}>{field.name}</span>
                            <span style={{ color: '#4ec9b0', fontSize: '12px' }}>
                              {formatType(field.type)}
                            </span>
                          </div>
                          {field.description && (
                            <p style={{ color: '#858585', fontSize: '11px', marginTop: '4px' }}>
                              {field.description}
                            </p>
                          )}
                          {field.isDeprecated && (
                            <p style={{ color: '#f48771', fontSize: '11px', marginTop: '4px' }}>
                              ⚠️ Deprecated: {field.deprecationReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GraphQLSchemaViewer;
