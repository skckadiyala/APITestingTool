import { useState, useRef, useEffect } from 'react';
import { useVariables } from '../../hooks/useVariables';

interface VariableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export default function VariableTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  rows = 10,
}: VariableTextareaProps) {
  const { allVariables } = useVariables();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredVariables, setFilteredVariables] = useState(allVariables);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Update filtered variables when typing
  useEffect(() => {
    if (typeof value !== 'string') {
      setShowAutocomplete(false);
      return;
    }
    
    const cursorPos = textareaRef.current?.selectionStart || 0;
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
        // Calculate position for autocomplete dropdown
        updateAutocompletePosition();
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [value, allVariables]);

  const updateAutocompletePosition = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    
    // Get the position of the cursor relative to the textarea
    const textBeforeCursor = value.slice(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length;
    
    // Approximate position (this is a rough estimate)
    const lineHeight = 20; // Approximate line height in pixels
    const charWidth = 8; // Approximate character width in pixels
    
    const rect = textarea.getBoundingClientRect();
    const top = Math.min(currentLine * lineHeight - textarea.scrollTop + 25, 300);
    const left = Math.min(currentCol * charWidth - textarea.scrollLeft, rect.width - 300);
    
    setAutocompletePosition({ top, left });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
        scrollToSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
        scrollToSelected();
      } else if (e.key === 'Enter' && e.ctrlKey === false && e.shiftKey === false) {
        e.preventDefault();
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex].key);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex].key);
        }
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    }
  };

  const scrollToSelected = () => {
    // Scroll the selected item into view
    setTimeout(() => {
      const selectedElement = autocompleteRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  };

  const insertVariable = (variableName: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
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
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="relative">
      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={className}
      />

      {/* Autocomplete dropdown */}
      {showAutocomplete && filteredVariables.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowAutocomplete(false)}
          />
          <div
            ref={autocompleteRef}
            style={{
              position: 'absolute',
              top: `${autocompletePosition.top}px`,
              left: `${autocompletePosition.left}px`,
            }}
            className="z-20 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredVariables.map((variable, index) => (
              <button
                key={variable.key}
                data-index={index}
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
