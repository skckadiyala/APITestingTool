import { PrismaClient, Workspace, Prisma, WorkspaceRole } from '@prisma/client';
import WorkspaceMemberService from './WorkspaceMemberService';

const prisma = new PrismaClient();

export class WorkspaceService {
  /**
   * Create a new workspace
   */
  static async createWorkspace(userId: string, name: string, description?: string): Promise<Workspace> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    if (name.length > 100) {
      throw new Error('Workspace name must be 100 characters or less');
    }

    // Create workspace and default environment in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      // Create workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: userId,
          settings: {},
        },
      });

      // Create default environment
      await tx.environment.create({
        data: {
          name: 'Development',
          workspaceId: newWorkspace.id,
          variables: [],
        },
      });

      return newWorkspace;
    });

    return workspace;
  }

  /**
   * Get all workspaces for a user
   */
  static async getUserWorkspaces(userId: string) {
    // Get workspaces where user is owner
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        _count: {
          select: {
            collections: {
              where: {
                type: 'COLLECTION', // Only count collections, not folders
              },
            },
            environments: true,
            members: true,
          },
        },
      },
    });

    // Get workspaces where user is a member
    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                collections: {
                  where: {
                    type: 'COLLECTION',
                  },
                },
                environments: true,
                members: true,
              },
            },
          },
        },
      },
    });

    // Combine and format results
    const allWorkspaces = [
      ...ownedWorkspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        ownerId: workspace.ownerId,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        settings: workspace.settings,
        collectionsCount: workspace._count.collections,
        environmentsCount: workspace._count.environments,
        membersCount: workspace._count.members + 1, // +1 for owner
        userRole: WorkspaceRole.OWNER, // Frontend expects userRole
      })),
      ...memberWorkspaces.map((member) => ({
        id: member.workspace.id,
        name: member.workspace.name,
        description: member.workspace.description,
        ownerId: member.workspace.ownerId,
        createdAt: member.workspace.createdAt,
        updatedAt: member.workspace.updatedAt,
        settings: member.workspace.settings,
        collectionsCount: member.workspace._count.collections,
        environmentsCount: member.workspace._count.environments,
        membersCount: member.workspace._count.members + 1, // +1 for owner
        userRole: member.role, // Frontend expects userRole
      })),
    ];

    // Sort by updatedAt descending
    allWorkspaces.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return allWorkspaces;
  }

  /**
   * Get workspace by ID
   */
  static async getWorkspaceById(workspaceId: string, userId: string) {
    // Check if user has access (owner or member)
    const userRole = await WorkspaceMemberService.checkUserPermission(workspaceId, userId);
    
    if (!userRole) {
      throw new Error('Workspace not found or access denied');
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            collections: {
              where: {
                type: 'COLLECTION', // Only count collections, not folders
              },
            },
            environments: true,
            members: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      settings: workspace.settings,
      owner: workspace.owner,
      collectionsCount: workspace._count.collections,
      environmentsCount: workspace._count.environments,
      membersCount: workspace._count.members + 1, // +1 for owner
      userRole: userRole,
    };
  }

  /**
   * Update workspace
   */
  static async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: { name?: string; description?: string; settings?: any }
  ): Promise<Workspace> {
    // Check user's role in workspace
    const userRole = await WorkspaceMemberService.checkUserPermission(workspaceId, userId);

    if (!userRole) {
      throw new Error('Workspace not found or access denied');
    }

    // Check if user has OWNER or EDITOR role for name/description updates
    if (updates.name !== undefined || updates.description !== undefined) {
      if (!WorkspaceMemberService.hasPermission(userRole, WorkspaceRole.EDITOR)) {
        throw new Error('You need EDITOR or OWNER role to update workspace details');
      }
    }

    // Only OWNER can update settings
    if (updates.settings !== undefined) {
      if (userRole !== WorkspaceRole.OWNER) {
        throw new Error('Only workspace owners can update settings');
      }
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Workspace name is required');
      }

      if (updates.name.length > 100) {
        throw new Error('Workspace name must be 100 characters or less');
      }
    }

    // Build update data
    const updateData: any = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.settings !== undefined) {
      updateData.settings = updates.settings;
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: updateData,
    });

    return updatedWorkspace;
  }

  /**
   * Delete workspace
   */
  static async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    // Only workspace owner can delete workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found or only the owner can delete a workspace');
    }

    // Check if this is the user's only workspace
    const workspaceCount = await prisma.workspace.count({
      where: {
        ownerId: userId,
      },
    });

    if (workspaceCount <= 1) {
      throw new Error('Cannot delete your only workspace');
    }

    // Delete workspace (cascade will handle related data including WorkspaceMembers)
    await prisma.workspace.delete({
      where: {
        id: workspaceId,
      },
    });
  }

  /**
   * Duplicate workspace
   */
  static async duplicateWorkspace(workspaceId: string, userId: string): Promise<Workspace> {
    // Verify ownership
    const originalWorkspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
      },
      include: {
        collections: {
          include: {
            requests: true,
          },
        },
        environments: true,
      },
    });

    if (!originalWorkspace) {
      throw new Error('Workspace not found or access denied');
    }

    // Create duplicate in a transaction
    const duplicatedWorkspace = await prisma.$transaction(async (tx) => {
      // Create new workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          name: `${originalWorkspace.name} (Copy)`,
          ownerId: userId,
        },
      });

      // Duplicate environments
      for (const env of originalWorkspace.environments) {
        await tx.environment.create({
          data: {
            name: env.name,
            workspaceId: newWorkspace.id,
            variables: env.variables as Prisma.InputJsonValue,
          },
        });
      }

      // Duplicate collections (only root collections, not folders in this simplified version)
      const collectionIdMap = new Map<string, string>();

      for (const collection of originalWorkspace.collections) {
        if (!collection.parentFolderId) {
          // This is a root collection
          const newCollection = await tx.collection.create({
            data: {
              name: collection.name,
              description: collection.description,
              workspaceId: newWorkspace.id,
              type: collection.type,
              orderIndex: collection.orderIndex,
              variables: collection.variables as Prisma.InputJsonValue,
              preRequestScript: collection.preRequestScript,
              testScript: collection.testScript,
              auth: collection.auth as Prisma.InputJsonValue,
            },
          });

          collectionIdMap.set(collection.id, newCollection.id);

          // Duplicate requests in this collection
          for (const request of collection.requests) {
            await tx.request.create({
              data: {
                name: request.name,
                method: request.method,
                url: request.url,
                collectionId: newCollection.id,
                params: request.params as Prisma.InputJsonValue,
                headers: request.headers as Prisma.InputJsonValue,
                body: request.body as Prisma.InputJsonValue,
                auth: request.auth as Prisma.InputJsonValue,
                orderIndex: request.orderIndex,
                description: request.description,
                testScript: request.testScript,
                preRequestScript: request.preRequestScript,
              },
            });
          }
        }
      }

      return newWorkspace;
    });

    return duplicatedWorkspace;
  }

  /**
   * Check if user is a member of workspace (owner or has WorkspaceMember record)
   */
  static async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const userRole = await WorkspaceMemberService.checkUserPermission(workspaceId, userId);
    return userRole !== null;
  }

  /**
   * Check if user has required permission level in workspace
   */
  static async hasWorkspacePermission(
    workspaceId: string,
    userId: string,
    requiredRole: WorkspaceRole
  ): Promise<boolean> {
    const userRole = await WorkspaceMemberService.checkUserPermission(workspaceId, userId);
    return WorkspaceMemberService.hasPermission(userRole, requiredRole);
  }
}
