import { PrismaClient, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
}

interface WorkspaceMemberWithUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  addedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  addedByUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  updatedAt: Date;
}

class WorkspaceMemberService {
  /**
   * Search for users by email or name (case-insensitive, partial match)
   */
  async searchUsers(searchTerm: string, excludeUserIds?: string[]): Promise<UserSearchResult[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            excludeUserIds && excludeUserIds.length > 0
              ? { id: { notIn: excludeUserIds } }
              : {},
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
        take: 10,
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Add a member to a workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    addedBy: string
  ): Promise<WorkspaceMemberWithUser> {
    try {
      // Validate workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Verify adder has OWNER role
      const adderRole = await this.checkUserPermission(workspaceId, addedBy);
      if (adderRole !== WorkspaceRole.OWNER) {
        throw new Error('Only workspace owners can add members');
      }

      // Check if user being added exists
      const userToAdd = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToAdd) {
        throw new Error('User not found');
      }

      // Check if user is already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Check if user is the workspace owner
      if (workspace.ownerId === userId) {
        throw new Error('Workspace owner cannot be added as a member');
      }

      // Create new WorkspaceMember record
      const member = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId,
          role,
          addedBy,
          addedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          addedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return member;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * Get all workspace members
   */
  async getWorkspaceMembers(
    workspaceId: string,
    requestingUserId: string
  ): Promise<WorkspaceMemberWithUser[]> {
    try {
      // Verify requesting user is a member or owner
      const hasAccess = await this.checkUserPermission(workspaceId, requestingUserId);
      if (!hasAccess) {
        throw new Error('You do not have access to this workspace');
      }

      // Get workspace to include owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Get all workspace members
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          addedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Include workspace owner as OWNER role (if not already in members)
      const ownerAsMember: WorkspaceMemberWithUser = {
        id: 'owner',
        workspaceId,
        userId: workspace.ownerId,
        role: WorkspaceRole.OWNER,
        addedAt: workspace.createdAt,
        user: workspace.owner,
        addedByUser: null,
      };

      // Check if owner is not already in members list
      const ownerInMembers = members.some((m) => m.userId === workspace.ownerId);
      const allMembers = ownerInMembers ? members : [ownerAsMember, ...members];

      // Sort by role (OWNER first) then by addedAt
      const roleOrder = { OWNER: 0, EDITOR: 1, VIEWER: 2 };
      allMembers.sort((a, b) => {
        if (a.role !== b.role) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.addedAt.getTime() - b.addedAt.getTime();
      });

      return allMembers;
    } catch (error) {
      console.error('Error getting workspace members:', error);
      throw error;
    }
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    newRole: WorkspaceRole,
    requestingUserId: string
  ): Promise<WorkspaceMemberWithUser> {
    try {
      // Verify requesting user has OWNER role
      const requestingUserRole = await this.checkUserPermission(workspaceId, requestingUserId);
      if (requestingUserRole !== WorkspaceRole.OWNER) {
        throw new Error('Only workspace owners can update member roles');
      }

      // Get the member
      const member = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!member) {
        throw new Error('Member not found');
      }

      if (member.workspaceId !== workspaceId) {
        throw new Error('Member does not belong to this workspace');
      }

      // Get workspace to check if user is the owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Prevent changing workspace owner's role
      if (member.userId === workspace.ownerId) {
        throw new Error('Cannot change workspace owner\'s role');
      }

      // If changing from OWNER role, ensure at least one OWNER remains
      if (member.role === WorkspaceRole.OWNER && newRole !== WorkspaceRole.OWNER) {
        const ownerCount = await prisma.workspaceMember.count({
          where: {
            workspaceId,
            role: WorkspaceRole.OWNER,
          },
        });

        // Account for workspace owner (not in members table)
        const totalOwners = ownerCount + 1;
        if (totalOwners <= 1) {
          throw new Error('Cannot remove the last owner role. At least one owner is required.');
        }
      }

      // Update member role
      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: newRole },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          addedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return updatedMember;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove a member from workspace
   */
  async removeMember(
    workspaceId: string,
    memberId: string,
    requestingUserId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify requesting user has OWNER role
      const requestingUserRole = await this.checkUserPermission(workspaceId, requestingUserId);
      if (requestingUserRole !== WorkspaceRole.OWNER) {
        throw new Error('Only workspace owners can remove members');
      }

      // Get the member
      const member = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        throw new Error('Member not found');
      }

      if (member.workspaceId !== workspaceId) {
        throw new Error('Member does not belong to this workspace');
      }

      // Get workspace to check if user is the owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Prevent removing workspace owner
      if (member.userId === workspace.ownerId) {
        throw new Error('Cannot remove workspace owner');
      }

      // If removing an OWNER, ensure at least one OWNER remains
      if (member.role === WorkspaceRole.OWNER) {
        const ownerCount = await prisma.workspaceMember.count({
          where: {
            workspaceId,
            role: WorkspaceRole.OWNER,
          },
        });

        // Account for workspace owner (not in members table)
        const totalOwners = ownerCount + 1;
        if (totalOwners <= 1) {
          throw new Error('Cannot remove the last owner. At least one owner is required.');
        }
      }

      // Delete WorkspaceMember record
      await prisma.workspaceMember.delete({
        where: { id: memberId },
      });

      return {
        success: true,
        message: 'Member removed successfully',
      };
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Get all workspaces where user is owner or member
   */
  async getUserWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]> {
    try {
      // Get workspaces where user is owner
      const ownedWorkspaces = await prisma.workspace.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          updatedAt: true,
        },
      });

      // Get workspaces where user is a member
      const memberWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              updatedAt: true,
            },
          },
        },
      });

      // Combine and format results
      const memberships: WorkspaceMembership[] = [
        ...ownedWorkspaces.map((ws) => ({
          workspaceId: ws.id,
          workspaceName: ws.name,
          role: WorkspaceRole.OWNER,
          updatedAt: ws.updatedAt,
        })),
        ...memberWorkspaces.map((member) => ({
          workspaceId: member.workspace.id,
          workspaceName: member.workspace.name,
          role: member.role,
          updatedAt: member.workspace.updatedAt,
        })),
      ];

      // Sort by updatedAt (most recent first)
      memberships.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return memberships;
    } catch (error) {
      console.error('Error getting user workspace memberships:', error);
      throw new Error('Failed to get workspace memberships');
    }
  }

  /**
   * Check user's permission level in a workspace
   */
  async checkUserPermission(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      // Check if user is workspace owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (workspace && workspace.ownerId === userId) {
        return WorkspaceRole.OWNER;
      }

      // Check if user is a member
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (member) {
        return member.role;
      }

      return null;
    } catch (error) {
      console.error('Error checking user permission:', error);
      return null;
    }
  }

  /**
   * Helper method to check if role is sufficient
   * Role hierarchy: OWNER > EDITOR > VIEWER
   */
  hasPermission(userRole: WorkspaceRole | null, requiredRole: WorkspaceRole): boolean {
    if (!userRole) {
      return false;
    }

    const roleHierarchy = {
      [WorkspaceRole.OWNER]: 3,
      [WorkspaceRole.EDITOR]: 2,
      [WorkspaceRole.VIEWER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

export default new WorkspaceMemberService();
