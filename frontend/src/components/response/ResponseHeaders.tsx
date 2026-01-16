import React from 'react';

interface ResponseHeadersProps {
  response: any;
}

const copyHeaders = (headers: Record<string, string>) => {
  const text = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  navigator.clipboard.writeText(text);
};

const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ response }) => {
  const headers = response?.headers || {};

  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Response Headers</span>
        <button
          onClick={() => copyHeaders(headers)}
          className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Copy All
        </button>
      </div>
      {Object.keys(headers).length === 0 ? (
        <div className="text-xs text-gray-500">No headers available.</div>
      ) : (
        <div className="space-y-1">
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
              <span className="text-gray-600 dark:text-gray-400 break-words">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponseHeaders;
