import React from 'react';
import ResponseTabs from './ResponseTabs';

interface ResponseViewerProps {
  response: any;
  testResults?: any;
  consoleLogs?: Array<{ type: 'request' | 'response' | 'error' | 'info'; message: string; timestamp: number }>;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, testResults, consoleLogs = [] }) => {
  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No response yet. Send a request to see the response.
      </div>
    );
  }

  const status = response.status || 0;
  const statusText = response.statusText || 'Unknown';
  const time = response.timing?.total || 0;
  const size = response.body ? new Blob([JSON.stringify(response.body)]).size : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <ResponseTabs 
        response={response} 
        testResults={testResults} 
        consoleLogs={consoleLogs}
        status={status}
        statusText={statusText}
        time={time}
        size={size}
      />
    </div>
  );
};

export default ResponseViewer;
