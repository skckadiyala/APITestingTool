import React, { useState } from 'react';
import GraphQLQueryPanel from '../components/request/GraphQLQueryPanel';
import GraphQLSchemaViewer from '../components/request/GraphQLSchemaViewer';
import type { GraphQLQueryVariables, GraphQLSchema } from '../types/request.types';

/**
 * Test page for GraphQL Editor Component
 * 
 * This page demonstrates the GraphQLQueryPanel component functionality
 * with sample queries, variables, and interactive controls.
 */
const GraphQLEditorTest: React.FC = () => {
  const [query, setQuery] = useState(`query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    profile {
      avatar
      bio
    }
  }
}`);

  const [variables, setVariables] = useState<GraphQLQueryVariables>({
    id: '123',
  });

  const [schema, setSchema] = useState<GraphQLSchema | undefined>(undefined);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Auto-load schema on mount for testing auto-completion
  React.useEffect(() => {
    handleFetchSchema();
  }, []);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    console.log('Query changed:', newQuery);
  };

  const handleVariablesChange = (newVariables: GraphQLQueryVariables) => {
    setVariables(newVariables);
    console.log('Variables changed:', newVariables);
  };

  const handleFormat = () => {
    addLog('Format button clicked - formatting query');
    // The editor will handle formatting internally
  };

  const handleExecute = () => {
    addLog('Execute triggered (Cmd/Ctrl + Enter)');
    addLog(`Query to execute: ${query.substring(0, 50)}...`);
  };

  const handleFetchSchema = () => {
    addLog('Fetching schema...');
    setIsLoadingSchema(true);

    // Simulate schema fetch with mock data
    setTimeout(() => {
      const mockSchema: GraphQLSchema = {
        queryType: { name: 'Query' },
        mutationType: { name: 'Mutation' },
        subscriptionType: { name: 'Subscription' },
        types: [
          {
            kind: 'OBJECT',
            name: 'Query',
            description: 'The root query type',
            fields: [
              {
                name: 'user',
                description: 'Get a user by ID',
                type: { kind: 'OBJECT', name: 'User', ofType: undefined },
                args: [
                  {
                    name: 'id',
                    description: 'The user ID',
                    type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'ID', ofType: undefined } },
                  },
                ],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'users',
                description: 'Get all users',
                type: { kind: 'LIST', name: undefined, ofType: { kind: 'OBJECT', name: 'User', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
            ],
          },
          {
            kind: 'OBJECT',
            name: 'Mutation',
            description: 'The root mutation type',
            fields: [
              {
                name: 'createUser',
                description: 'Create a new user',
                type: { kind: 'OBJECT', name: 'User', ofType: undefined },
                args: [
                  {
                    name: 'input',
                    description: 'User input data',
                    type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'INPUT_OBJECT', name: 'CreateUserInput', ofType: undefined } },
                  },
                ],
                isDeprecated: false,
                deprecationReason: undefined,
              },
            ],
          },
          {
            kind: 'OBJECT',
            name: 'User',
            description: 'A user in the system',
            fields: [
              {
                name: 'id',
                description: 'The user ID',
                type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'ID', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'name',
                description: 'The user name',
                type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'String', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'email',
                description: 'The user email',
                type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'String', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'profile',
                description: 'The user profile',
                type: { kind: 'OBJECT', name: 'Profile', ofType: undefined },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'oldField',
                description: 'This field is deprecated',
                type: { kind: 'SCALAR', name: 'String', ofType: undefined },
                args: [],
                isDeprecated: true,
                deprecationReason: 'Use newField instead',
              },
            ],
          },
          {
            kind: 'OBJECT',
            name: 'Profile',
            description: 'User profile information',
            fields: [
              {
                name: 'avatar',
                description: 'Profile avatar URL',
                type: { kind: 'SCALAR', name: 'String', ofType: undefined },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'bio',
                description: 'Profile bio',
                type: { kind: 'SCALAR', name: 'String', ofType: undefined },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
            ],
          },
          {
            kind: 'INPUT_OBJECT',
            name: 'CreateUserInput',
            description: 'Input for creating a user',
            fields: [
              {
                name: 'name',
                description: 'User name',
                type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'String', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
              {
                name: 'email',
                description: 'User email',
                type: { kind: 'NON_NULL', name: undefined, ofType: { kind: 'SCALAR', name: 'String', ofType: undefined } },
                args: [],
                isDeprecated: false,
                deprecationReason: undefined,
              },
            ],
          },
        ],
      };

      setSchema(mockSchema);
      setIsLoadingSchema(false);
      addLog('Schema fetched successfully! Found ' + mockSchema.types.length + ' types');
    }, 1500);
  };

  const handleRefreshSchema = () => {
    addLog('Refreshing schema...');
    handleFetchSchema();
  };

  const handleInsertField = (field: string) => {
    addLog(`Field inserted: ${field}`);
    // In a real implementation, this would insert the field into the query
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const loadSampleQuery1 = () => {
    setQuery(`query GetCountries {
  countries {
    code
    name
    capital
    currency
  }
}`);
    setVariables({});
    addLog('Loaded sample query: GetCountries (no variables)');
  };

  const loadSampleQuery2 = () => {
    setQuery(`mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}`);
    setVariables({
      input: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });
    addLog('Loaded sample mutation: CreateUser (with input variable)');
  };

  const loadSampleQuery3 = () => {
    setQuery(`subscription OnMessageReceived($userId: ID!) {
  messageReceived(userId: $userId) {
    id
    content
    sender {
      id
      name
    }
    timestamp
  }
}`);
    setVariables({
      userId: 'user-123',
    });
    addLog('Loaded sample subscription: OnMessageReceived (with userId)');
  };

  const loadInvalidSyntax = () => {
    setQuery(`query GetUser {
  user(id: "123") {
    id
    name
    email
    # Missing closing brace
}`);
    setVariables({});
    addLog('Loaded query with syntax error - missing closing brace');
  };

  const loadInvalidField = () => {
    setQuery(`query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    invalidField
    profile {
      avatar
    }
  }
}`);
    setVariables({ id: '123' });
    addLog('Loaded query with invalid field - "invalidField" does not exist in schema');
  };

  const clearQuery = () => {
    setQuery('');
    setVariables({});
    addLog('Query and variables cleared');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>
        GraphQL Query Panel Test Page
      </h1>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          Test the GraphQL Query Panel (Query + Variables) with keyboard shortcuts:
        </p>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li><strong>Cmd/Ctrl + Enter</strong>: Execute query</li>
          <li><strong>Cmd/Ctrl + Shift + F</strong>: Format query or variables</li>
          <li><strong>Cmd/Ctrl + Shift + V</strong>: Toggle variables panel</li>
          <li><strong>Drag splitter</strong>: Resize query/variables panels</li>
        </ul>
        <p style={{ color: '#666', marginTop: '10px' }}>
          <strong>🎯 Auto-completion Features:</strong>
        </p>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li><strong>Ctrl + Space</strong>: Trigger auto-completion manually</li>
          <li><strong>Type "query {'{'} "</strong>: See field suggestions (user, users)</li>
          <li><strong>Hover over fields</strong>: View type information and documentation</li>
          <li><strong>Type "user("</strong>: See argument suggestions with types</li>
          <li><strong>Type "@"</strong>: See directive suggestions (@include, @skip, @deprecated)</li>
        </ul>
        <p style={{ color: '#666', marginTop: '10px' }}>
          <strong>✅ Real-time Validation:</strong>
        </p>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li><strong>Syntax errors</strong>: Red squiggly lines for missing braces, invalid syntax</li>
          <li><strong>Schema errors</strong>: Validation against loaded schema (undefined fields, wrong types)</li>
          <li><strong>Hover over errors</strong>: See detailed error messages</li>
          <li><strong>Debounced validation</strong>: Validates 500ms after you stop typing</li>
          <li><strong>Test buttons</strong>: "Load Syntax Error" and "Load Schema Error" to see validation in action</li>
        </ul>
      </div>

      {/* Sample Query Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={loadSampleQuery1}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Query Sample
        </button>
        <button
          onClick={loadSampleQuery2}
          style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Mutation Sample
        </button>
        <button
          onClick={loadSampleQuery3}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Subscription Sample
        </button>
        <button
          onClick={loadInvalidSyntax}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Syntax Error
        </button>
        <button
          onClick={loadInvalidField}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Schema Error
        </button>
        <button
          onClick={handleFormat}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Format Query
        </button>
        <button
          onClick={handleExecute}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Execute Query
        </button>
        <button
          onClick={clearQuery}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Main Content - Split into Query Panel and Schema Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Query Panel */}
        <div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Query Panel</h3>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '600px',
            }}
          >
            <GraphQLQueryPanel
              query={query}
              variables={variables}
              onQueryChange={handleQueryChange}
              onVariablesChange={handleVariablesChange}
            />
          </div>
        </div>

        {/* Schema Viewer */}
        <div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Schema Documentation</h3>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '600px',
            }}
          >
            <GraphQLSchemaViewer
              schema={schema}
              schemaUrl="https://api.example.com/graphql"
              lastFetched={schema ? new Date() : undefined}
              onFetchSchema={handleFetchSchema}
              onRefreshSchema={handleRefreshSchema}
              onInsertField={handleInsertField}
              loading={isLoadingSchema}
            />
          </div>
        </div>
      </div>

      {/* Query and Variables Info */}
      <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Query Stats</h3>
          <div
            style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <p style={{ marginBottom: '8px' }}>
              <strong>Length:</strong> {query.length} characters
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Lines:</strong> {query.split('\n').length}
            </p>
            <p>
              <strong>Type:</strong>{' '}
              {query.trim().startsWith('query')
                ? 'Query'
                : query.trim().startsWith('mutation')
                ? 'Mutation'
                : query.trim().startsWith('subscription')
                ? 'Subscription'
                : 'Unknown'}
            </p>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Variables Info</h3>
          <div
            style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <p style={{ marginBottom: '8px' }}>
              <strong>Count:</strong> {Object.keys(variables).length} variable(s)
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Size:</strong> {JSON.stringify(variables).length} characters
            </p>
            <div style={{ marginTop: '8px' }}>
              <strong>Variables:</strong>
              <div style={{ marginTop: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                {Object.keys(variables).length === 0 ? (
                  <span style={{ color: '#9ca3af' }}>No variables</span>
                ) : (
                  Object.keys(variables).map((key) => (
                    <div key={key} style={{ marginBottom: '2px' }}>
                      <span style={{ color: '#6366f1' }}>${key}</span>
                      <span style={{ color: '#9ca3af' }}>: </span>
                      <span style={{ color: '#059669' }}>
                        {JSON.stringify(variables[key]).substring(0, 50)}
                        {JSON.stringify(variables[key]).length > 50 && '...'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Log */}
      <div>
        <h3 style={{ marginBottom: '10px', color: '#333' }}>Execution Log</h3>
        <div
          style={{
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            padding: '16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {executionLog.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No events yet. Try using the editor...</p>
          ) : (
            executionLog.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphQLEditorTest;
