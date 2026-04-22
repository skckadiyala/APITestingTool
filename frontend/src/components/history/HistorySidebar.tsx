import React, { useEffect, useRef, useCallback } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { HistoryItem } from './HistoryItem';
import { HistoryFilters } from './HistoryFilters';
import { type HistoryEntry } from '../../services/historyService';

interface HistorySidebarProps {
  onRestoreRequest: (entry: HistoryEntry) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ onRestoreRequest }) => {
  const {
    history,
    total,
    loading,
    error,
    hasMore,
    isSidebarOpen,
    selectedHistoryId,
    loadHistory,
    loadMore,
    deleteEntry,
    clearAll,
    exportToJson,
    toggleSidebar,
    setSelectedHistoryId,
  } = useHistoryStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Load history on mount and when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      loadHistory();
    }
  }, [isSidebarOpen]);

  // Setup infinite scroll observer
  useEffect(() => {
    if (!isSidebarOpen) return;

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isSidebarOpen, hasMore, loading, loadMore]);

  const handleSelectEntry = useCallback(
    (entry: HistoryEntry) => {
      setSelectedHistoryId(entry.id);
      onRestoreRequest(entry);
    },
    [setSelectedHistoryId, onRestoreRequest]
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      deleteEntry(id);
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
      }
    },
    [deleteEntry, selectedHistoryId, setSelectedHistoryId]
  );

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-blue-600 transition-all z-40"
        title="Open History"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col z-40">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-4 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-[12px] font-semibold text-gray-900 dark:text-white">History</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">{total} total requests</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Close History"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => loadHistory(true)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh history"
          >
            <svg
              className={`w-4 h-4 inline mr-1 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={exportToJson}
            disabled={loading || history.length === 0}
            className="flex-1 px-4 py-2.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Export history as JSON"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
          <button
            onClick={clearAll}
            disabled={loading || history.length === 0}
            className="px-4 py-2.5 text-[12px] font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Clear all history"
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
      </div>

      {/* Filters */}
      <HistoryFilters />

      {/* History list */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {error && (
          <div className="text-left p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-[12px] text-red-700 dark:text-red-400">
            <p className="font-semibold">Error loading history</p>
            <p className="text-[12px] mt-1">{error}</p>
          </div>
        )}


        {!loading && history.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-[12px] font-medium">No history yet</p>
            <p className="text-[12px] mt-1">Execute some requests to see them here</p>
          </div>
        )}

        {history.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            onSelect={handleSelectEntry}
            onDelete={handleDeleteEntry}
            isSelected={selectedHistoryId === entry.id}
          />
        ))}

        {/* Load more trigger */}
        {hasMore && (
          <div
            ref={loadMoreTriggerRef}
            className="text-center py-4"
          >
            {loading && (
              <div className="flex items-center justify-center text-[12px] text-gray-500 dark:text-gray-400">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading more...
              </div>
            )}
          </div>
        )}

        {!hasMore && history.length > 0 && (
          <div className="text-center py-4 text-[12px] text-gray-400 dark:text-gray-500">
            End of history
          </div>
        )}
      </div>
    </div>
  );
};
