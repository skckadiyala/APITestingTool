import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectionRequest } from '../services/collectionService';

export interface Tab {
  id: string;
  name: string;
  type: 'request' | 'workspace-settings' | 'collection' | 'profile-settings' | 'environment-settings' | 'collection-runner';
  isDirty: boolean;
  isUntitled: boolean;
  // Request data
  method: string;
  url: string;
  params?: Array<{ key: string; value: string; enabled?: boolean }>;
  headers?: Array<{ key: string; value: string; enabled?: boolean }>;
  body?: { type: string; content: any };
  auth?: { type: string };
  testScript?: string;
  preRequestScript?: string;
  // Reference to saved request
  requestId?: string;
  collectionId?: string;
  // Collection tab specific
  collectionData?: any;
  // Collection runner specific
  runnerState?: {
    isRunning: boolean;
    hasResults: boolean;
    runResults: any;
    selectedIteration: number;
    selectedRequest: any;
    statusFilter: 'all' | 'passed' | 'failed';
  };
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
  openCollectionInTab: (collection: any) => void;
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
      name: tab.name || `New Request ${tabCounter}`,
      type: 'request',
      isDirty: false,
      isUntitled: true,
      method: tab.method || 'GET',
      url: tab.url || '',
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
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, ...updates, isDirty: updates.isDirty !== undefined ? updates.isDirty : true }
          : tab
      ),
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
                params: request.params || [],
                headers: request.headers || [],
                body: request.body || { type: 'json', content: '' },
                auth: request.auth || { type: 'noauth' },
                testScript: request.testScript || '',
                preRequestScript: request.preRequestScript || '',
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
        params: request.params || [],
        headers: request.headers || [],
        body: request.body || { type: 'json', content: '' },
        auth: request.auth || { type: 'noauth' },
        testScript: request.testScript || '',
        preRequestScript: request.preRequestScript || '',
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

  openCollectionInTab: (collection: any) => {
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
    const { tabs } = get();
    
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
      collectionData: { id: collectionId, name: collectionName },
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
