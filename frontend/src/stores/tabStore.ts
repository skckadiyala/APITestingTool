import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectionRequest } from '../services/collectionService';
import type { 
  RequestBody, 
  RequestParam, 
  RequestHeader, 
  AuthConfig,
  Collection,
  RunnerState
} from '../types';

export interface Tab {
  id: string;
  name: string;
  type: 'request' | 'workspace-settings' | 'collection' | 'profile-settings' | 'environment-settings' | 'collection-runner';
  isDirty: boolean;
  isUntitled: boolean;
  // Request data
  method: string;
  url: string;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  params?: RequestParam[];
  headers?: RequestHeader[];
  body?: RequestBody;
  auth?: AuthConfig;
  testScript?: string;
  preRequestScript?: string;
  // GraphQL-specific fields
  graphqlQuery?: string;
  graphqlVariables?: Record<string, any>;
  graphqlSchema?: any;
  schemaUrl?: string;
  // UI state
  activeSubTab?: string; // Store which subtab is active (params, headers, body, etc.)
  // Reference to saved request
  requestId?: string;
  collectionId?: string;
  // Collection tab specific
  collectionData?: Collection;
  // Collection runner specific
  runnerState?: RunnerState;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  createTab: (tab?: Partial<Tab>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  loadRequestInTab: (request: CollectionRequest) => void;
  openWorkspaceSettings: () => void;
  openCollectionInTab: (collection: Collection) => void;
  openProfileSettings: () => void;
  openEnvironmentSettings: () => void;
  openCollectionRunner: (collectionId: string, collectionName: string) => void;
  clearAllTabs: () => void;
}

let tabCounter = 1;

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
  tabs: [],
  activeTabId: null,

  createTab: (tab = {}) => {
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: tab.name || 'New Request',
      type: 'request',
      isDirty: false,
      isUntitled: true,
      method: tab.method || 'GET',
      url: tab.url || '',
      requestType: tab.requestType || 'REST',
      params: tab.params || [],
      headers: tab.headers || [],
      body: tab.body || { type: 'json', content: '' },
      auth: tab.auth || { type: 'noauth' },
      testScript: tab.testScript || '',
      preRequestScript: tab.preRequestScript || '',
      ...tab,
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    
    // If closing the active tab, activate the previous or next tab
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      const closedIndex = tabs.findIndex((t) => t.id === tabId);
      if (newTabs.length > 0) {
        // Try to activate the tab before the closed one, or the first tab
        const newIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        newActiveTabId = newTabs[newIndex]?.id || null;
      } else {
        newActiveTabId = null;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTab: (tabId: string, updates: Partial<Tab>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.id !== tabId) return tab;
        
        // Only update isDirty if explicitly provided in updates
        // Otherwise preserve the current isDirty state
        const newTab = { ...tab, ...updates };
        if (updates.isDirty === undefined) {
          newTab.isDirty = tab.isDirty;
        }
        
        return newTab;
      }),
    }));
  },

  loadRequestInTab: (request: CollectionRequest) => {
    const { tabs, activeTabId } = get();
    
    // Check if this request is already open in a tab
    const existingTab = tabs.find((t) => t.requestId === request.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // If there's an active untitled and clean tab, replace it
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.isUntitled && !activeTab.isDirty) {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                name: request.name,
                type: 'request' as const,
                method: request.method,
                url: request.url,
                requestType: request.requestType || 'REST',
                params: request.params || [],
                headers: request.headers || [],
                body: request.body || { type: 'json', content: '' },
                auth: request.auth || { type: 'noauth' },
                testScript: request.testScript || '',
                preRequestScript: request.preRequestScript || '',
                graphqlQuery: request.graphqlQuery || undefined,
                graphqlVariables: request.graphqlVariables || undefined,
                graphqlSchema: request.graphqlSchema || undefined,
                requestId: request.id,
                collectionId: request.collectionId,
                isUntitled: false,
                isDirty: false,
              }
            : tab
        ),
      }));
    } else {
      // Create a new tab for this request
      const newTab: Tab = {
        id: `tab-${Date.now()}-${tabCounter++}`,
        name: request.name,
        type: 'request',
        isDirty: false,
        isUntitled: false,
        method: request.method,
        url: request.url,
        requestType: request.requestType || 'REST',
        params: request.params || [],
        headers: request.headers || [],
        body: request.body || { type: 'json', content: '' },
        auth: request.auth || { type: 'noauth' },
        testScript: request.testScript || '',
        preRequestScript: request.preRequestScript || '',
        graphqlQuery: request.graphqlQuery || undefined,
        graphqlVariables: request.graphqlVariables || undefined,
        graphqlSchema: request.graphqlSchema || undefined,
        requestId: request.id,
        collectionId: request.collectionId,
      };

      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      }));
    }
  },

  openWorkspaceSettings: () => {
    const { tabs } = get();
    
    // Check if workspace settings tab is already open
    const existingTab = tabs.find((t) => t.type === 'workspace-settings');
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create a new workspace settings tab
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: 'Workspace',
      type: 'workspace-settings',
      isDirty: false,
      isUntitled: false,
      method: '',
      url: '',
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  openCollectionInTab: (collection: Collection) => {
    const { tabs } = get();
    
    // Check if collection tab is already open
    const existingTab = tabs.find((t) => t.type === 'collection' && t.collectionId === collection.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create a new collection tab
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: collection.name,
      type: 'collection',
      isDirty: false,
      isUntitled: false,
      method: '',
      url: '',
      collectionId: collection.id,
      collectionData: collection,
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  openProfileSettings: () => {
    const { tabs } = get();
    
    // Check if profile settings tab is already open
    const existingTab = tabs.find((t) => t.type === 'profile-settings');
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create a new profile settings tab
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: 'Profile',
      type: 'profile-settings',
      isDirty: false,
      isUntitled: false,
      method: '',
      url: '',
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  openEnvironmentSettings: () => {
    const { tabs } = get();
    
    // Check if environment settings tab is already open
    const existingTab = tabs.find((t) => t.type === 'environment-settings');
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create a new environment settings tab
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: 'Environments',
      type: 'environment-settings',
      isDirty: false,
      isUntitled: false,
      method: '',
      url: '',
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  openCollectionRunner: (collectionId: string, collectionName: string) => {
   // const { tabs } = get();
    
    // Always create a new collection runner tab (allows multiple runs)
    const newTab: Tab = {
      id: `tab-${Date.now()}-${tabCounter++}`,
      name: `Run: ${collectionName}`,
      type: 'collection-runner',
      isDirty: false,
      isUntitled: false,
      method: '',
      url: '',
      collectionId: collectionId,
      collectionData: { 
        id: collectionId, 
        name: collectionName,
        workspaceId: '',
        type: 'COLLECTION' as const,
        orderIndex: 0,
        isShared: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  clearAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },
}),
    {
      name: 'tab-storage',
      version: 1,
    }
  )
);
