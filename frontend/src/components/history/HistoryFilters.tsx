import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const STATUS_RANGES = [
  { label: 'All', min: undefined, max: undefined },
  { label: '2xx Success', min: 200, max: 299 },
  { label: '3xx Redirect', min: 300, max: 399 },
  { label: '4xx Client Error', min: 400, max: 499 },
  { label: '5xx Server Error', min: 500, max: 599 },
];

export const HistoryFilters: React.FC = () => {
  const { filters, setFilter, clearFilters, isFilterPanelOpen, toggleFilterPanel } =
    useHistoryStore();

  const [urlPattern, setUrlPattern] = useState(filters.urlPattern || '');
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');

  const handleMethodToggle = (method: string) => {
    setFilter('method', filters.method === method ? undefined : method);
  };

  const handleStatusRangeChange = (min?: number, max?: number) => {
    setFilter('statusCodeMin', min);
    setFilter('statusCodeMax', max);
  };

  const handleUrlPatternChange = () => {
    setFilter('urlPattern', urlPattern || undefined);
  };

  const handleDateRangeChange = () => {
    setFilter('startDate', startDate || undefined);
    setFilter('endDate', endDate || undefined);
  };

  const handleClearFilters = () => {
    clearFilters();
    setUrlPattern('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    filters.method ||
    filters.statusCodeMin !== undefined ||
    filters.statusCodeMax !== undefined ||
    filters.urlPattern ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="border-b border-gray-200">
      {/* Filter toggle button */}
      <button
        onClick={toggleFilterPanel}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              Active
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filter panel */}
      {isFilterPanelOpen && (
        <div className="text-left p-4 bg-gray-50 space-y-4">
          {/* Method filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              HTTP Method
            </label>
            <div className="flex flex-wrap gap-2">
              {HTTP_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => handleMethodToggle(method)}
                  className={`
                    px-3 py-1 text-xs font-medium rounded border transition-colors
                    ${
                      filters.method === method
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }
                  `}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Status code range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Status Code Range
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_RANGES.map((range) => {
                const isActive =
                  filters.statusCodeMin === range.min &&
                  filters.statusCodeMax === range.max;

                return (
                  <button
                    key={range.label}
                    onClick={() => handleStatusRangeChange(range.min, range.max)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded border transition-colors
                      ${
                        isActive
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }
                    `}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL pattern */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              URL Pattern
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlPattern}
                onChange={(e) => setUrlPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlPatternChange()}
                placeholder="e.g., api.example.com"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUrlPatternChange}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleDateRangeChange}
              className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              Apply Date Range
            </button>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
