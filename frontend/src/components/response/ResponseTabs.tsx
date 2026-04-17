import React, { useState } from 'react';
import ResponseBody from './ResponseBody';
import ResponseHeaders from './ResponseHeaders';
import ResponseCookies from './ResponseCookies';
import ResponseTestResults from './ResponseTestResults';
import GraphQLResponseData from './GraphQLResponseData';
import GraphQLResponseErrors from './GraphQLResponseErrors';
import GraphQLResponseExtensions from './GraphQLResponseExtensions';

export type ResponseTabType = 'body' | 'data' | 'errors' | 'extensions' | 'headers' | 'cookies' | 'tests' | 'console' | 'request';

interface ResponseTabsProps {
  response: any;
  testResults?: any;
  consoleLogs?: Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
  status?: number;
  statusText?: string;
  time?: number;
  size?: number;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  requestDetails?: {
    method: string;
    url: string;
    originalUrl?: string;
    pathParams?: Array<{ key: string; value: string }>;
  };
}

const TAB_LABELS: Record<ResponseTabType, string> = {
  body: 'Body',
  data: 'Data',
  errors: 'Errors',
  extensions: 'Extensions',
  headers: 'Headers',
  cookies: 'Cookies',
  tests: 'Test Results',
  console: 'Console',
  request: 'Request',
};

// Helper to detect if response is GraphQL based on request type
function isGraphQLResponse(requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET'): boolean {
  return requestType === 'GRAPHQL';
}

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

const ResponseTabs: React.FC<ResponseTabsProps> = ({ response, testResults, consoleLogs = [], status, statusText, time, size, requestType = 'REST', requestDetails }) => {
  const isGraphQL = isGraphQLResponse(requestType);
  const [activeTab, setActiveTab] = useState<ResponseTabType>(isGraphQL ? 'data' : 'body');
  
  // Update active tab when response type changes
  React.useEffect(() => {
    if (isGraphQL && activeTab === 'body') {
      setActiveTab('data');
    } else if (!isGraphQL && (activeTab === 'data' || activeTab === 'errors' || activeTab === 'extensions')) {
      setActiveTab('body');
    }
  }, [isGraphQL]);

  // Determine which tabs to show
  const hasPathParams = requestDetails?.originalUrl && requestDetails?.originalUrl !== requestDetails?.url;
  const visibleTabs: ResponseTabType[] = isGraphQL 
    ? ['data', 'errors', 'extensions', 'headers', 'cookies', ...(hasPathParams ? ['request' as ResponseTabType] : []), 'tests', 'console']
    : ['body', 'headers', 'cookies', ...(hasPathParams ? ['request' as ResponseTabType] : []), 'tests', 'console'];
  
  // Count GraphQL errors
  const errorCount = isGraphQL && response?.body?.errors ? response.body.errors.length : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2">
        {/* Tab Buttons */}
        <div className="flex gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ResponseTabType)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors focus:outline-none ${
                activeTab === tab ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {TAB_LABELS[tab]}
              {tab === 'errors' && errorCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                  {errorCount}
                </span>
              )}
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
        {activeTab === 'data' && <GraphQLResponseData data={response?.body?.data} />}
        {activeTab === 'errors' && <GraphQLResponseErrors errors={response?.body?.errors} />}
        {activeTab === 'extensions' && <GraphQLResponseExtensions extensions={response?.body?.extensions} />}
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
        {activeTab === 'request' && requestDetails && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request Details
              </h3>
              
              {/* Method */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Method</div>
                <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {requestDetails.method}
                </div>
              </div>

              {/* Original URL (with placeholders) */}
              {requestDetails.originalUrl && requestDetails.originalUrl !== requestDetails.url && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Requested URL (with placeholders)
                  </div>
                  <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                    {requestDetails.originalUrl}
                  </div>
                </div>
              )}

              {/* Actual URL (resolved) */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Actual URL {requestDetails.originalUrl && requestDetails.originalUrl !== requestDetails.url ? '(resolved)' : ''}
                </div>
                <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700 border-2 break-all text-green-700 dark:text-green-400">
                  {requestDetails.url}
                </div>
              </div>

              {/* Path Parameters */}
              {requestDetails.pathParams && requestDetails.pathParams.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Path Parameters Used
                  </div>
                  <div className="space-y-1">
                    {requestDetails.pathParams.map((param, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <code className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          :{param.key}
                        </code>
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <code className="font-mono text-xs text-gray-700 dark:text-gray-300 flex-1 break-all">
                          {param.value || <span className="italic text-gray-400">(empty)</span>}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseTabs;
