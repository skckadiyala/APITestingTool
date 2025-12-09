import { useState, useRef, useEffect } from 'react';
import { useVariables } from '../../hooks/useVariables';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function VariableInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  disabled = false,
}: VariableInputProps) {
  const { allVariables, resolveVariable, isVariableDefined } = useVariables();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredVariables, setFilteredVariables] = useState(allVariables);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update filtered variables when typing
  useEffect(() => {
    // Ensure value is a string before processing
    if (typeof value !== 'string') {
      setShowAutocomplete(false);
      return;
    }
    
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    
    // Check if we're typing inside {{}}
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    const lastCloseBrace = textBeforeCursor.lastIndexOf('}}');
    
    if (lastOpenBrace > lastCloseBrace && lastOpenBrace !== -1) {
      const variablePrefix = textBeforeCursor.slice(lastOpenBrace + 2).trim();
      
      const filtered = allVariables.filter((v) =>
        v.key.toLowerCase().includes(variablePrefix.toLowerCase())
      );
      setFilteredVariables(filtered);
      setSelectedIndex(0);
      
      if (filtered.length > 0) {
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [value, allVariables]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex].key);
        }
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    }
    
    onKeyDown?.(e);
  };

  const insertVariable = (variableName: string) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    const newValue = 
      textBeforeCursor.slice(0, lastOpenBrace + 2) +
      variableName +
      '}}' +
      textAfterCursor;
    
    onChange(newValue);
    setShowAutocomplete(false);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newCursorPos = lastOpenBrace + 2 + variableName.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current?.focus();
    }, 0);
  };

  // Create tooltip text for variables
  const getTooltipText = () => {
    // Ensure value is a string before using matchAll
    if (typeof value !== 'string') return undefined;
    
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = Array.from(value.matchAll(regex));
    if (matches.length === 0) return undefined;
    
    const tooltips = matches.map((match) => {
      const varName = match[1].trim();
      const isDefined = isVariableDefined(varName);
      if (isDefined) {
        const varValue = resolveVariable(varName);
        return `${varName}: ${varValue}`;
      }
      return `${varName}: Undefined`;
    });
    
    return tooltips.join('\n');
  };

  return (
    <div className="relative">
      {/* Actual input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        title={getTooltipText()}
      />

      {/* Autocomplete dropdown */}
      {showAutocomplete && filteredVariables.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowAutocomplete(false)}
          />
          <div
            className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredVariables.map((variable, index) => (
              <button
                key={variable.key}
                onClick={() => insertVariable(variable.key)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  index === selectedIndex ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {variable.key}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {variable.type === 'secret' ? '••••••' : variable.value}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                    {variable.source}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
