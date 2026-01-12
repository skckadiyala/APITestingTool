import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspaceSwitch } from '../../hooks/useWorkspaceSwitch';

interface WorkspaceSelectorProps {
  onCreateClick: () => void;
  onManageClick: () => void;
}

export default function WorkspaceSelector({ onCreateClick, onManageClick }: WorkspaceSelectorProps) {
  const { workspaces, currentWorkspace, isLoading } = useWorkspaceStore();
  const { switchWorkspace, isSwitching } = useWorkspaceSwitch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + W to open workspace switcher
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % workspaces.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + workspaces.length) % workspaces.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (workspaces[selectedIndex]) {
            handleWorkspaceSwitch(workspaces[selectedIndex].id);
          }
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, workspaces]);

  // Reset selected index when opening dropdown
  useEffect(() => {
    if (isOpen) {
      const currentIndex = workspaces.findIndex((w) => w.id === currentWorkspace?.id);
      setSelectedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, workspaces, currentWorkspace]);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    setIsOpen(false);
    await switchWorkspace(workspaceId);
  };

  const truncateName = (name: string, maxLength: number = 25) => {
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  // Empty state - no workspaces
  if (workspaces.length === 0 && !isLoading) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>No Workspace</span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
            <div className="px-4 py-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create your first workspace
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateClick();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition-colors"
              >
                Create Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading or switching state
  if (isLoading || isSwitching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
        <span className="text-gray-500 dark:text-gray-400">
          {isSwitching ? 'Switching...' : 'Loading...'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
        title={`${currentWorkspace?.name || 'Select workspace'} (⌘⇧W)`}
      >
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="flex-1 text-left truncate">
          {currentWorkspace ? truncateName(currentWorkspace.name) : 'Select workspace'}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Workspace List */}
          <div className="max-h-80 overflow-y-auto py-1">
            {workspaces.map((workspace, index) => {
              const isActive = currentWorkspace?.id === workspace.id;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group ${
                    isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  } ${isSelected && !isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg 
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`text-sm font-medium truncate ${
                          isActive 
                            ? 'text-primary-700 dark:text-primary-300' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        title={workspace.name}
                      >
                        {workspace.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {workspace.collectionsCount || 0} collections · {workspace.environmentsCount || 0} environments
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateClick();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Workspace
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onManageClick();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Workspaces
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
