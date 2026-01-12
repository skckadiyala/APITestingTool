import { useState, useEffect, useRef } from 'react';

interface RunResult {
  requestId: string;
  requestName: string;
  method: string;
  url: string;
  status: 'passed' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  testResults?: {
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string }>;
  };
  error?: string;
  timestamp: Date;
}

interface IterationResult {
  iteration: number;
  results: RunResult[];
  passed: number;
  failed: number;
  totalTime: number;
  dataRow?: any;
}

interface CollectionRunResult {
  collectionId: string;
  collectionName: string;
  startTime: Date;
  endTime?: Date;
  totalRequests: number;
  totalPassed: number;
  totalFailed: number;
  totalTime: number;
  iterations: IterationResult[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

interface RunnerResultsProps {
  result: CollectionRunResult;
  onClose: () => void;
  onExport?: (format: 'json' | 'html') => void;
}

export default function RunnerResults({ result, onClose, onExport }: RunnerResultsProps) {
  const [selectedIteration, setSelectedIteration] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<RunResult | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const currentIteration = result.iterations[selectedIteration];
  const successRate = result.totalRequests > 0 
    ? ((result.totalPassed / result.totalRequests) * 100).toFixed(1)
    : '0';

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      POST: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      PUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'passed') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Collection Run Results
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {result.collectionName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                >
                  Export
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                    <button
                      onClick={() => {
                        onExport('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => {
                        onExport('html');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b"
                    >
                      Export HTML
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Status</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {result.status}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {result.totalRequests}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Passed</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {result.totalPassed}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Failed</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {result.totalFailed}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Success Rate</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {successRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Iteration Selector */}
        {result.iterations.length > 1 && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Iteration:</span>
              <select
                value={selectedIteration}
                onChange={(e) => setSelectedIteration(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                {result.iterations.map((iter, index) => (
                  <option key={index} value={index}>
                    {iter.iteration} - {iter.passed} passed, {iter.failed} failed
                  </option>
                ))}
              </select>
            </div>
            {/* Data Row Info */}
            {currentIteration?.dataRow && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <span className="font-medium text-blue-700 dark:text-blue-300">Data: </span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {JSON.stringify(currentIteration.dataRow)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Request List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentIteration?.results.map((req, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedRequest === req ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(req.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${getMethodColor(
                            req.method
                          )}`}
                        >
                          {req.method}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {req.requestName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {req.url}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {req.statusCode && (
                          <span
                            className={`font-medium ${
                              req.statusCode >= 200 && req.statusCode < 300
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {req.statusCode}
                          </span>
                        )}
                        {req.responseTime !== undefined && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {req.responseTime}ms
                          </span>
                        )}
                        {req.testResults && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Tests: {req.testResults.passed} passed, {req.testResults.failed} failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Request Details */}
          <div className="w-1/2 overflow-y-auto p-6">
            {selectedRequest ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedRequest.requestName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded ${getMethodColor(selectedRequest.method)}`}
                    >
                      {selectedRequest.method}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{selectedRequest.url}</span>
                  </div>
                </div>

                {selectedRequest.statusCode && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status Code
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        selectedRequest.statusCode >= 200 && selectedRequest.statusCode < 300
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {selectedRequest.statusCode}
                    </div>
                  </div>
                )}

                {selectedRequest.responseTime !== undefined && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Response Time
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRequest.responseTime}ms
                    </div>
                  </div>
                )}

                {selectedRequest.error && (
                  <div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                      Error
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                      {selectedRequest.error}
                    </div>
                  </div>
                )}

                {selectedRequest.testResults && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Results
                    </div>
                    <div className="space-y-2">
                      {selectedRequest.testResults.tests.map((test, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          {test.passed ? (
                            <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{test.name}</div>
                            {test.error && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {test.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Select a request to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
