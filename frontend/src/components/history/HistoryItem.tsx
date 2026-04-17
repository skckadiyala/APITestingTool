import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { type HistoryEntry } from '../../services/historyService';

interface HistoryItemProps {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  POST: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  DELETE: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  HEAD: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  OPTIONS: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const getStatusColor = (status?: number): string => {
  if (!status) return 'text-gray-500 dark:text-gray-400';
  if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400) return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 400 && status < 500) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const truncateUrl = (url: string, maxLength: number = 40): string => {
  if (url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    if (path.length > maxLength - 3) {
      return urlObj.hostname + '...' + path.slice(-(maxLength - urlObj.hostname.length - 6));
    }
    
    return urlObj.hostname + path;
  } catch {
    return url.slice(0, maxLength - 3) + '...';
  }
};

export const HistoryItem: React.FC<HistoryItemProps> = ({
  entry,
  onSelect,
  onDelete,
  isSelected,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };

  // Check if path params were used (originalUrl exists and differs from url)
  const hasPathParams = entry.originalUrl && entry.originalUrl !== entry.url;

  return (
    <div
      className={`
        text-left p-3 mb-2 rounded-lg border cursor-pointer transition-all
        hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      `}
      onClick={() => onSelect(entry)}
      title={hasPathParams ? `Original: ${entry.originalUrl}\nResolved: ${entry.url}` : entry.url}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left side: Method and URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                text-[12px] font-semibold px-2 py-0.5 rounded border
                ${METHOD_COLORS[entry.method] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
              `}
            >
              {entry.method}
            </span>
            <span className={`text-[12px] font-semibold ${getStatusColor(entry.statusCode)}`}>
              {entry.statusCode || '—'}
            </span>
            {hasPathParams && (
              <span 
                className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded border border-blue-300 dark:border-blue-700"
                title="Contains path parameters"
              >
                :path
              </span>
            )}
          </div>
          
          <div className="space-y-0.5">
            {hasPathParams && (
              <div className="text-[12px] text-gray-500 dark:text-gray-400 font-mono truncate" title={entry.originalUrl}>
                {truncateUrl(entry.originalUrl!, 38)}
              </div>
            )}
            <div 
              className={`text-[12px] text-gray-700 dark:text-gray-300 font-mono truncate ${hasPathParams ? 'text-[12px]' : ''}`} 
              title={entry.url}
            >
              {hasPathParams && <span className="text-gray-400 dark:text-gray-500 mr-1">→</span>}
              {truncateUrl(entry.url, hasPathParams ? 38 : 40)}
            </div>
          </div>
          
          {entry.request?.name && (
            <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 truncate">
              {entry.request.name}
            </div>
          )}
        </div>

        {/* Right side: Delete button */}
        <button
          onClick={handleDelete}
          className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete this entry"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Bottom: Timestamp and response time */}
      <div className="flex items-center justify-between mt-2 text-[12px] text-gray-500 dark:text-gray-400">
        <span title={new Date(entry.executedAt).toLocaleString()}>
          {formatDistanceToNow(new Date(entry.executedAt), { addSuffix: true })}
        </span>
        {entry.responseTime !== undefined && (
          <span className="font-mono">
            {entry.responseTime}ms
          </span>
        )}
      </div>
    </div>
  );
};
