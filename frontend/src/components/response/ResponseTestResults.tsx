import React from 'react';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface ResponseTestResultsProps {
  testResults?: {
    tests: TestResult[];
    passed: number;
    failed: number;
    totalTime: number;
    consoleOutput: string[];
  };
}

const ResponseTestResults: React.FC<ResponseTestResultsProps> = ({ testResults }) => {
  if (!testResults) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No test results available. Add test scripts to see results.
      </div>
    );
  }

  const { tests = [], passed = 0, failed = 0, totalTime = 0, consoleOutput = [] } = testResults;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests:</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{tests.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">{passed} passed</span>
        </div>
        {failed > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">{failed} failed</span>
          </div>
        )}
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {totalTime}ms
        </div>
      </div>

      {/* Test Results */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Test Results</h3>
        <div className="space-y-2">
          {tests.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No tests executed.</div>
          ) : (
            tests.map((test, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  test.passed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {test.passed ? (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      test.passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                    }`}>
                      {test.name}
                    </div>
                    {test.error && (
                      <div className="mt-1 text-xs text-red-700 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
                        {test.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Console Output */}
      {consoleOutput && consoleOutput.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Console Output</h3>
          <div className="bg-gray-900 dark:bg-black text-gray-100 dark:text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            {consoleOutput.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap break-words">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTestResults;
