import { useWorkspaceStore } from '../stores/workspaceStore';
import type { Workspace } from '../services/workspaceService';

interface WorkspaceHookResult {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  hasWorkspace: boolean;
}

/**
 * Hook to access current workspace context
 * Returns status object instead of throwing - prevents app crashes
 */
export function useWorkspace(): WorkspaceHookResult {
  const { currentWorkspace, isLoading } = useWorkspaceStore();
  
  return {
    workspace: currentWorkspace,
    isLoading,
    error: !currentWorkspace && !isLoading ? 'No workspace selected' : null,
    hasWorkspace: !!currentWorkspace,
  };
}
