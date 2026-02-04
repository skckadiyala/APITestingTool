import React from 'react';

interface GraphQLResponseExtensionsProps {
  extensions?: Record<string, any>;
}

const GraphQLResponseExtensions: React.FC<GraphQLResponseExtensionsProps> = ({ extensions }) => {
  if (!extensions || Object.keys(extensions).length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No extensions data
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(extensions, null, 2));
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(extensions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphql-extensions.json';
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

      {/* Extensions Display */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs overflow-x-auto">
        {renderValue(extensions)}
      </div>

      {/* Info Box */}
      <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-2">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            Extensions provide additional metadata from the GraphQL server, such as tracing information, 
            execution metrics, or custom server data.
          </span>
        </div>
      </div>
    </div>
  );
};

export default GraphQLResponseExtensions;
