import { useState, useEffect } from 'react';
import VariableInput from '../common/VariableInput';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  placeholder?: { key: string; value: string };
  suggestions?: string[];
  showDescription?: boolean;
  bulkEditMode?: boolean;
}

export default function KeyValueEditor({
  pairs,
  onChange,
  placeholder = { key: 'Key', value: 'Value' },
  suggestions = [],
  showDescription = false,
  bulkEditMode = false,
}: KeyValueEditorProps) {
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  // const addPair = () => {
  //   const newPair: KeyValuePair = {
  //     id: Date.now().toString(),
  //     key: '',
  //     value: '',
  //     description: '',
  //     enabled: false,
  //   };
  //   onChange([...pairs, newPair]);
  // };

  const updatePair = (id: string, field: keyof KeyValuePair, value: string | boolean) => {
    const updated = pairs.map((pair) => {
      if (pair.id === id) {
        const updatedPair = { ...pair, [field]: value };
        
        // Auto-enable checkbox when key or value is filled (but only if it's not manually set)
        if (field === 'key' || field === 'value' || field === 'description') {
          const hasContent = updatedPair.key || updatedPair.value || updatedPair.description;
          // Only auto-enable if the pair was previously empty (enabled === false)
          if (hasContent && !pair.enabled) { //  && field !== 'enabled'
            updatedPair.enabled = true;
          }
        }
        
        return updatedPair;
      }
      return pair;
    });
    
    // Auto-add new empty row if the last row is being edited and has content
    const lastPair = updated[updated.length - 1];
    const isLastRow = id === lastPair?.id;
    const hasContent = lastPair && (lastPair.key || lastPair.value || lastPair.description);
    
    if (isLastRow && hasContent) {
      const newPair: KeyValuePair = {
        id: Date.now().toString(),
        key: '',
        value: '',
        description: '',
        enabled: false,
      };
      onChange([...updated, newPair]);
    } else {
      onChange(updated);
    }
  };

  const removePair = (id: string) => {
    onChange(pairs.filter((pair) => pair.id !== id));
  };

  const toggleBulkMode = () => {
    if (!isBulkMode) {
      // Convert to bulk text
      const text = pairs
        .map((pair) => `${pair.key}:${pair.value}`)
        .join('\n');
      setBulkText(text);
    } else {
      // Parse bulk text
      const lines = bulkText.split('\n').filter((line) => line.trim());
      const newPairs: KeyValuePair[] = lines.map((line, index) => {
        const [key, ...valueParts] = line.split(':');
        return {
          id: `${Date.now()}-${index}`,
          key: key.trim(),
          value: valueParts.join(':').trim(),
          enabled: true,
        };
      });
      onChange(newPairs);
    }
    setIsBulkMode(!isBulkMode);
  };

  const filteredSuggestions = (input: string) => {
    return suggestions.filter((s) =>
      s.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Ensure there's always at least one empty row at the end
  useEffect(() => {
    if (pairs.length === 0) {
      const newPair: KeyValuePair = {
        id: Date.now().toString(),
        key: '',
        value: '',
        description: '',
        enabled: false,
      };
      onChange([newPair]);
    } else {
      // Check if the last row is empty
      const lastPair = pairs[pairs.length - 1];
      const isEmpty = !lastPair.key && !lastPair.value && !lastPair.description;
      
      if (!isEmpty) {
        // Add an empty row at the end
        const newPair: KeyValuePair = {
          id: Date.now().toString(),
          key: '',
          value: '',
          description: '',
          enabled: false,
        };
        onChange([...pairs, newPair]);
      }
    }
  }, [pairs.length]);

  if (isBulkMode) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter one key-value pair per line in the format: <code>key:value</code>
          </p>
          <button
            onClick={toggleBulkMode}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            ← Key-Value Editor
          </button>
        </div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Content-Type:application/json&#10;Authorization:Bearer token&#10;X-API-Key:your-api-key"
          className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {pairs.filter((p) => p.enabled).length} enabled
          </span>
          {pairs.length > 0 && (
            <button
              onClick={() => {
                const allEnabled = pairs.every((p) => p.enabled);
                onChange(pairs.map((p) => ({ ...p, enabled: !allEnabled })));
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {pairs.every((p) => p.enabled) ? 'Disable all' : 'Enable all'}
            </button>
          )}
        </div>
        {bulkEditMode && (
          <button
            onClick={toggleBulkMode}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Bulk Edit
          </button>
        )}
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 px-1">
        <div className="col-span-1"></div>
        <div className={showDescription ? 'col-span-3' : 'col-span-5'}>KEY</div>
        <div className={showDescription ? 'col-span-3' : 'col-span-5'}>VALUE</div>
        {showDescription && <div className="col-span-4">DESCRIPTION</div>}
        <div className="col-span-1"></div>
      </div>

      {/* Key-Value Rows */}
      {pairs.map((pair) => (
        <div key={pair.id} className="grid grid-cols-12 gap-2 items-center">
          {/* Enabled Checkbox */}
          <div className="col-span-1 flex justify-center">
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={(e) => updatePair(pair.id, 'enabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>

          {/* Key Input */}
          <div className={`${showDescription ? 'col-span-3' : 'col-span-5'} relative`}>
            <input
              type="text"
              value={pair.key}
              onChange={(e) => {
                updatePair(pair.id, 'key', e.target.value);
                setShowSuggestions(e.target.value ? pair.id : null);
              }}
              onFocus={() => pair.key && setShowSuggestions(pair.id)}
              onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
              placeholder={placeholder.key}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions === pair.id && suggestions.length > 0 && filteredSuggestions(pair.key).length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredSuggestions(pair.key).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      updatePair(pair.id, 'key', suggestion);
                      setShowSuggestions(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Value Input with Variable Support */}
          <div className={showDescription ? 'col-span-3' : 'col-span-5'}>
            <VariableInput
              value={pair.value}
              onChange={(value) => updatePair(pair.id, 'value', value)}
              placeholder={placeholder.value}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description Input (Optional) */}
          {showDescription && (
            <div className="col-span-4">
              <input
                type="text"
                value={pair.description || ''}
                onChange={(e) => updatePair(pair.id, 'description', e.target.value)}
                placeholder="Description"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Delete Button */}
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => removePair(pair.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
