import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useCollectionStore } from '../../stores/collectionStore';

interface EnvironmentSelectorProps {
  onManageClick?: () => void;
}

export default function EnvironmentSelector({ onManageClick }: EnvironmentSelectorProps) {
  const { environments, activeEnvironmentId, setActiveEnvironment, loadEnvironments } = useEnvironmentStore();
  const { currentWorkspaceId } = useCollectionStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadEnvironments(currentWorkspaceId);
    }
  }, [currentWorkspaceId]);

  const activeEnvironment = environments.find((env) => env.id === activeEnvironmentId);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>{activeEnvironment ? activeEnvironment.name : 'No Environment'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <div
                  onClick={() => {
                    setActiveEnvironment(null);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    !activeEnvironmentId ? 'bg-primary-50 dark:bg-primary-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-gray-100">No Environment</span>
                    {!activeEnvironmentId && (
                      <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                {environments.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => {
                      setActiveEnvironment(env.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      activeEnvironmentId === env.id ? 'bg-primary-50 dark:bg-primary-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{env.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {env.variables?.length || 0} variables
                        </div>
                      </div>
                      {activeEnvironmentId === env.id && (
                        <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <button
                  onClick={() => {
                    onManageClick?.();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Environments
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
