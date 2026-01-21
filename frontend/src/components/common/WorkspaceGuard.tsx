import type { ReactNode } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface WorkspaceGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showCreateButton?: boolean;
}

/**
 * WorkspaceGuard ensures a workspace is selected before rendering children
 * Prevents app crashes from missing workspace context
 */
export function WorkspaceGuard({ 
  children, 
  fallback,
  showCreateButton = true 
}: WorkspaceGuardProps) {
  const { currentWorkspace, isLoading } = useWorkspaceStore();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show error state if no workspace
  if (!currentWorkspace) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="max-w-md w-full text-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Workspace Selected
          </h3>
          <p className="text-gray-600 mb-6">
            Please select or create a workspace to continue working with your API collections and requests.
          </p>
          
          {showCreateButton && (
            <button
              onClick={() => {
                // Trigger workspace creation dialog
                // This would need to be wired up to your workspace creation flow
                console.log('Create workspace clicked');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  // Workspace exists, render children
  return <>{children}</>;
}

/**
 * Higher-order component version of WorkspaceGuard
 */
export function withWorkspaceGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<WorkspaceGuardProps, 'children'>
) {
  return function WithWorkspaceGuard(props: P) {
    return (
      <WorkspaceGuard {...guardProps}>
        <Component {...props} />
      </WorkspaceGuard>
    );
  };
}
