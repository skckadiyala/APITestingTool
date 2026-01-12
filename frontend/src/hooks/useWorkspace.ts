import { useWorkspaceStore } from '../stores/workspaceStore';

/**
 * Hook to access current workspace context
 * Throws error if no workspace is selected
 */
export function useWorkspace() {
  const { currentWorkspace, isLoading } = useWorkspaceStore();
  
  if (!currentWorkspace && !isLoading) {
    throw new Error('No workspace selected');
  }
  
  return { workspace: currentWorkspace, isLoading };
}
