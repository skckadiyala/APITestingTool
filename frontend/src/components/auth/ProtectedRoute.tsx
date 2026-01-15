import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import WorkspaceLoading from '../workspace/WorkspaceLoading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireWorkspace?: boolean;
}

export const ProtectedRoute = ({ children, requireWorkspace = true }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { currentWorkspace, workspaces, isLoading, fetchWorkspaces } = useWorkspaceStore();
  const location = useLocation();
  const [isRehydrated, setIsRehydrated] = useState(false);

  // Wait for Zustand persist to rehydrate
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRehydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch workspaces only after rehydration and if authenticated with a token
    if (isRehydrated && isAuthenticated && accessToken && workspaces.length === 0 && !isLoading) {
      fetchWorkspaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, isRehydrated]); // Run when authentication or rehydration changes

  // Wait for rehydration before making auth decisions
  if (!isRehydrated) {
    return <WorkspaceLoading />;
  }

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
