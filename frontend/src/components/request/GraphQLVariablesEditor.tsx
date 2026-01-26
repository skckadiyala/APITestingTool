import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { GraphQLQueryVariables } from '../../types/request.types';

interface GraphQLVariablesEditorProps {
  variables: GraphQLQueryVariables;
  onVariablesChange: (variables: GraphQLQueryVariables) => void;
  query?: string;
  onFormat?: () => void;
  readOnly?: boolean;
  height?: string | number;
}

interface VariableDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * GraphQL Variables Editor Component
 * 
 * A JSON editor component for editing GraphQL query variables
 * with syntax highlighting, validation, and formatting.
 */
export const GraphQLVariablesEditor: React.FC<GraphQLVariablesEditorProps> = ({
  variables,
  onVariablesChange,
  query,
  onFormat,
  readOnly = false,
  height = '200px',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [variablesText, setVariablesText] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [variableDefinitions, setVariableDefinitions] = useState<VariableDefinition[]>([]);

  /**
   * Parse variable definitions from GraphQL query
   */
  const parseVariableDefinitions = (queryText: string): VariableDefinition[] => {
    if (!queryText) return [];

    try {
      // Match variable definitions like: $id: ID!, $name: String, $count: Int = 10
      const varRegex = /\$(\w+)\s*:\s*([^,\)]+?)(?:\s*=\s*([^,\)]+))?(?=[,\)])/g;
      const definitions: VariableDefinition[] = [];
      let match;

      while ((match = varRegex.exec(queryText)) !== null) {
        const [, name, type, defaultValue] = match;
        const required = type.trim().endsWith('!');
        const cleanType = type.trim().replace('!', '');

        definitions.push({
          name,
          type: cleanType,
          required,
          defaultValue: defaultValue ? defaultValue.trim() : undefined,
        });
      }

      return definitions;
    } catch (error) {
      console.error('Error parsing variable definitions:', error);
      return [];
    }
  };

  /**
   * Initialize variables text from object
   */
  useEffect(() => {
    try {
      const text = JSON.stringify(variables, null, 2);
      setVariablesText(text);
      setParseError(null);
    } catch (error) {
      console.error('Error stringifying variables:', error);
      setVariablesText('{}');
    }
  }, [variables]);

  /**
   * Parse variable definitions from query
   */
  useEffect(() => {
    if (query) {
      const definitions = parseVariableDefinitions(query);
      setVariableDefinitions(definitions);
    } else {
      setVariableDefinitions([]);
    }
  }, [query]);

  /**
   * Handle editor mount
   */
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) => {
    editorRef.current = editor;

    // Add keyboard shortcut for formatting (Cmd/Ctrl + Shift + F)
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF,
      () => {
        if (onFormat) {
          onFormat();
        } else {
          formatVariables();
        }
      }
    );
  };

  /**
   * Handle editor value change
   */
  const handleChange = (value: string | undefined) => {
    if (value === undefined) return;

    setVariablesText(value);

    try {
      // Try to parse JSON
      const parsed = JSON.parse(value);
      setParseError(null);

      // Validate against variable definitions
      const validationErrors = validateVariables(parsed, variableDefinitions);
      if (validationErrors.length === 0) {
        onVariablesChange(parsed);
      }
    } catch (error: any) {
      setParseError(error.message);
    }
  };

  /**
   * Validate variables against definitions
   */
  const validateVariables = (
    vars: GraphQLQueryVariables,
    definitions: VariableDefinition[]
  ): string[] => {
    const errors: string[] = [];

    // Check for required variables
    definitions.forEach((def) => {
      if (def.required && !(def.name in vars)) {
        errors.push(`Required variable "$${def.name}" is missing`);
      }
    });

    // Check for extra variables not in query
    const definedNames = new Set(definitions.map((d) => d.name));
    Object.keys(vars).forEach((key) => {
      if (!definedNames.has(key) && definitions.length > 0) {
        console.warn(`Variable "$${key}" is not defined in query`);
      }
    });

    return errors;
  };

  /**
   * Format the variables JSON
   */
  const formatVariables = () => {
    try {
      const parsed = JSON.parse(variablesText);
      const formatted = JSON.stringify(parsed, null, 2);
      setVariablesText(formatted);
      onVariablesChange(parsed);
      setParseError(null);
    } catch (error: any) {
      setParseError(error.message);
    }
  };

  /**
   * Editor configuration options
   */
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    tabSize: 2,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    folding: true,
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    formatOnType: true,
  };

  /**
   * Get variable count
   */
  const variableCount = Object.keys(variables).length;
  const definedCount = variableDefinitions.length;

  return (
    <div className="graphql-variables-editor-container">
      {/* Header with variable info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #454545',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#d4d4d4', fontSize: '13px', fontWeight: 500 }}>
            Variables
          </span>
          {definedCount > 0 && (
            <span style={{ color: '#858585', fontSize: '12px' }}>
              {variableCount} of {definedCount} defined
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {parseError && (
            <span
              style={{
                color: '#f48771',
                fontSize: '12px',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={parseError}
            >
              ⚠️ {parseError}
            </span>
          )}
          <button
            onClick={formatVariables}
            disabled={readOnly}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#0e639c',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: readOnly ? 'not-allowed' : 'pointer',
              opacity: readOnly ? 0.5 : 1,
            }}
            title="Format JSON (Cmd/Ctrl + Shift + F)"
          >
            Format
          </button>
        </div>
      </div>

      {/* Variable hints */}
      {variableDefinitions.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#252526',
            borderBottom: '1px solid #454545',
            fontSize: '12px',
            color: '#858585',
          }}
        >
          <div style={{ marginBottom: '4px', color: '#d4d4d4' }}>Expected variables:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {variableDefinitions.map((def) => (
              <span
                key={def.name}
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#3c3c3c',
                  borderRadius: '3px',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#9cdcfe' }}>${def.name}</span>
                <span style={{ color: '#858585' }}>: </span>
                <span style={{ color: def.required ? '#f48771' : '#4ec9b0' }}>
                  {def.type}
                  {def.required ? '!' : ''}
                </span>
                {def.defaultValue && (
                  <span style={{ color: '#858585' }}> = {def.defaultValue}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* JSON Editor */}
      <div style={{ height }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          language="json"
          value={variablesText}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};

export default GraphQLVariablesEditor;
