import React, { useState } from 'react';
import ResponseBody from './ResponseBody';
import ResponseHeaders from './ResponseHeaders';
import ResponseCookies from './ResponseCookies';
import ResponseTestResults from './ResponseTestResults';

export type ResponseTabType = 'body' | 'headers' | 'cookies' | 'tests' | 'console';

interface ResponseTabsProps {
  response: any;
  testResults?: any;
  consoleLogs?: Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
  status?: number;
  statusText?: string;
  time?: number;
  size?: number;
}

const TAB_LABELS: Record<ResponseTabType, string> = {
  body: 'Body',
  headers: 'Headers',
  cookies: 'Cookies',
  tests: 'Test Results',
  console: 'Console',
};

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-500 text-white';
  if (status >= 300 && status < 400) return 'bg-yellow-500 text-white';
  if (status >= 400) return 'bg-red-500 text-white';
  return 'bg-gray-400 text-white';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ResponseTabs: React.FC<ResponseTabsProps> = ({ response, testResults, consoleLogs = [], status, statusText, time, size }) => {
  const [activeTab, setActiveTab] = useState<ResponseTabType>('body');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2">
        {/* Tab Buttons */}
        <div className="flex gap-1">
          {Object.entries(TAB_LABELS).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ResponseTabType)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors focus:outline-none ${
                activeTab === tab ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Status Info */}
        {status !== undefined && (
          <div className="flex items-center gap-3 px-2">
            <div className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(status)}`}>
              {status}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{statusText}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{time} ms</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{formatSize(size || 0)}</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-left">
        {activeTab === 'body' && <ResponseBody response={response} />}
        {activeTab === 'headers' && <ResponseHeaders response={response} />}
        {activeTab === 'cookies' && <ResponseCookies response={response} />}
        {activeTab === 'tests' && <ResponseTestResults testResults={testResults} />}
        {activeTab === 'console' && (
          <div className="space-y-1 font-mono text-xs bg-gray-900 dark:bg-black p-3 rounded-lg min-h-[200px]">
            {consoleLogs.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No console logs available</div>
            ) : (
              consoleLogs.map((log, index) => (
                <div key={index} className="flex gap-2 py-0.5 hover:bg-gray-800 px-2 rounded">
                  <span className="text-gray-500 text-[10px] min-w-[60px]">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                  <span className={`font-bold text-[10px] min-w-[70px] ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'request' ? 'text-blue-400' :
                    log.type === 'response' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className={`flex-1 whitespace-pre-wrap break-all ${
                    log.type === 'error' ? 'text-red-300' :
                    log.type === 'request' ? 'text-blue-300' :
                    log.type === 'response' ? 'text-green-300' :
                    'text-gray-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseTabs;
