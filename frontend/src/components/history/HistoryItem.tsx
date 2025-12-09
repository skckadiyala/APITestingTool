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
  GET: 'bg-green-100 text-green-800 border-green-300',
  POST: 'bg-blue-100 text-blue-800 border-blue-300',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-300',
  DELETE: 'bg-red-100 text-red-800 border-red-300',
  HEAD: 'bg-gray-100 text-gray-800 border-gray-300',
  OPTIONS: 'bg-gray-100 text-gray-800 border-gray-300',
};

const getStatusColor = (status?: number): string => {
  if (!status) return 'text-gray-500';
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 300 && status < 400) return 'text-yellow-600';
  if (status >= 400 && status < 500) return 'text-orange-600';
  return 'text-red-600';
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

  return (
    <div
      className={`
        text-left p-3 mb-2 rounded-lg border cursor-pointer transition-all
        hover:shadow-md hover:border-blue-400
        ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}
      `}
      onClick={() => onSelect(entry)}
      title={entry.url}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left side: Method and URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                text-xs font-semibold px-2 py-0.5 rounded border
                ${METHOD_COLORS[entry.method] || 'bg-gray-100 text-gray-800 border-gray-300'}
              `}
            >
              {entry.method}
            </span>
            <span className={`text-sm font-semibold ${getStatusColor(entry.statusCode)}`}>
              {entry.statusCode || '—'}
            </span>
          </div>
          
          <div className="text-sm text-gray-700 font-mono truncate" title={entry.url}>
            {truncateUrl(entry.url)}
          </div>
          
          {entry.request?.name && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {entry.request.name}
            </div>
          )}
        </div>

        {/* Right side: Delete button */}
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
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
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
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
