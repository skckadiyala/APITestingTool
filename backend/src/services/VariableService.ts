import { PrismaClient } from '@prisma/client';

/**
 * Service for managing environment, collection, and global variables.
 * Handles CRUD operations and ensures consistent behavior across the application.
 */
export class VariableService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update environment variables from script changes
   * @param environmentId - The ID of the environment to update
   * @param updates - Key-value pairs to update. Use undefined value to unset a variable.
   */
  async updateEnvironmentVariables(
    environmentId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const environment = await this.prisma.environment.findUnique({
        where: { id: environmentId },
      });

      if (!environment) {
        console.error('Environment not found:', environmentId);
        return;
      }

      const variables = (environment.variables as any[]) || [];
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        const existingIndex = variables.findIndex((v: any) => v.key === key);
        
        if (value === undefined) {
          // Unset: remove the variable
          if (existingIndex !== -1) {
            variables.splice(existingIndex, 1);
          }
        } else {
          // Set: update or add the variable
          if (existingIndex !== -1) {
            variables[existingIndex].value = value;
          } else {
            variables.push({
              key,
              value,
              type: 'default',
              enabled: true,
            });
          }
        }
      });

      // Save updated variables
      await this.prisma.environment.update({
        where: { id: environmentId },
        data: { variables: variables as any },
      });
    } catch (error) {
      console.error('Error updating environment variables:', error);
    }
  }

  /**
   * Update collection variables from script changes.
   * If the collection is a folder, it finds and updates the root collection instead.
   * @param collectionId - The ID of the collection (or folder) to update
   * @param updates - Key-value pairs to update. Use undefined value to unset a variable.
   */
  async updateCollectionVariables(
    collectionId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      let collection = await this.prisma.collection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        console.error('Collection not found:', collectionId);
        return;
      }

      // If it's a folder, find the root collection
      // Collection variables should always be stored at the root collection level
      if (collection.type === 'FOLDER' && collection.parentFolderId) {
        let currentId: string | undefined = collection.parentFolderId;
        let rootCollection: any = null;

        while (currentId) {
          const parent: any = await this.prisma.collection.findUnique({
            where: { id: currentId },
          });

          if (!parent) break;

          if (parent.type === 'COLLECTION') {
            rootCollection = parent;
            break;
          }

          currentId = parent.parentFolderId || undefined;
        }

        if (rootCollection) {
          collection = rootCollection;
        }
      }

      const variables = ((collection as any).variables as any[]) || [];
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        const existingIndex = variables.findIndex((v: any) => v.key === key);
        
        if (value === undefined) {
          // Unset: remove the variable
          if (existingIndex !== -1) {
            variables.splice(existingIndex, 1);
          }
        } else {
          // Set: update or add the variable
          if (existingIndex !== -1) {
            variables[existingIndex].value = value;
          } else {
            variables.push({
              key,
              value,
              type: 'default',
              enabled: true,
            });
          }
        }
      });

      // Save updated variables to the root collection
      if (collection) {
        await this.prisma.collection.update({
          where: { id: collection.id },
          data: { variables: variables } as any,
        });
      }
    } catch (error) {
      console.error('Error updating collection variables:', error);
    }
  }

  /**
   * Update global variables from script changes
   * @param workspaceId - The ID of the workspace to update
   * @param updates - Key-value pairs to update. Use undefined value to unset a variable.
   */
  async updateGlobalVariables(
    workspaceId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        console.error('Workspace not found:', workspaceId);
        return;
      }

      const settings = (workspace.settings as any) || {};
      const variables = (settings.globalVariables as any[]) || [];
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        const existingIndex = variables.findIndex((v: any) => v.key === key);
        
        if (value === undefined) {
          // Unset: remove the variable
          if (existingIndex !== -1) {
            variables.splice(existingIndex, 1);
          }
        } else {
          // Set: update or add the variable
          if (existingIndex !== -1) {
            variables[existingIndex].value = value;
          } else {
            variables.push({
              key,
              value,
              type: 'default',
              enabled: true,
            });
          }
        }
      });

      // Save updated global variables
      settings.globalVariables = variables;
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { settings: settings as any },
      });
    } catch (error) {
      console.error('Error updating global variables:', error);
    }
  }
}
