import React from 'react';

interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

interface GraphQLResponseErrorsProps {
  errors?: GraphQLError[];
}

const GraphQLResponseErrors: React.FC<GraphQLResponseErrorsProps> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>No errors</span>
      </div>
    );
  }

  const handleCopy = (error: GraphQLError) => {
    navigator.clipboard.writeText(JSON.stringify(error, null, 2));
  };

  return (
    <div className="space-y-3">
      {/* Error Summary */}
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>{errors.length} error{errors.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Error List */}
      {errors.map((error, index) => (
        <div key={index} className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-4 space-y-2">
          {/* Error Message */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Error #{index + 1}
                </span>
              </div>
              <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                {error.message}
              </p>
            </div>
            <button
              onClick={() => handleCopy(error)}
              className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900"
              title="Copy error"
            >
              Copy
            </button>
          </div>

          {/* Location Info */}
          {error.locations && error.locations.length > 0 && (
            <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
              <div className="font-medium">Location{error.locations.length !== 1 ? 's' : ''}:</div>
              {error.locations.map((loc, locIndex) => (
                <div key={locIndex} className="ml-4 font-mono">
                  Line {loc.line}, Column {loc.column}
                </div>
              ))}
            </div>
          )}

          {/* Path Info */}
          {error.path && error.path.length > 0 && (
            <div className="text-xs text-red-700 dark:text-red-300">
              <div className="font-medium mb-1">Path:</div>
              <div className="ml-4 font-mono bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                {error.path.join(' → ')}
              </div>
            </div>
          )}

          {/* Extensions */}
          {error.extensions && Object.keys(error.extensions).length > 0 && (
            <div className="text-xs text-red-700 dark:text-red-300">
              <div className="font-medium mb-1">Extensions:</div>
              <div className="ml-4 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(error.extensions, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GraphQLResponseErrors;
