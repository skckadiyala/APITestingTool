import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import VariableInput from '../common/VariableInput';
import VariableTextarea from '../common/VariableTextarea';
import { useVariables } from '../../hooks/useVariables';

export type BodyType = 'none' | 'json' | 'x-www-form-urlencoded' | 'form-data' | 'xml' | 'raw' | 'binary';

interface BodyEditorProps {
  type: BodyType;
  content: string;
  onTypeChange: (type: BodyType) => void;
  onContentChange: (content: string) => void;
  formData?: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>;
  onFormDataChange?: (formData: Array<{ id: string; key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => void;
}

export default function BodyEditor({
  type,
  content,
  onTypeChange,
  onContentChange,
  formData = [],
  onFormDataChange,
}: BodyEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { allVariables } = useVariables();

  // Ensure there's always at least one empty row at the end for form data
  useEffect(() => {
    if ((type === 'form-data' || type === 'x-www-form-urlencoded') && onFormDataChange) {
      if (formData.length === 0) {
        onFormDataChange([{ id: Date.now().toString(), key: '', value: '', type: 'text', enabled: false }]);
      } else {
        // Check if the last row is empty
        const lastField = formData[formData.length - 1];
        const isEmpty = !lastField.key && !lastField.value;
        
        if (!isEmpty) {
          // Add an empty row at the end
          onFormDataChange([...formData, { id: Date.now().toString(), key: '', value: '', type: 'text', enabled: false }]);
        }
      }
    }
  }, [type, formData.length]);

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      onContentChange(formatted);
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const validateJSON = (value: string) => {
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const addFormDataField = () => {
    if (onFormDataChange) {
      onFormDataChange([
        ...formData,
        { id: Date.now().toString(), key: '', value: '', type: 'text', enabled: false },
      ]);
    }
  };

  const updateFormDataField = (id: string, field: string, value: string | boolean) => {
    if (onFormDataChange) {
      const updatedData = formData.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-enable checkbox when key or value is filled (but only if it's not manually set)
          if (field === 'key' || field === 'value') {
            const hasContent = updatedItem.key || updatedItem.value;
            // Only auto-enable if the item was previously empty (enabled === false)
            if (hasContent && !item.enabled && field !== 'enabled') {
              updatedItem.enabled = true;
            }
          }
          
          return updatedItem;
        }
        return item;
      });
      
      // Auto-add new empty row if the last row is being edited and has content
      const lastField = updatedData[updatedData.length - 1];
      const isLastRow = id === lastField?.id;
      const hasContent = lastField && (lastField.key || lastField.value);
      
      if (isLastRow && hasContent) {
        onFormDataChange([...updatedData, { id: Date.now().toString(), key: '', value: '', type: 'text', enabled: false }]);
      } else {
        onFormDataChange(updatedData);
      }
    }
  };

  const removeFormDataField = (id: string) => {
    if (onFormDataChange) {
      onFormDataChange(formData.filter((item) => item.id !== id));
    }
  };

  const handleFileSelect = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFormDataChange) {
      updateFormDataField(id, 'value', file.name);
    }
  };

  // Setup Monaco Editor with variable autocomplete
  const handleEditorMount = (_editor: any, monaco: typeof Monaco) => {
    // Register completion provider for variables
    monaco.languages.registerCompletionItemProvider('json', {
      triggerCharacters: ['{'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Check if we're inside {{
        const match = textUntilPosition.match(/\{\{([^}]*)$/);
        if (!match) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = allVariables.map((variable) => ({
          label: variable.key,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: variable.type === 'secret' ? '(secret)' : variable.value,
          documentation: `Source: ${variable.source}`,
          insertText: variable.key,
          range: range,
        }));

        return { suggestions };
      },
    });

    // Register for XML as well
    monaco.languages.registerCompletionItemProvider('xml', {
      triggerCharacters: ['{'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const match = textUntilPosition.match(/\{\{([^}]*)$/);
        if (!match) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = allVariables.map((variable) => ({
          label: variable.key,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: variable.type === 'secret' ? '(secret)' : variable.value,
          documentation: `Source: ${variable.source}`,
          insertText: variable.key,
          range: range,
        }));

        return { suggestions };
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* Body Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => onTypeChange('none')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'none'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          None
        </button>
        <button
          onClick={() => onTypeChange('json')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'json'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => onTypeChange('x-www-form-urlencoded')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'x-www-form-urlencoded'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          x-www-form-urlencoded
        </button>
        <button
          onClick={() => onTypeChange('form-data')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'form-data'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Form Data
        </button>
        <button
          onClick={() => onTypeChange('xml')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'xml'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          XML
        </button>
        <button
          onClick={() => onTypeChange('raw')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'raw'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Raw
        </button>
        <button
          onClick={() => onTypeChange('binary')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            type === 'binary'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Binary
        </button>
      </div>

      {/* JSON Editor */}
      {type === 'json' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {jsonError ? (
                <span className="text-red-600 dark:text-red-400">⚠️ {jsonError}</span>
              ) : (
                <span>💡 Tip: Type <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{'{{'}</code> to insert variables</span>
              )}
            </div>
            <button
              onClick={formatJSON}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Format JSON
            </button>
          </div>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <Editor
              height="300px"
              defaultLanguage="json"
              value={content}
              onChange={(value) => {
                onContentChange(value || '');
                validateJSON(value || '');
              }}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>
      )}

      {/* x-www-form-urlencoded Editor */}
      {type === 'x-www-form-urlencoded' && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL Encoded Form Fields</div>
          
          {formData.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              {/* Enabled Checkbox */}
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={(e) => updateFormDataField(field.id, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              {/* Key Input */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateFormDataField(field.id, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Value Input */}
              <div className="col-span-6">
                <VariableInput
                  value={field.value}
                  onChange={(value) => updateFormDataField(field.id, 'value', value)}
                  placeholder="Value (use {{variable}} for variables)"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeFormDataField(field.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Data Editor */}
      {type === 'form-data' && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Form Fields</div>
          
          {formData.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              {/* Enabled Checkbox */}
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={(e) => updateFormDataField(field.id, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              {/* Key Input */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateFormDataField(field.id, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Type Selector */}
              <div className="col-span-2">
                <select
                  value={field.type}
                  onChange={(e) => updateFormDataField(field.id, 'type', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="text">Text</option>
                  <option value="file">File</option>
                </select>
              </div>

              {/* Value Input or File Selector */}
              <div className="col-span-5">
                {field.type === 'text' ? (
                  <VariableInput
                    value={field.value}
                    onChange={(value) => updateFormDataField(field.id, 'value', value)}
                    placeholder="Value (use {{variable}} for variables)"
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => handleFileSelect(field.id, e)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs cursor-pointer flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {field.value || 'Choose file'}
                    </div>
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeFormDataField(field.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* XML Editor */}
      {type === 'xml' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            💡 Tip: Type <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{'{{'}</code> to insert variables
          </div>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <Editor
            height="300px"
            defaultLanguage="xml"
            value={content}
            onChange={(value) => onContentChange(value || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
        </div>
      )}

      {/* Raw Text Editor */}
      {type === 'raw' && (
        <VariableTextarea
          value={content}
          onChange={onContentChange}
          placeholder="Enter raw body content (use {{variable}} for variables)..."
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}

      {/* Binary File Upload */}
      {type === 'binary' && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="mt-4">
              <label className="cursor-pointer">
                <span className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md inline-block">
                  Select File
                </span>
                <input type="file" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onContentChange(file.name);
                  }
                }} />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {content || 'No file selected'}
            </p>
          </div>
        </div>
      )}

      {/* None State */}
      {type === 'none' && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          This request does not have a body
        </div>
      )}
    </div>
  );
}
