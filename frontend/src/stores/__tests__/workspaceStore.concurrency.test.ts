import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../workspaceStore';
import * as workspaceService from '../../services/workspaceService';
import type { Workspace } from '../../services/workspaceService';

// Mock the workspace service
vi.mock('../../services/workspaceService');
vi.mock('react-hot-toast');

describe('workspaceStore - Phase 1: Global State Flag Fix', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      workspaceMembers: [],
      isLoading: false,
      isFetchingWorkspaces: false,
      error: null,
    });
    
    // Clear mock calls
    vi.clearAllMocks();
  });

  describe('Concurrent fetch prevention', () => {
    it('should prevent concurrent fetch attempts using store state', async () => {
      const mockWorkspaces: Workspace[] = [
        { 
          id: '1', 
          name: 'Workspace 1',
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userRole: 'OWNER',
        },
        { 
          id: '2', 
          name: 'Workspace 2',
          ownerId: 'user2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userRole: 'VIEWER',
        },
      ];

      // Mock a slow API call
      vi.mocked(workspaceService.getWorkspaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockWorkspaces), 100))
      );

      const store = useWorkspaceStore.getState();

      // Start first fetch
      const fetch1 = store.fetchWorkspaces();
      
      // Verify isFetchingWorkspaces flag is set
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(true);
      
      // Attempt second fetch while first is in progress
      const fetch2 = store.fetchWorkspaces();
      
      // Wait for both to complete
      await Promise.all([fetch1, fetch2]);

      // Verify API was only called once (second call was prevented)
      expect(workspaceService.getWorkspaces).toHaveBeenCalledTimes(1);
      
      // Verify flag is reset after completion
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
    });

    it('should reset isFetchingWorkspaces flag on error', async () => {
      // Mock API error
      const mockError = new Error('Network error');
      vi.mocked(workspaceService.getWorkspaces).mockRejectedValueOnce(mockError);

      const store = useWorkspaceStore.getState();

      try {
        await store.fetchWorkspaces();
      } catch (error) {
        // Expected to handle error
      }

      // Verify flags are reset even after error
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
      expect(useWorkspaceStore.getState().error).toBe('Network error');
    });

    it('should allow subsequent fetch after previous one completes', async () => {
      const mockWorkspaces1: Workspace[] = [{ 
        id: '1', 
        name: 'Workspace 1',
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userRole: 'OWNER',
      }];
      const mockWorkspaces2: Workspace[] = [
        { 
          id: '1', 
          name: 'Workspace 1',
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userRole: 'OWNER',
        },
        { 
          id: '2', 
          name: 'Workspace 2',
          ownerId: 'user2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userRole: 'VIEWER',
        },
      ];

      vi.mocked(workspaceService.getWorkspaces)
        .mockResolvedValueOnce(mockWorkspaces1)
        .mockResolvedValueOnce(mockWorkspaces2);

      const store = useWorkspaceStore.getState();

      // First fetch
      await store.fetchWorkspaces();
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);

      // Second fetch (should be allowed)
      await store.fetchWorkspaces();
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(2);
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);

      // Verify both API calls were made
      expect(workspaceService.getWorkspaces).toHaveBeenCalledTimes(2);
    });
  });

  describe('State cleanup', () => {
    it('should reset isFetchingWorkspaces flag in clearWorkspaces', () => {
      // Set some state
      useWorkspaceStore.setState({
        workspaces: [{ 
          id: '1', 
          name: 'Test', 
          userRole: 'OWNER' as const,
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        currentWorkspace: { 
          id: '1', 
          name: 'Test', 
          userRole: 'OWNER' as const,
          ownerId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isLoading: true,
        isFetchingWorkspaces: true,
        error: 'Some error',
      });

      // Clear workspaces
      const store = useWorkspaceStore.getState();
      store.clearWorkspaces();

      // Verify all flags are reset
      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toEqual([]);
      expect(state.currentWorkspace).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isFetchingWorkspaces).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Store state isolation (test independence)', () => {
    it('should allow independent test runs without state pollution', () => {
      // This test verifies that we can reset state between tests
      // Previously, the global flag made this impossible
      
      // Set state in "first test"
      useWorkspaceStore.setState({
        isFetchingWorkspaces: true,
        isLoading: true,
      });

      // Reset state (simulating beforeEach)
      useWorkspaceStore.setState({
        isFetchingWorkspaces: false,
        isLoading: false,
      });

      // Verify state is clean
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
    });
  });

  describe('Race condition scenarios', () => {
    it('should handle rapid sequential calls correctly', async () => {
      const mockWorkspaces: Workspace[] = [{ 
        id: '1', 
        name: 'Test',
        ownerId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userRole: 'OWNER',
      }];
      
      let callCount = 0;
      vi.mocked(workspaceService.getWorkspaces).mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockWorkspaces;
      });

      const store = useWorkspaceStore.getState();

      // Fire 5 rapid calls
      const calls = [
        store.fetchWorkspaces(),
        store.fetchWorkspaces(),
        store.fetchWorkspaces(),
        store.fetchWorkspaces(),
        store.fetchWorkspaces(),
      ];

      await Promise.all(calls);

      // Only first call should have executed
      expect(callCount).toBe(1);
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);
    });

    it('should maintain consistency when error occurs during concurrent attempts', async () => {
      // First call will error
      vi.mocked(workspaceService.getWorkspaces).mockRejectedValueOnce(
        new Error('First call error')
      );

      const store = useWorkspaceStore.getState();

      // Start first fetch (will error)
      const fetch1 = store.fetchWorkspaces().catch(() => {});
      
      // Try second fetch immediately
      const fetch2 = store.fetchWorkspaces();

      await Promise.all([fetch1, fetch2]);

      // Should be in clean state
      expect(useWorkspaceStore.getState().isFetchingWorkspaces).toBe(false);
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
    });
  });
});
