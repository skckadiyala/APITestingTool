import { PrismaClient, CollectionType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
  requestBodyId?: string;
  params?: any;
  testScript?: string;
  preRequestScript?: string;
}

export interface UpdateRequestDto {
  name?: string;
  method?: string;
  url?: string;
  params?: any;
  headers?: any;
  body?: any;
  auth?: any;
  testScript?: string;
  preRequestScript?: string;
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
  /**
   * Create a new collection
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
   */
  async getCollections(workspaceId: string) {
    // Recursive function to get nested structure
    const getNestedStructure = async (collectionId: string): Promise<any> => {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          requests: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
          childFolders: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      });

      if (!collection) return null;

      // Recursively get child folders
      const childFoldersWithNested = await Promise.all(
        collection.childFolders.map(async (folder) => {
          return await getNestedStructure(folder.id);
        })
      );

      return {
        ...collection,
        childFolders: childFoldersWithNested,
      };
    };

    // Get top-level collections (no parent folder)
    const topLevelCollections = await prisma.collection.findMany({
      where: {
        workspaceId,
        parentFolderId: null,
        type: CollectionType.COLLECTION,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    // Get nested structure for each collection
    const result = await Promise.all(
      topLevelCollections.map(async (collection) => {
        return await getNestedStructure(collection.id);
      })
    );

    return result;
  }

  /**
   * Get a collection by ID with all nested folders and requests
   */
  async getCollectionById(id: string, includeNested = true) {
    if (!includeNested) {
      return await prisma.collection.findUnique({
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
    }

    // Recursive function to get nested structure
    const getNestedCollection = async (collectionId: string): Promise<any> => {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          requests: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
          childFolders: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      });

      if (!collection) return null;

      // Recursively get child folders
      const childFoldersWithNested = await Promise.all(
        collection.childFolders.map(async (folder) => {
          return await getNestedCollection(folder.id);
        })
      );

      return {
        ...collection,
        childFolders: childFoldersWithNested,
      };
    };

    return await getNestedCollection(id);
  }

  /**
   * Update a collection
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
      throw new Error('Parent collection not found');
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
      throw new Error('Collection not found');
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
      throw new Error('Request not found');
    }

    return await prisma.request.update({
      where: { id: requestId },
      data,
    });
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
      throw new Error('Target collection not found');
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
