import { create } from 'zustand';
import collectionService from '../services/collectionService';
import type { Collection, CollectionRequest } from '../services/collectionService';
import type { 
  AuthConfig, 
  RequestBody, 
  RequestParam, 
  RequestHeader 
} from '../types';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from './workspaceStore';

interface CollectionState {
  collections: Collection[];
  currentWorkspaceId: string;
  loading: boolean;
  error: string | null;
  selectedCollection: Collection | null;
  selectedRequest: CollectionRequest | null;

  // Actions
  setWorkspaceId: (workspaceId: string) => void;
  loadCollections: (workspaceId: string) => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<Collection | null>;
  createFolder: (collectionId: string, name: string, description?: string) => Promise<Collection | null>;
  addRequestToCollection: (
    collectionId: string, 
    name: string, 
    method: string, 
    url: string, 
    requestBodyId?: string, 
    testScript?: string, 
    preRequestScript?: string, 
    params?: RequestParam[], 
    headers?: RequestHeader[], 
    body?: RequestBody | null, 
    auth?: AuthConfig | null,
    requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET',
    graphqlQuery?: string,
    graphqlVariables?: Record<string, any>,
    graphqlSchema?: any
  ) => Promise<CollectionRequest | null>;
  updateRequestInCollection: (
    requestId: string, 
    data: { 
      name?: string; 
      method?: string; 
      url?: string; 
      params?: RequestParam[]; 
      headers?: RequestHeader[]; 
      body?: RequestBody | null; 
      auth?: AuthConfig | null; 
      testScript?: string; 
      preRequestScript?: string;
    }
  ) => Promise<void>;
  updateCollection: (id: string, name?: string, description?: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  duplicateCollection: (id: string) => Promise<void>;
  moveRequest: (requestId: string, targetCollectionId: string, orderIndex?: number) => Promise<void>;
  reorderItems: (collectionId: string, items: { id: string; orderIndex: number }[]) => Promise<void>;
  selectCollection: (collection: Collection | null) => void;
  selectRequest: (request: CollectionRequest | null) => void;
  generateShareLink: (id: string) => Promise<{ shareToken: string; shareUrl: string } | null>;
  revokeShareLink: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  currentWorkspaceId: '', // Will be set from workspace store
  loading: false,
  error: null,
  selectedCollection: null,
  selectedRequest: null,

  setWorkspaceId: (workspaceId: string) => {
    const state = get();
    // Only update if workspace ID actually changed
    if (state.currentWorkspaceId !== workspaceId) {
      set({ currentWorkspaceId: workspaceId });
      get().loadCollections(workspaceId);
    }
  },

  loadCollections: async (workspaceId: string) => {
    // Prevent concurrent loads
    const state = get();
    if (state.loading) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const { collections } = await collectionService.getCollections(workspaceId);
      // Sort collections alphabetically in ascending order
      const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
      set({ collections: sortedCollections, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load collections', loading: false });
      toast.error('Failed to load collections');
    }
  },

  createCollection: async (name: string, description?: string) => {
    const { currentWorkspaceId } = get();
    set({ loading: true, error: null });
    try {
      const collection = await collectionService.createCollection({
        name,
        description,
        workspaceId: currentWorkspaceId,
        type: 'COLLECTION',
      });
      
      // Reload collections to get the updated list
      await get().loadCollections(currentWorkspaceId);
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success(`Collection "${name}" created successfully`);
      set({ loading: false });
      return collection;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create collection', loading: false });
      toast.error('Failed to create collection');
      return null;
    }
  },

  createFolder: async (collectionId: string, name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      const folder = await collectionService.createFolder(collectionId, workspaceId, { name, description });
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success(`Folder "${name}" created successfully`);
      set({ loading: false });
      return folder;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create folder', loading: false });
      toast.error('Failed to create folder');
      return null;
    }
  },

  addRequestToCollection: async (collectionId: string, name: string, method: string, url: string, requestBodyId?: string, testScript?: string, preRequestScript?: string, params?: RequestParam[], headers?: RequestHeader[], body?: RequestBody | null, auth?: AuthConfig | null, requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET', graphqlQuery?: string, graphqlVariables?: Record<string, any>, graphqlSchema?: any) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      const request = await collectionService.addRequest(collectionId, workspaceId, {
        name,
        method,
        url,
        requestBodyId,
        requestType,
        params,
        headers,
        body,
        auth,
        testScript,
        preRequestScript,
        graphqlQuery,
        graphqlVariables,
        graphqlSchema,
      });
      
      // Reset loading state before reloading collections to prevent race condition
      set({ loading: false });
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success(`Request "${name}" added to collection`);
      return request;
    } catch (error: any) {
      set({ error: error.message || 'Failed to add request', loading: false });
      toast.error('Failed to add request');
      return null;
    }
  },

  updateRequestInCollection: async (requestId: string, data: { name?: string; method?: string; url?: string; params?: RequestParam[]; headers?: RequestHeader[]; body?: RequestBody | null; auth?: AuthConfig | null; testScript?: string; preRequestScript?: string }) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.updateRequest(requestId, workspaceId, data);
      
      // Reset loading state before reloading collections
      set({ loading: false });
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success('Request updated successfully');
    } catch (error: any) {
      set({ error: error.message || 'Failed to update request', loading: false });
      toast.error('Failed to update request');
    }
  },

  updateCollection: async (id: string, name?: string, description?: string) => {
    set({ error: null });
    
    // Store original collections for rollback
    const originalCollections = get().collections;
    
    try {
      const workspaceId = get().currentWorkspaceId;
      
      // Optimistically update the collection in state immediately
      const updateCollectionInList = (collections: Collection[]): Collection[] => {
        return collections.map(col => {
          if (col.id === id) {
            return { ...col, ...(name !== undefined && { name }), ...(description !== undefined && { description }) };
          }
          if (col.childFolders?.length) {
            return { ...col, childFolders: updateCollectionInList(col.childFolders) };
          }
          return col;
        });
      };
      
      set({ collections: updateCollectionInList(originalCollections) });
      
      // Update in the backend - no need to reload since optimistic update is already applied
      await collectionService.updateCollection(id, workspaceId, { name, description });
      
      toast.success('Collection updated successfully');
    } catch (error: any) {
      // Revert optimistic update on error
      set({ collections: originalCollections, error: error.message || 'Failed to update collection' });
      toast.error('Failed to update collection');
    }
  },

  deleteCollection: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.deleteCollection(id, workspaceId);
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success('Collection deleted successfully');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete collection', loading: false });
      toast.error('Failed to delete collection');
    }
  },

  deleteRequest: async (requestId: string) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.deleteRequest(requestId, workspaceId);
      
      // Close the tab if this request is currently open
      const { useTabStore } = await import('./tabStore');
      const tabs = useTabStore.getState().tabs;
      const tabToClose = tabs.find(t => t.requestId === requestId);
      if (tabToClose) {
        useTabStore.getState().closeTab(tabToClose.id);
      }
      
      // Reset loading state before reloading collections
      set({ loading: false });
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success('Request deleted successfully');
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete request', loading: false });
      toast.error('Failed to delete request');
    }
  },

  duplicateCollection: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.duplicateCollection(id, workspaceId);
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success('Collection duplicated successfully');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to duplicate collection', loading: false });
      toast.error('Failed to duplicate collection');
    }
  },

  moveRequest: async (requestId: string, targetCollectionId: string, orderIndex?: number) => {
    set({ error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.moveRequest(requestId, workspaceId, { collectionId: targetCollectionId, orderIndex });
      
      // Reload collections to get the updated list
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success('Request moved successfully');
    } catch (error: any) {
      set({ error: error.message || 'Failed to move request' });
      toast.error('Failed to move request');
    }
  },

  reorderItems: async (collectionId: string, items: { id: string; orderIndex: number }[]) => {
    set({ error: null });
    try {
      const workspaceId = get().currentWorkspaceId;
      await collectionService.reorderItems(collectionId, workspaceId, items);
      
      // Reload collections to get the updated order
      await get().loadCollections(get().currentWorkspaceId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to reorder items' });
      toast.error('Failed to reorder items');
    }
  },

  selectCollection: (collection: Collection | null) => {
    set({ selectedCollection: collection });
  },

  selectRequest: (request: CollectionRequest | null) => {
    set({ selectedRequest: request });
  },

  generateShareLink: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const shareData = await collectionService.generateShareLink(id);
      
      // Reload collections to get the updated share status
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success('Share link generated successfully');
      set({ loading: false });
      return shareData;
    } catch (error: any) {
      set({ error: error.message || 'Failed to generate share link', loading: false });
      toast.error('Failed to generate share link');
      return null;
    }
  },

  revokeShareLink: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await collectionService.revokeShareLink(id);
      
      // Reload collections to get the updated share status
      await get().loadCollections(get().currentWorkspaceId);
      
      toast.success('Share link revoked successfully');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to revoke share link', loading: false });
      toast.error('Failed to revoke share link');
    }
  },
}));
