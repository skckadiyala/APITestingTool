import { useTabStore } from '../../stores/tabStore';

export default function RequestTabBar() {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } = useTabStore();

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const getTabIcon = (tab: any) => {
    if (tab.type === 'workspace-settings') {
      return (
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (tab.type === 'profile-settings') {
      return (
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    if (tab.type === 'collection') {
      return (
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            group flex items-center gap-2 px-3 py-2 border-r border-gray-300 dark:border-gray-700 cursor-pointer
            min-w-[140px] max-w-[220px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
            ${activeTabId === tab.id 
              ? 'bg-white dark:bg-gray-900 border-b-2 border-b-primary-500' 
              : 'bg-gray-100 dark:bg-gray-800'
            }
          `}
        >
          {/* Icon or Method Badge */}
          {tab.type === 'request' ? (
            <span
              className={`
                text-xs font-semibold px-1.5 py-0.5 rounded
                ${tab.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                ${tab.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                ${tab.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                ${tab.method === 'PATCH' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : ''}
                ${tab.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
              `}
            >
              {tab.method}
            </span>
          ) : (
            getTabIcon(tab)
          )}

          {/* Tab Name */}
          <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
            {tab.name || 'Untitled Request'}
          </span>
          
          {/* Dirty indicator */}
          {tab.isDirty && (
            <span className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved changes"></span>
          )}

          {/* Close Button */}
          <button
            onClick={(e) => handleCloseTab(e, tab.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-opacity"
            title="Close tab"
          >
            <svg
              className="w-3 h-3 text-gray-600 dark:text-gray-400"
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
      ))}

      {/* New Tab Button */}
      <button
        onClick={() => createTab()}
        className="flex items-center justify-center px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        title="New request"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
