import { useState } from 'react';

interface BottomPanelProps {
  consoleLogs?: Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
  onClear?: () => void;
}

export default function BottomPanel({ consoleLogs = [], onClear }: BottomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (isCollapsed) {
    return (
      <div className="h-10 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Console</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{consoleLogs.length} messages</span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="h-64 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      {/* Panel Header */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Console</span>
          <button
            onClick={onClear}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear console"
          >
            Clear
          </button>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-left">
        {consoleLogs.length === 0 ? (
          <div className="text-gray-400 italic text-left">No console logs available. Send a request to see logs here.</div>
        ) : (
          consoleLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 rounded text-left">
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[70px] text-left shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
              <span
                className={`text-xs min-w-[70px] text-left shrink-0 ${
                  log.type === 'response'
                    ? 'text-green-600 dark:text-green-400'
                    : log.type === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : log.type === 'request'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
              >
                [{log.type.toUpperCase()}]
              </span>
              <span className="text-gray-900 dark:text-gray-100 flex-1 whitespace-pre-wrap break-all text-left">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
