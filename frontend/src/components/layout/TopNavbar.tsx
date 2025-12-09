import { useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import EnvironmentSelector from '../environment/EnvironmentSelector';
import EnvironmentEditorModal from '../environment/EnvironmentEditorModal';

export default function TopNavbar() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [isEnvironmentEditorOpen, setIsEnvironmentEditorOpen] = useState(false);

  return (
    <nav className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
      {/* Logo and App Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            API Testing Tool
          </h1>
        </div>

        {/* Workspace Selector */}
        <div className="ml-4 hidden md:block">
          <select className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Personal Workspace</option>
            <option>Team Project</option>
          </select>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Environment Selector */}
        <EnvironmentSelector onManageClick={() => setIsEnvironmentEditorOpen(true)} />
        
        {/* Environment Editor Modal */}
        <EnvironmentEditorModal 
          isOpen={isEnvironmentEditorOpen}
          onClose={() => setIsEnvironmentEditorOpen(false)}
        />
        
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title="Toggle dark mode"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* User Menu */}
        <div className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-300 text-sm font-medium">JD</span>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">John Doe</span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </nav>
  );
}
