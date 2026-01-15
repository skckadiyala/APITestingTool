import { useWorkspaceStore } from '../stores/workspaceStore';
import { WorkspaceRole } from '../types/workspace.types';

export const useWorkspacePermission = (workspaceId?: string) => {
  const { currentWorkspace } = useWorkspaceStore();
  
  const userRole = currentWorkspace?.userRole;
  
  const isOwner = userRole === WorkspaceRole.OWNER;
  const isEditor = userRole === WorkspaceRole.EDITOR || isOwner;
  const isViewer = userRole === WorkspaceRole.VIEWER;
  
  const canEdit = isEditor;
  const canDelete = isOwner;
  const canInvite = isOwner;
  const canManageMembers = isOwner;
  
  return {
    userRole,
    isOwner,
    isEditor,
    isViewer,
    canEdit,
    canDelete,
    canInvite,
    canManageMembers
  };
};
