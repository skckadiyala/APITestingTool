export enum WorkspaceRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  addedBy?: string;
  addedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  addedByUser?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface UserSearchResult {
  id: string;
  email: string;
  name?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  collectionsCount: number;
  environmentsCount: number;
  membersCount?: number;
  userRole?: WorkspaceRole;
}
