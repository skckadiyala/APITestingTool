import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useEnvironmentStore } from '../stores/environmentStore';
import { useHistoryStore } from '../stores/historyStore';
import { useTabStore } from '../stores/tabStore';
import toast from 'react-hot-toast';

interface WorkspaceSwitchOptions {
  showNotification?: boolean;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export function useWorkspaceSwitch() {
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  
  const { setCurrentWorkspace, fetchWorkspaces, workspaces } = useWorkspaceStore();
  const { loadCollections } = useCollectionStore();
  const { loadEnvironments } = useEnvironmentStore();
  
  /**
   * Clear all store data when switching workspaces
   */
  const clearStoreData = useCallback(() => {
    // Clear collections
    useCollectionStore.setState({
      collections: [],
      selectedCollection: null,
      selectedRequest: null,
      error: null,
    });
    
    // Clear environments
    useEnvironmentStore.setState({
      environments: [],
      error: null,
    });
    
    // Clear history
    useHistoryStore.setState({
      history: [],
      total: 0,
      hasMore: false,
      error: null,
      selectedHistoryId: null,
    });
    
    // Clear all open tabs
    useTabStore.getState().clearAllTabs();
  }, []);

  /**
   * Fetch workspace data with retry logic
   * Returns true if successful, false otherwise
   */
  const fetchWorkspaceData = async (
    workspaceId: string,
    retryCount = 0
  ): Promise<boolean> => {
    try {
      // Load collections and environments in parallel
      await Promise.all([
        loadCollections(workspaceId),
        loadEnvironments(workspaceId),
      ]);
      return true;
    } catch (error: any) {
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff retry
        const delay = RETRY_DELAYS[retryCount];
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWorkspaceData(workspaceId, retryCount + 1);
      }
      return false;
    }
  };

  /**
   * Switch to a different workspace with loading state and error handling
   */
  const switchWorkspace = useCallback(
    async (
      workspaceId: string,
      options: WorkspaceSwitchOptions = {}
    ): Promise<boolean> => {
      const {
        showNotification = true,
        timeout = DEFAULT_TIMEOUT,
      } = options;

      // Don't switch if already on this workspace
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
      if (currentWorkspace?.id === workspaceId) {
        return true;
      }

      // Check if workspace exists
      const targetWorkspace = workspaces.find((w) => w.id === workspaceId);
      if (!targetWorkspace) {
        const errorMsg = 'Workspace not found';
        setSwitchError(errorMsg);
        toast.error(errorMsg);
        
        // Refresh workspace list in case it was deleted
        await fetchWorkspaces();
        return false;
      }

      setIsSwitching(true);
      setSwitchError(null);

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Workspace switch timed out'));
        }, timeout);
      });

      try {
        // Race between switching and timeout
        const success = await Promise.race([
          (async () => {
            // Step 1: Optimistically update UI
            setCurrentWorkspace(workspaceId);

            // Step 2: Clear current data
            clearStoreData();

            // Step 3: Persist workspace preference to localStorage
            localStorage.setItem('lastWorkspaceId', workspaceId);

            // Step 4: Fetch new workspace data with retry logic
            const dataFetched = await fetchWorkspaceData(workspaceId);
            return dataFetched;
          })(),
          timeoutPromise,
        ]);

        // Check if data fetch was successful
        if (!success) {
          throw new Error('Failed to load workspace data');
        }

        // Success!
        if (showNotification) {
          toast.success(`Switched to ${targetWorkspace.name}`);
        }

        setIsSwitching(false);
        return true;
      } catch (error: any) {
        console.error('Workspace switch error:', error);
        
        const errorMsg = error.message || 'Failed to switch workspace';
        setSwitchError(errorMsg);

        // Check if workspace no longer exists or access denied
        if (error.response?.status === 404) {
          toast.error('Workspace no longer exists');
          
          // Remove from list and switch to another workspace
          const updatedWorkspaces = workspaces.filter((w) => w.id !== workspaceId);
          if (updatedWorkspaces.length > 0) {
            // Roll back to previous or first available workspace
            const fallbackWorkspace = currentWorkspace || updatedWorkspaces[0];
            setCurrentWorkspace(fallbackWorkspace.id);
            await fetchWorkspaceData(fallbackWorkspace.id);
          }
          
          // Refresh workspace list
          await fetchWorkspaces();
        } else if (error.response?.status === 403) {
          toast.error('Access denied to workspace');
          
          // Stay on current workspace
          if (currentWorkspace) {
            setCurrentWorkspace(currentWorkspace.id);
            await fetchWorkspaceData(currentWorkspace.id);
          }
        } else {
          // Generic error - allow manual retry
          toast.error(errorMsg, {
            duration: 5000,
            icon: '⚠️',
          });
        }

        setIsSwitching(false);
        return false;
      }
    },
    [workspaces, setCurrentWorkspace, clearStoreData, fetchWorkspaces, loadCollections, loadEnvironments]
  );

  /**
   * Retry the last failed workspace switch
   */
  const retrySwitchWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      setSwitchError(null);
      return switchWorkspace(workspaceId, { showNotification: true });
    },
    [switchWorkspace]
  );

  return {
    switchWorkspace,
    retrySwitchWorkspace,
    isSwitching,
    switchError,
  };
}
