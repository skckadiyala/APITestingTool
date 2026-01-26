import React, { useState } from 'react';

interface GraphQLResponseDataProps {
  data: any;
}

const GraphQLResponseData: React.FC<GraphQLResponseDataProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');

  if (!data) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No data returned
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphql-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderValue = (value: any, level: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }
    
    if (value === undefined) {
      return <span className="text-gray-500 dark:text-gray-400">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-600 dark:text-green-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-orange-600 dark:text-orange-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-600 dark:text-gray-400">[]</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-gray-600 dark:text-gray-400">[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-4">
              {renderValue(item, level + 1)}
              {index < value.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </div>
          ))}
          <span className="text-gray-600 dark:text-gray-400">]</span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-600 dark:text-gray-400">{'{}'}</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-gray-600 dark:text-gray-400">{'{'}</span>
          {keys.map((key, index) => (
            <div key={key} className="ml-4">
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              <span className="text-gray-600 dark:text-gray-400">: </span>
              {renderValue(value[key], level + 1)}
              {index < keys.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </div>
          ))}
          <span className="text-gray-600 dark:text-gray-400">{'}'}</span>
        </div>
      );
    }

    return String(value);
  };

  return (
    <div className="space-y-2">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded">
          <button
            onClick={() => setViewMode('pretty')}
            className={`px-3 py-1 text-xs font-medium rounded-l ${
              viewMode === 'pretty'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Pretty
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 text-xs font-medium rounded-r ${
              viewMode === 'raw'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Raw
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Copy
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Download
        </button>
      </div>

      {/* Data Display */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs overflow-x-auto">
        {viewMode === 'pretty' ? (
          renderValue(data)
        ) : (
          <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default GraphQLResponseData;
