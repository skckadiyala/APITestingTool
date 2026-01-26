import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { GraphQLSchema } from '../../types/request.types';
import { createCompletionProvider } from '../../utils/graphql/completionProvider';
import { createValidator } from '../../utils/graphql/validator';
import type { ValidationResult } from '../../utils/graphql/validator';

interface GraphQLEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  schema?: GraphQLSchema;
  onFormat?: () => void;
  onExecute?: () => void;
  readOnly?: boolean;
  height?: string | number;
}

/**
 * GraphQL Query Editor Component
 * 
 * A code editor component specifically designed for editing GraphQL queries
 * with syntax highlighting, auto-formatting, and keyboard shortcuts.
 */
export const GraphQLEditor: React.FC<GraphQLEditorProps> = ({
  query,
  onQueryChange,
  schema,
  onFormat,
  onExecute,
  readOnly = false,
  height = '400px',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const completionProviderRef = useRef<any>(null);
  const validatorRef = useRef<any>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  /**
   * Validate the query and show errors in the editor
   */
  const validateAndShowErrors = useCallback((queryToValidate: string) => {
    if (!editorRef.current || !monacoRef.current || !validatorRef.current) {
      return;
    }

    const result: ValidationResult = validatorRef.current.validate(queryToValidate);
    const model = editorRef.current.getModel();
    
    if (!model) {
      return;
    }

    // Convert validation errors to Monaco markers
    const markers: monaco.editor.IMarkerData[] = result.errors.map(error => ({
      severity: error.severity === 'error' 
        ? monacoRef.current!.MarkerSeverity.Error 
        : monacoRef.current!.MarkerSeverity.Warning,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.endLine || error.line,
      endColumn: error.endColumn || error.column + 1,
      message: error.message,
      source: 'GraphQL',
    }));

    // Set markers on the model
    monacoRef.current.editor.setModelMarkers(model, 'graphql', markers);
  }, []);

  /**
   * Debounced validation function
   */
  const debouncedValidate = useCallback((queryToValidate: string) => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Don't validate incomplete queries immediately
    if (validatorRef.current?.isIncompleteQuery(queryToValidate)) {
      // Still validate after a longer delay for incomplete queries
      validationTimeoutRef.current = setTimeout(() => {
        validateAndShowErrors(queryToValidate);
      }, 1000);
      return;
    }

    // Validate complete queries after a short delay
    validationTimeoutRef.current = setTimeout(() => {
      validateAndShowErrors(queryToValidate);
    }, 500);
  }, [validateAndShowErrors]);

  /**
   * Handle editor mount - setup editor instance and keyboard shortcuts
   */
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Initialize completion provider
    completionProviderRef.current = createCompletionProvider(schema);

    // Initialize validator
    validatorRef.current = createValidator(schema);

    // Register completion provider
    const completionDisposable = monacoInstance.languages.registerCompletionItemProvider('graphql', {
      provideCompletionItems: (model, position) => {
        return completionProviderRef.current?.provideCompletionItems(model, position) || { suggestions: [] };
      },
    });
    disposablesRef.current.push(completionDisposable);

    // Register hover provider
    const hoverDisposable = monacoInstance.languages.registerHoverProvider('graphql', {
      provideHover: (model, position) => {
        return completionProviderRef.current?.provideHover(model, position) || null;
      },
    });
    disposablesRef.current.push(hoverDisposable);

    // Register signature help provider
    const signatureDisposable = monacoInstance.languages.registerSignatureHelpProvider('graphql', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        return completionProviderRef.current?.provideSignatureHelp(model, position) || null;
      },
    });
    disposablesRef.current.push(signatureDisposable);

    // Set up validation on content change
    const model = editor.getModel();
    if (model) {
      const changeDisposable = model.onDidChangeContent(() => {
        const currentValue = model.getValue();
        debouncedValidate(currentValue);
      });
      disposablesRef.current.push(changeDisposable);
    }

    // Run initial validation
    validateAndShowErrors(query);

    // Add keyboard shortcuts
    // Cmd/Ctrl + Enter to execute
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      () => {
        if (onExecute) {
          onExecute();
        }
      }
    );

    // Cmd/Ctrl + Shift + F to format
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF,
      () => {
        if (onFormat) {
          onFormat();
        } else {
          // Default formatting using Monaco's built-in formatter
          editor.getAction('editor.action.formatDocument')?.run();
        }
      }
    );

    // Focus the editor
    editor.focus();
  };

  /**
   * Handle editor value change
   */
  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onQueryChange(value);
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
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
  };

  /**
   * Format the current query using Prettier
   */
  const formatQuery = async () => {
    if (!editorRef.current) return;

    try {
      const prettier = await import('prettier');
      const graphqlParser = await import('prettier/parser-graphql');

      const formatted = await prettier.format(query, {
        parser: 'graphql',
        plugins: [graphqlParser],
        printWidth: 80,
        tabWidth: 2,
      });

      onQueryChange(formatted);
    } catch (error) {
      console.error('Error formatting GraphQL query:', error);
      // Fallback to Monaco's built-in formatter
      editorRef.current?.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Expose format method via ref
  useEffect(() => {
    if (onFormat && editorRef.current) {
      // Store format method reference
      (window as any).__graphqlEditorFormat = formatQuery;
    }
  }, [onFormat, query]);

  // Update schema in completion provider and validator when it changes
  useEffect(() => {
    if (completionProviderRef.current) {
      completionProviderRef.current.updateSchema(schema);
    }
    
    if (validatorRef.current) {
      validatorRef.current.updateSchema(schema);
      // Re-validate with new schema
      if (query) {
        validateAndShowErrors(query);
      }
    }
  }, [schema, query, validateAndShowErrors]);

  // Cleanup disposables and timeout on unmount
  useEffect(() => {
    return () => {
      // Clear validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      // Dispose all Monaco disposables
      disposablesRef.current.forEach(disposable => disposable.dispose());
      disposablesRef.current = [];
    };
  }, []);

  return (
    <div className="graphql-editor-container" style={{ height }}>
      <Editor
        height="100%"
        defaultLanguage="graphql"
        language="graphql"
        value={query}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
        theme="vs-dark"
      />
    </div>
  );
};

export default GraphQLEditor;
