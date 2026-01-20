export const WorkspaceRole = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER'
} as const;

export type WorkspaceRole = typeof WorkspaceRole[keyof typeof WorkspaceRole];

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

export interface WorkspaceSettings {
  validateSSL?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings?: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
  collectionsCount: number;
  environmentsCount: number;
  membersCount?: number;
  userRole?: WorkspaceRole;
}
