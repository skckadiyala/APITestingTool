import React, { useState } from 'react';
import GraphQLEditor from './GraphQLEditor';
import GraphQLVariablesEditor from './GraphQLVariablesEditor';
import GraphQLSchemaExplorer from './GraphQLSchemaExplorer';
import type { GraphQLQueryVariables, GraphQLSchema } from '../../types/request.types';

interface GraphQLQueryPanelProps {
  query: string;
  variables: GraphQLQueryVariables;
  onQueryChange: (query: string) => void;
  onVariablesChange: (variables: GraphQLQueryVariables) => void;
  schema?: GraphQLSchema;
  schemaLoading?: boolean;
  onInsertField?: (field: string) => void;
  readOnly?: boolean;
}

/**
 * GraphQL Query Panel Component (Postman-style layout)
 * 
 * Horizontal split layout:
 * - Left: Schema explorer (30%)
 * - Right: Query editor (top 60%) + Variables editor (bottom 40%)
 */
export const GraphQLQueryPanel: React.FC<GraphQLQueryPanelProps> = ({
  query,
  variables,
  onQueryChange,
  onVariablesChange,
  schema,
  schemaLoading = false,
  onInsertField,
  readOnly = false,
}) => {
  const [showVariables, setShowVariables] = useState(true);
  const [showSchema, setShowSchema] = useState(true);
  const [queryHeight, setQueryHeight] = useState(60); // Percentage for query/variables split
  const [schemaWidth, setSchemaWidth] = useState(30); // Percentage for schema panel width

  const handleFormatQuery = () => {
    // Format query will be handled by GraphQLEditor
    console.log('Format query triggered');
  };

  const handleFormatVariables = () => {
    // Format variables will be handled by GraphQLVariablesEditor
    console.log('Format variables triggered');
  };

  /**
   * Handle mouse down on vertical splitter for resizing query/variables
   */
  const handleVerticalSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startY = e.clientY;
    const startHeight = queryHeight;
    const containerHeight = (e.currentTarget.parentElement?.clientHeight || 600);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = (deltaY / containerHeight) * 100;
      const newHeight = Math.min(Math.max(startHeight + deltaPercent, 30), 80);
      setQueryHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * Handle mouse down on horizontal splitter for resizing schema panel
   */
  const handleHorizontalSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = schemaWidth;
    const containerWidth = (e.currentTarget.parentElement?.clientWidth || 1000);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 20), 50);
      setSchemaWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #454545',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#d4d4d4', fontSize: '13px', fontWeight: 500 }}>
            GraphQL Query
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSchema(!showSchema)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: showSchema ? '#0e639c' : '#3c3c3c',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
            title="Toggle Schema Explorer"
          >
            {showSchema ? 'Hide' : 'Show'} Schema
          </button>
          <button
            onClick={() => setShowVariables(!showVariables)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: showVariables ? '#0e639c' : '#3c3c3c',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
            title="Toggle Variables Panel (Cmd/Ctrl + Shift + V)"
          >
            {showVariables ? 'Hide' : 'Show'} Variables
          </button>
        </div>
      </div>

      {/* Main Content - Horizontal Split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Schema Explorer */}
        {showSchema && (
          <>
            <div style={{ width: `${schemaWidth}%`, height: '100%', overflow: 'hidden' }}>
              <GraphQLSchemaExplorer
                schema={schema}
                loading={schemaLoading}
                onInsertField={onInsertField}
                onQueryGenerate={onQueryChange}
              />
            </div>

            {/* Horizontal Splitter */}
            <div
              onMouseDown={handleHorizontalSplitterMouseDown}
              style={{
                width: '4px',
                backgroundColor: '#454545',
                cursor: 'ew-resize',
                position: 'relative',
                zIndex: 10,
              }}
              title="Drag to resize"
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '2px',
                  height: '40px',
                  backgroundColor: '#858585',
                  borderRadius: '2px',
                }}
              />
            </div>
          </>
        )}

        {/* Right Panel - Query + Variables */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Query Editor */}
          <div style={{ flex: showVariables ? `0 0 ${queryHeight}%` : '1', minHeight: '200px' }}>
            <GraphQLEditor
              query={query}
              onQueryChange={onQueryChange}
              schema={schema}
              onFormat={handleFormatQuery}
              readOnly={readOnly}
              height="100%"
            />
          </div>

          {/* Vertical Splitter (Query/Variables) */}
          {showVariables && (
            <div
              onMouseDown={handleVerticalSplitterMouseDown}
              style={{
                height: '4px',
                backgroundColor: '#454545',
                cursor: 'ns-resize',
                position: 'relative',
                zIndex: 10,
              }}
              title="Drag to resize"
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '2px',
                  backgroundColor: '#858585',
                  borderRadius: '2px',
                }}
              />
            </div>
          )}

          {/* Variables Editor */}
          {showVariables && (
            <div style={{ flex: 1, minHeight: '150px' }}>
              <GraphQLVariablesEditor
                variables={variables}
                onVariablesChange={onVariablesChange}
                query={query}
                onFormat={handleFormatVariables}
                readOnly={readOnly}
                height="100%"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphQLQueryPanel;
