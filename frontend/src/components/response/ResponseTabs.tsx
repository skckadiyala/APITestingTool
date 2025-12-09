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
}

const TAB_LABELS: Record<ResponseTabType, string> = {
  body: 'Body',
  headers: 'Headers',
  cookies: 'Cookies',
  tests: 'Test Results',
  console: 'Console',
};

const ResponseTabs: React.FC<ResponseTabsProps> = ({ response, testResults, consoleLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<ResponseTabType>('body');

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
        {Object.entries(TAB_LABELS).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ResponseTabType)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
              activeTab === tab ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-left">
        {activeTab === 'body' && <ResponseBody response={response} />}
        {activeTab === 'headers' && <ResponseHeaders response={response} />}
        {activeTab === 'cookies' && <ResponseCookies response={response} />}
        {activeTab === 'tests' && <ResponseTestResults testResults={testResults} />}
        {activeTab === 'console' && (
          <div className="space-y-1 font-mono text-xs bg-gray-900 dark:bg-black p-4 rounded-lg min-h-[200px]">
            {consoleLogs.length === 0 ? (
              <div className="text-gray-400 italic">No console logs available</div>
            ) : (
              consoleLogs.map((log, index) => (
                <div key={index} className="flex gap-3 py-1 hover:bg-gray-800 px-2 rounded">
                  <span className="text-gray-500 text-[10px] min-w-[70px]">
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
