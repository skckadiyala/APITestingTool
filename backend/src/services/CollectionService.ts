import { CollectionType } from '@prisma/client';
import crypto from 'crypto';
import { NotFoundError } from '../utils/errors';

import { prisma } from '../config/prisma';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  workspaceId: string;
  parentFolderId?: string;
  type: CollectionType;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  variables?: any;
  preRequestScript?: string;
  testScript?: string;
  auth?: any;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
}

export interface AddRequestDto {
  name: string;
  method: string;
  url: string;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  requestBodyId?: string;
  params?: any;
  headers?: any;
  body?: any;
  auth?: any;
  testScript?: string;
  preRequestScript?: string;
  // GraphQL-specific fields
  graphqlQuery?: string;
  graphqlVariables?: any;
  graphqlSchema?: any;
  graphqlSchemaUrl?: string;
}

export interface UpdateRequestDto {
  name?: string;
  method?: string;
  url?: string;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  params?: any;
  headers?: any;
  body?: any;
  auth?: any;
  testScript?: string;
  preRequestScript?: string;
  // GraphQL-specific fields
  graphqlQuery?: string;
  graphqlVariables?: any;
  graphqlSchema?: any;
  graphqlSchemaUrl?: string;
  graphqlSchemaLastFetched?: Date;
}

export interface MoveRequestDto {
  collectionId: string;
  orderIndex?: number;
}

export interface ReorderItemDto {
  id: string;
  orderIndex: number;
}

class CollectionService {
  // Maximum nesting depth to prevent performance issues and potential attacks
  private readonly MAX_NESTING_DEPTH = 10;

  /**
   * Build nested include structure dynamically based on depth
   * This prevents N+1 queries by using Prisma's built-in JOIN capabilities
   */
  private buildNestedInclude(depth: number): any {
    if (depth <= 0) {
      return {
        requests: {
          orderBy: {
            orderIndex: 'asc' as const,
          },
        },
      };
    }

    return {
      requests: {
        orderBy: {
          orderIndex: 'asc' as const,
        },
      },
      childFolders: {
        orderBy: {
          orderIndex: 'asc' as const,
        },
        include: this.buildNestedInclude(depth - 1),
      },
    };
  }

  /**
   * Create a new collection
   * Note: Workspace permission checks are handled by route middleware (requireWorkspaceEditor)
   */
  async createCollection(data: CreateCollectionDto) {
    // Get the max order index for collections at this level
    const maxOrder = await prisma.collection.findFirst({
      where: {
        workspaceId: data.workspaceId,
        parentFolderId: data.parentFolderId || null,
        type: CollectionType.COLLECTION,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const orderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    return await prisma.collection.create({
      data: {
        ...data,
        orderIndex,
      },
      include: {
        childFolders: true,
        requests: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get all collections in a workspace
   * Note: Workspace permission checks are handled by route middleware (requireWorkspaceViewer)
   * @param workspaceId - The workspace ID
   * @param maxDepth - Maximum nesting depth (default: 5, max: 10)
   * @returns Array of collections with nested folders and requests
   */
  async getCollections(workspaceId: string, maxDepth: number = 5) {
    // Enforce maximum depth to prevent performance issues
    const safeDepth = Math.min(maxDepth, this.MAX_NESTING_DEPTH);

    const startTime = Date.now();

    // Single query with nested includes - replaces N+1 recursive queries
    const collections = await prisma.collection.findMany({
      where: {
        workspaceId,
        parentFolderId: null,
        type: CollectionType.COLLECTION,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      include: this.buildNestedInclude(safeDepth),
    });

    const duration = Date.now() - startTime;

    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] getCollections for workspace ${workspaceId}: ${duration}ms (depth: ${safeDepth})`);
    }

    // Warn if query is slow
    if (duration > 1000) {
      console.warn(`[PERF] Slow query detected: getCollections took ${duration}ms`);
    }

    return collections;
  }

  /**
   * Get a collection by ID with all nested folders and requests
   * Note: Workspace permission checks are handled by route middleware (requireWorkspaceViewer)
   * @param id - The collection ID
   * @param includeNested - Whether to include nested folders (default: true)
   * @param maxDepth - Maximum nesting depth (default: 5, max: 10)
   * @returns Collection with nested folders and requests
   */
  async getCollectionById(id: string, includeNested = true, maxDepth: number = 5) {
    const startTime = Date.now();

    if (!includeNested) {
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          childFolders: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
          requests: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      });

      const duration = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] getCollectionById (shallow) for ${id}: ${duration}ms`);
      }

      return collection;
    }

    // Enforce maximum depth to prevent performance issues
    const safeDepth = Math.min(maxDepth, this.MAX_NESTING_DEPTH);

    // Single query with nested includes - replaces N+1 recursive queries
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: this.buildNestedInclude(safeDepth),
    });

    const duration = Date.now() - startTime;

    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] getCollectionById for ${id}: ${duration}ms (depth: ${safeDepth})`);
    }

    // Warn if query is slow
    if (duration > 500) {
      console.warn(`[PERF] Slow query detected: getCollectionById took ${duration}ms`);
    }

    return collection;
  }

  /**
   * Update a collection
   * Note: Workspace permission checks are handled by route middleware (requireWorkspaceEditor)
   */
  async updateCollection(id: string, data: UpdateCollectionDto) {
    return await prisma.collection.update({
      where: { id },
      data,
      include: {
        childFolders: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        requests: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  /**
   * Delete a collection (cascades to child folders and requests)
   * Note: Workspace permission checks are handled by route middleware (requireWorkspaceEditor)
   */
  async deleteCollection(id: string) {
    return await prisma.collection.delete({
      where: { id },
    });
  }

  /**
   * Create a folder in a collection
   */
  async createFolder(collectionId: string, data: CreateFolderDto) {
    // Get the parent collection
    const parentCollection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!parentCollection) {
      throw new NotFoundError('Parent collection not found');
    }

    // Get max order index for folders in this collection
    const maxOrder = await prisma.collection.findFirst({
      where: {
        parentFolderId: collectionId,
        type: CollectionType.FOLDER,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const orderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    return await prisma.collection.create({
      data: {
        name: data.name,
        description: data.description,
        workspaceId: parentCollection.workspaceId,
        parentFolderId: collectionId,
        type: CollectionType.FOLDER,
        orderIndex,
      },
      include: {
        childFolders: true,
        requests: true,
      },
    });
  }

  /**
   * Add a request to a collection
   */
  async addRequest(collectionId: string, data: AddRequestDto) {
    // Verify collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError('Collection not found');
    }

    // Get max order index for requests in this collection
    const maxOrder = await prisma.request.findFirst({
      where: {
        collectionId,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const orderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    return await prisma.request.create({
      data: {
        ...data,
        collectionId,
        orderIndex,
      },
    });
  }

  /**
   * Update an existing request
   */
  async updateRequest(requestId: string, data: UpdateRequestDto) {
    // Verify request exists
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    return await prisma.request.update({
      where: { id: requestId },
      data,
    });
  }

  /**
   * Get request with GraphQL schema
   */
  async getRequestWithSchema(requestId: string) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        name: true,
        url: true,
        graphqlSchema: true,
        graphqlSchemaUrl: true,
        graphqlSchemaLastFetched: true,
        collectionId: true,
      },
    });

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    return request;
  }

  /**
   * Move a request to a different folder/collection
   */
  async moveRequest(requestId: string, data: MoveRequestDto) {
    // Verify target collection exists
    const targetCollection = await prisma.collection.findUnique({
      where: { id: data.collectionId },
    });

    if (!targetCollection) {
      throw new NotFoundError('Target collection not found');
    }

    // If order index not provided, add to end
    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const maxOrder = await prisma.request.findFirst({
        where: {
          collectionId: data.collectionId,
        },
        orderBy: {
          orderIndex: 'desc',
        },
        select: {
          orderIndex: true,
        },
      });
      orderIndex = (maxOrder?.orderIndex ?? -1) + 1;
    }

    return await prisma.request.update({
      where: { id: requestId },
      data: {
        collectionId: data.collectionId,
        orderIndex,
      },
    });
  }

  /**
   * Reorder items in a collection
   */
  async reorderItems(collectionId: string, items: ReorderItemDto[]) {
    // Verify collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Update order indices for requests in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.request.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    // Return updated collection
    return await this.getCollectionById(collectionId, false);
  }

  /**
   * Duplicate a collection
   */
  async duplicateCollection(id: string) {
    const original = await this.getCollectionById(id, true);

    if (!original) {
      throw new Error('Collection not found');
    }

    // Recursive function to duplicate collection and all children
    const duplicateRecursive = async (
      sourceCollection: any,
      parentFolderId: string | null = null
    ): Promise<any> => {
      // Create the collection copy
      const newCollection = await prisma.collection.create({
        data: {
          name: `${sourceCollection.name} (Copy)`,
          description: sourceCollection.description,
          workspaceId: sourceCollection.workspaceId,
          parentFolderId,
          type: sourceCollection.type,
          orderIndex: sourceCollection.orderIndex,
        },
      });

      // Duplicate requests
      if (sourceCollection.requests && sourceCollection.requests.length > 0) {
        await Promise.all(
          sourceCollection.requests.map((request: any) =>
            prisma.request.create({
              data: {
                name: request.name,
                method: request.method,
                url: request.url,
                collectionId: newCollection.id,
                requestBodyId: request.requestBodyId,
                orderIndex: request.orderIndex,
              },
            })
          )
        );
      }

      // Duplicate child folders recursively
      if (sourceCollection.childFolders && sourceCollection.childFolders.length > 0) {
        await Promise.all(
          sourceCollection.childFolders.map((folder: any) =>
            duplicateRecursive(folder, newCollection.id)
          )
        );
      }

      return newCollection;
    };

    return await duplicateRecursive(original);
  }

  /**
   * Generate a shareable link for a collection
   */
  async generateShareLink(id: string) {
    // Generate a unique token
    const shareToken = crypto.randomBytes(32).toString('hex');

    await prisma.collection.update({
      where: { id },
      data: {
        shareToken,
        isShared: true,
      },
    });

    return {
      shareToken,
      shareUrl: `/shared/${shareToken}`,
    };
  }

  /**
   * Revoke share link for a collection
   */
  async revokeShareLink(id: string) {
    return await prisma.collection.update({
      where: { id },
      data: {
        shareToken: null,
        isShared: false,
      },
    });
  }

  /**
   * Get collection by share token
   */
  async getCollectionByShareToken(shareToken: string) {
    return await this.getCollectionById(
      (
        await prisma.collection.findUnique({
          where: { shareToken },
        })
      )?.id || '',
      true
    );
  }

  /**
   * Delete a request from a collection
   */
  async deleteRequest(requestId: string) {
    return await prisma.request.delete({
      where: { id: requestId },
    });
  }

}

export default new CollectionService();
