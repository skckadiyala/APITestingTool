import { useState } from 'react';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';

export const NoWorkspaceScreen = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center px-4">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to Simba
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let's get started by creating your first workspace to organize your API collections and environments.
          </p>

          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg
              className="-ml-1 mr-3 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Workspace
          </button>

          <div className="mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Workspaces help you organize your API testing projects, collections, and environments all in one place.
            </p>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};
