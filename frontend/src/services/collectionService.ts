import axios from 'axios';
import { API_BASE_URL } from './api';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  parentFolderId?: string | null;
  type: 'COLLECTION' | 'FOLDER';
  orderIndex: number;
  shareToken?: string | null;
  isShared: boolean;
  variables?: any[];
  preRequestScript?: string | null;
  testScript?: string | null;
  auth?: any;
  createdAt: string;
  updatedAt: string;
  childFolders?: Collection[];
  requests?: CollectionRequest[];
}

export interface CollectionRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  collectionId: string;
  requestBodyId?: string | null;
  body: any;
  headers?: any;
  auth?: any;
  params?: any;
  orderIndex: number;
  testScript?: string | null;
  preRequestScript?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  workspaceId: string;
  parentFolderId?: string;
  type: 'COLLECTION' | 'FOLDER';
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  variables?: any[];
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
  headers?: any;
  body?: any;
  auth?: any;
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
  async createCollection(data: CreateCollectionDto): Promise<Collection> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${data.workspaceId}/collections`, data);
    return response.data;
  }

  /**
   * Get all collections in a workspace
   */
  async getCollections(workspaceId: string): Promise<{ collections: Collection[]; total: number }> {
    const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/collections`);
    return response.data;
  }

  /**
   * Get a collection by ID
   */
  async getCollectionById(id: string, workspaceId: string, nested = true): Promise<Collection> {
    const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${id}`, {
      params: { nested },
    });
    return response.data;
  }

  /**
   * Update a collection
   */
  async updateCollection(id: string, workspaceId: string, data: UpdateCollectionDto): Promise<Collection> {
    const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${id}`, data);
    return response.data;
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: string, workspaceId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${id}`);
  }

  /**
   * Create a folder in a collection
   */
  async createFolder(collectionId: string, workspaceId: string, data: CreateFolderDto): Promise<Collection> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${collectionId}/folders`, data);
    return response.data;
  }

  /**
   * Add a request to a collection
   */
  async addRequest(collectionId: string, workspaceId: string, data: AddRequestDto): Promise<CollectionRequest> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${collectionId}/requests`, data);
    return response.data;
  }

  /**
   * Update an existing request
   */
  async updateRequest(requestId: string, workspaceId: string, data: UpdateRequestDto): Promise<CollectionRequest> {
    const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}/collections/requests/${requestId}`, data);
    return response.data;
  }

  /**
   * Move a request to a different folder/collection
   */
  async moveRequest(requestId: string, workspaceId: string, data: MoveRequestDto): Promise<CollectionRequest> {
    const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}/collections/requests/${requestId}/move`, data);
    return response.data;
  }

  /**
   * Reorder items in a collection
   */
  async reorderItems(collectionId: string, workspaceId: string, items: ReorderItemDto[]): Promise<Collection> {
    const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${collectionId}/reorder`, { items });
    return response.data;
  }

  /**
   * Duplicate a collection
   */
  async duplicateCollection(id: string, workspaceId: string): Promise<Collection> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/collections/${id}/duplicate`);
    return response.data;
  }

  /**
   * Generate a shareable link
   */
  async generateShareLink(id: string): Promise<{ shareToken: string; shareUrl: string }> {
    const response = await axios.post(`${API_BASE_URL}/collections/${id}/share`);
    return response.data;
  }

  /**
   * Revoke a shareable link
   */
  async revokeShareLink(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/collections/${id}/share`);
  }

  /**
   * Get collection by share token
   */
  async getSharedCollection(token: string): Promise<Collection> {
    const response = await axios.get(`${API_BASE_URL}/collections/shared/${token}`);
    return response.data;
  }

  /**
   * Delete a request from a collection
   */
  async deleteRequest(requestId: string, workspaceId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}/collections/requests/${requestId}`);
  }

  /**
   * Export collection
   */
  async exportCollection(
    collectionId: string,
    workspaceId: string,
    format: 'postman' | 'curl' | 'openapi' | 'zip',
    includeEnvironmentVariables: boolean = false
  ): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/workspaces/${workspaceId}/collections/${collectionId}/export`,
      {
        params: { format, includeEnvironmentVariables: includeEnvironmentVariables.toString() },
        responseType: 'blob'
      }
    );
    return response.data;
  }

  /**
   * Import collection
   */
  async importCollection(
    file: File, 
    workspaceId: string,
    format?: 'postman' | 'openapi' | 'insomnia' | 'curl'
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);
    if (format) {
      formData.append('format', format);
    }

    const response = await axios.post<{ message: string; result: ImportResult }>(
      `${API_BASE_URL}/workspaces/${workspaceId}/collections/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.result;
  }
}

export interface ImportResult {
  collectionId: string;
  name: string;
  requestsCount: number;
  foldersCount: number;
}

export default new CollectionService();
