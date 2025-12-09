import React from 'react';

interface ResponseStatusBarProps {
  status: number;
  statusText: string;
  time: number; // ms
  size: number; // bytes
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-500';
  if (status >= 300 && status < 400) return 'bg-yellow-500';
  if (status >= 400) return 'bg-red-500';
  return 'bg-gray-400';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const ResponseStatusBar: React.FC<ResponseStatusBarProps> = ({ status, statusText, time, size }) => (
  <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className={`px-3 py-1 rounded text-white font-bold text-lg ${getStatusColor(status)}`}>{status}</div>
    <div className="text-gray-700 dark:text-gray-300 font-medium">{statusText}</div>
    <div className="ml-auto flex items-center gap-6">
      <span className="text-xs text-gray-500 dark:text-gray-400">Time: <span className="font-semibold">{time} ms</span></span>
      <span className="text-xs text-gray-500 dark:text-gray-400">Size: <span className="font-semibold">{formatSize(size)}</span></span>
    </div>
  </div>
);

export default ResponseStatusBar;
