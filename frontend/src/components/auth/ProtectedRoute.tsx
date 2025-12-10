import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import WorkspaceLoading from '../workspace/WorkspaceLoading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireWorkspace?: boolean;
}

export const ProtectedRoute = ({ children, requireWorkspace = true }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  const { currentWorkspace, workspaces, isLoading, fetchWorkspaces } = useWorkspaceStore();
  const location = useLocation();

  useEffect(() => {
    // Fetch workspaces if authenticated and not already loaded or loading
    if (isAuthenticated && workspaces.length === 0 && !isLoading) {
      fetchWorkspaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only run when authentication status changes

  // Check authentication first
  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If workspace is required, check workspace state
  if (requireWorkspace) {
    // Show loading while fetching workspaces
    if (isLoading) {
      return <WorkspaceLoading />;
    }

    // If no workspaces exist, the Layout component will show NoWorkspaceScreen
    // If no current workspace is selected but workspaces exist, Layout will handle it
  }

  return <>{children}</>;
};
