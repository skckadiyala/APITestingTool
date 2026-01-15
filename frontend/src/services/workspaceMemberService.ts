import api from './api';
import type { WorkspaceMember, UserSearchResult, WorkspaceRole, Workspace } from '../types/workspace.types';

export const workspaceMemberService = {
  // Search for users
  async searchUsers(searchTerm: string): Promise<UserSearchResult[]> {
    const response = await api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data.users;
  },

  // Add member to workspace
  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const response = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
    return response.data.member;
  },

  // Get workspace members
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data.members;
  },

  // Update member role
  async updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const response = await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
    return response.data.member;
  },

  // Remove member
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  // Get user's workspace memberships
  async getUserWorkspaceMemberships(): Promise<Workspace[]> {
    const response = await api.get('/workspaces/memberships');
    return response.data.memberships;
  }
};

export default workspaceMemberService;
