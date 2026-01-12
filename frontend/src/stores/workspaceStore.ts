import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import * as workspaceService from '../services/workspaceService';
import type { Workspace } from '../services/workspaceService';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  duplicateWorkspace: (id: string) => Promise<void>;
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
      error: null,

      /**
       * Fetch all workspaces for the authenticated user
       */
      fetchWorkspaces: async () => {
        // Prevent concurrent fetches
        const state = get();
        if (state.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          const workspaces = await workspaceService.getWorkspaces();
          
          const currentState = get();
          let currentWorkspace = currentState.currentWorkspace;

          // Try to restore last workspace from localStorage
          const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
          if (lastWorkspaceId && workspaces.length > 0) {
            const lastWorkspace = workspaces.find((w) => w.id === lastWorkspaceId);
            if (lastWorkspace) {
              currentWorkspace = lastWorkspace;
            }
          }

          // If no current workspace is set, set to first workspace
          if (!currentWorkspace && workspaces.length > 0) {
            currentWorkspace = workspaces[0];
          }

          // Verify current workspace still exists in fetched workspaces
          if (currentWorkspace) {
            const exists = workspaces.find((w) => w.id === currentWorkspace!.id);
            if (!exists && workspaces.length > 0) {
              currentWorkspace = workspaces[0];
            } else if (!exists) {
              currentWorkspace = null;
            }
          }

          // Persist current workspace ID to localStorage
          if (currentWorkspace) {
            localStorage.setItem('lastWorkspaceId', currentWorkspace.id);
          }

          set({ workspaces, currentWorkspace, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          toast.error(error.message || 'Failed to fetch workspaces');
        }
      },

      /**
       * Set current workspace
       */
      setCurrentWorkspace: (workspaceId: string) => {
        const state = get();
        const workspace = state.workspaces.find((w) => w.id === workspaceId);

        if (workspace) {
          set({ currentWorkspace: workspace });
          
          // Persist to localStorage is handled by persist middleware
          
          // Note: Collection/environment loading for new workspace is handled in Layout component
        } else {
          toast.error('Workspace not found');
        }
      },

      /**
       * Create a new workspace
       */
      createWorkspace: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const newWorkspace = await workspaceService.createWorkspace({ name });
          
          const state = get();
          const workspaces = [...state.workspaces, newWorkspace];
          
          set({
            workspaces,
            currentWorkspace: newWorkspace,
            isLoading: false,
          });

          toast.success('Workspace created successfully');
          return newWorkspace;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          toast.error(error.message || 'Failed to create workspace');
          return null;
        }
      },

      /**
       * Update workspace
       */
      updateWorkspace: async (id: string, updates: Partial<Workspace>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedWorkspace = await workspaceService.updateWorkspace(id, {
            name: updates.name || '',
          });

          const state = get();
          const workspaces = state.workspaces.map((w) =>
            w.id === id ? { ...w, ...updatedWorkspace } : w
          );

          const currentWorkspace =
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...updatedWorkspace }
              : state.currentWorkspace;

          set({ workspaces, currentWorkspace, isLoading: false });
          toast.success('Workspace updated successfully');
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          toast.error(error.message || 'Failed to update workspace');
        }
      },

      /**
       * Delete workspace
       */
      deleteWorkspace: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await workspaceService.deleteWorkspace(id);

          const state = get();
          const workspaces = state.workspaces.filter((w) => w.id !== id);

          let currentWorkspace = state.currentWorkspace;
          
          // If deleted workspace was current, switch to another
          if (currentWorkspace?.id === id) {
            currentWorkspace = workspaces.length > 0 ? workspaces[0] : null;
          }

          set({ workspaces, currentWorkspace, isLoading: false });
          toast.success('Workspace deleted successfully');
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          toast.error(error.message || 'Failed to delete workspace');
        }
      },

      /**
       * Duplicate workspace
       */
      duplicateWorkspace: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const duplicatedWorkspace = await workspaceService.duplicateWorkspace(id);

          const state = get();
          const workspaces = [...state.workspaces, duplicatedWorkspace];

          set({ workspaces, isLoading: false });
          toast.success('Workspace duplicated successfully');
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          toast.error(error.message || 'Failed to duplicate workspace');
        }
      },

      /**
       * Clear workspace state (used on logout)
       */
      clearWorkspaces: () => {
        set({
          workspaces: [],
          currentWorkspace: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);

// Export the Workspace type for use in other files
export type { Workspace };
