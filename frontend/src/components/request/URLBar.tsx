import { useState, useRef, useEffect } from 'react';
import VariableInput from '../common/VariableInput';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useCollectionStore } from '../../stores/collectionStore';

type RequestType = 'REST' | 'GRAPHQL' | 'WEBSOCKET';

interface URLBarProps {
  method: string;
  url: string;
  requestType?: RequestType;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  isExistingRequest?: boolean;
  isDirty?: boolean;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  HEAD: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  OPTIONS: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

export default function URLBar({
  method,
  url,
  requestType = 'REST',
  onMethodChange,
  onUrlChange,
  // onRequestTypeChange,
  onSend,
  onSave,
  isLoading = false,
  isSaved = false,
  isExistingRequest = false,
  isDirty = false,
}: URLBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [urlHistory] = useState<string[]>([]);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { currentWorkspaceId } = useCollectionStore();
  const { canEdit } = useWorkspacePermission(currentWorkspaceId);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHistory]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSend();
    }
  };

  const filteredHistory = urlHistory.filter((historyUrl) =>
    historyUrl.toLowerCase().includes(url.toLowerCase())
  );

  // Get URL placeholder based on request type
  const getUrlPlaceholder = () => {
    switch (requestType) {
      case 'GRAPHQL':
        return 'Enter GraphQL endpoint (use {{variable}} for variables)';
      case 'WEBSOCKET':
        return 'Enter WebSocket URL (use {{variable}} for variables)';
      default:
        return 'Enter request URL (use {{variable}} for variables)';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex gap-2 items-center">
        {/* Method Dropdown (REST only) or POST Badge (GraphQL) */}
        {requestType === 'REST' ? (
          <div className="relative">
            <select
              value={method}
              onChange={(e) => onMethodChange(e.target.value)}
              className={`px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[90px] ${
                METHOD_COLORS[method] || 'bg-white dark:bg-gray-700'
              }`}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ) : requestType === 'GRAPHQL' ? (
          <div
            className="px-2 py-1.5 rounded-md font-semibold text-xs min-w-[90px] text-center bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            title="GraphQL requests always use POST method"
          >
            POST
          </div>
        ) : (
          <div
            className="px-2 py-1.5 rounded-md font-semibold text-xs min-w-[90px] text-center bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
            title="WebSocket connection"
          >
            WS
          </div>
        )}

        {/* URL Input with Variable Support */}
        <div className="flex-1 relative">
          <div className="relative">
            <VariableInput
              value={url}
              onChange={(newUrl) => {
                onUrlChange(newUrl);
                setShowHistory(newUrl.length > 0);
              }}
              onKeyDown={handleKeyPress}
              placeholder={getUrlPlaceholder()}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showHistory && filteredHistory.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredHistory.map((historyUrl, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onUrlChange(historyUrl);
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{historyUrl}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="relative group">
          <button
            onClick={onSend}
            disabled={isLoading || !url}
            title="Send request (Ctrl+Enter or ⌘+Enter)"
            className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 min-w-[80px] justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>

        {/* Save Button */}
        {canEdit && (
          <button
            onClick={onSave}
            disabled={!url || (isExistingRequest && !isDirty)}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
            title={
              isExistingRequest 
                ? (isDirty ? 'Save changes to this request' : 'No changes to save')
                : 'Save as new request to collection'
            }
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                {isExistingRequest ? 'Save' : 'Save As'}
              </>
          )}
        </button>
      )}
      </div>
    </div>
  );
}
