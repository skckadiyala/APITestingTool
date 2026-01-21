import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import * as workspaceService from '../services/workspaceService';
import workspaceMemberService from '../services/workspaceMemberService';
import type { Workspace } from '../services/workspaceService';
import type { WorkspaceMember, UserSearchResult, WorkspaceRole } from '../types/workspace.types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  isFetchingWorkspaces: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, name: string, description?: string, settings?: any) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  duplicateWorkspace: (id: string) => Promise<void>;
  clearWorkspaces: () => void;
  
  // Member management actions - return boolean for success/failure
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  addMember: (workspaceId: string, userId: string, role: WorkspaceRole) => Promise<boolean>;
  updateMemberRole: (workspaceId: string, memberId: string, role: WorkspaceRole) => Promise<boolean>;
  removeMember: (workspaceId: string, memberId: string) => Promise<boolean>;
  searchUsers: (searchTerm: string) => Promise<UserSearchResult[]>;
  
  // Global variables management
  getGlobalVariables: () => any[];
  updateGlobalVariables: (variables: any[]) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      workspaceMembers: [],
      isLoading: false,
      isFetchingWorkspaces: false,
      error: null,

      /**
       * Fetch all workspaces for the authenticated user
       * Includes both owned and member workspaces with userRole
       */
      fetchWorkspaces: async () => {
        const state = get();
        
        // Prevent concurrent fetches using store state
        if (state.isFetchingWorkspaces) {
          console.log('Workspace fetch already in progress, skipping...');
          return;
        }
        
        set({ isFetchingWorkspaces: true, isLoading: true, error: null });
        try {
          // Fetch both owned and member workspaces (backend already returns merged list)
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
            } else {
              // Update current workspace with fresh data including userRole
              currentWorkspace = exists;
            }
          }

          // Persist current workspace ID to localStorage
          if (currentWorkspace) {
            localStorage.setItem('lastWorkspaceId', currentWorkspace.id);
          }

          set({ workspaces, currentWorkspace, isLoading: false, isFetchingWorkspaces: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false, isFetchingWorkspaces: false });
          
          // If error is 401 (unauthorized), clear auth and redirect to login
          if (error.response?.status === 401) {
            console.error('Authentication failed when fetching workspaces');
            // The API interceptor should handle this, but just in case
            const { useAuthStore } = await import('./authStore');
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
          } else {
            toast.error(error.message || 'Failed to fetch workspaces');
          }
        }
      },

      /**
       * Set current workspace and update with userRole from workspace data
       */
      setCurrentWorkspace: (workspaceId: string) => {
        const state = get();
        const workspace = state.workspaces.find((w) => w.id === workspaceId);

        if (workspace) {
          set({ currentWorkspace: workspace });
          localStorage.setItem('lastWorkspaceId', workspaceId);
          
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
      updateWorkspace: async (id: string, name: string, description?: string, settings?: any) => {
        set({ isLoading: true, error: null });
        try {
          const updatedWorkspace = await workspaceService.updateWorkspace(id, {
            name,
            description,
            settings,
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
          workspaceMembers: [],
          isLoading: false,
          isFetchingWorkspaces: false,
          error: null,
        });
      },

      /**
       * Fetch workspace members
       */
      fetchWorkspaceMembers: async (workspaceId: string) => {
        try {
          const members = await workspaceMemberService.getWorkspaceMembers(workspaceId);
          set({ workspaceMembers: members });
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to fetch workspace members');
        }
      },

      /**
       * Add a member to workspace
       * Returns true if successful, false otherwise
       */
      addMember: async (workspaceId: string, userId: string, role: WorkspaceRole): Promise<boolean> => {
        try {
          const newMember = await workspaceMemberService.addMember(workspaceId, userId, role);
          
          const state = get();
          set({ workspaceMembers: [...state.workspaceMembers, newMember] });
          
          // Update member count in workspace list
          const workspaces = state.workspaces.map((w) =>
            w.id === workspaceId 
              ? { ...w, membersCount: (w.membersCount || 1) + 1 }
              : w
          );
          
          const currentWorkspace = state.currentWorkspace?.id === workspaceId
            ? { ...state.currentWorkspace, membersCount: (state.currentWorkspace.membersCount || 1) + 1 }
            : state.currentWorkspace;
          
          set({ workspaces, currentWorkspace });
          toast.success('Member added successfully');
          return true;
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to add member');
          return false;
        }
      },

      /**
       * Update member role
       * Returns true if successful, false otherwise
       */
      updateMemberRole: async (workspaceId: string, memberId: string, role: WorkspaceRole): Promise<boolean> => {
        try {
          const updatedMember = await workspaceMemberService.updateMemberRole(workspaceId, memberId, role);
          
          const state = get();
          const workspaceMembers = state.workspaceMembers.map((m) =>
            m.id === memberId ? updatedMember : m
          );
          
          set({ workspaceMembers });
          toast.success('Member role updated');
          return true;
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to update member role');
          return false;
        }
      },

      /**
       * Remove member from workspace
       * Returns true if successful, false otherwise
       */
      removeMember: async (workspaceId: string, memberId: string): Promise<boolean> => {
        try {
          await workspaceMemberService.removeMember(workspaceId, memberId);
          
          const state = get();
          const workspaceMembers = state.workspaceMembers.filter((m) => m.id !== memberId);
          set({ workspaceMembers });
          
          // Update member count in workspace list
          const workspaces = state.workspaces.map((w) =>
            w.id === workspaceId 
              ? { ...w, membersCount: Math.max((w.membersCount || 1) - 1, 1) }
              : w
          );
          
          const currentWorkspace = state.currentWorkspace?.id === workspaceId
            ? { ...state.currentWorkspace, membersCount: Math.max((state.currentWorkspace.membersCount || 1) - 1, 1) }
            : state.currentWorkspace;
          
          set({ workspaces, currentWorkspace });
          toast.success('Member removed successfully');
          return true;
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to remove member');
          return false;
        }
      },

      /**
       * Search users for adding to workspace
       */
      searchUsers: async (searchTerm: string): Promise<UserSearchResult[]> => {
        try {
          return await workspaceMemberService.searchUsers(searchTerm);
        } catch (error: any) {
          toast.error('Failed to search users');
          return [];
        }
      },

      /**
       * Get global variables from current workspace
       */
      getGlobalVariables: () => {
        const state = get();
        if (!state.currentWorkspace || !state.currentWorkspace.settings) {
          return [];
        }
        const settings = state.currentWorkspace.settings as any;
        return settings.globalVariables || [];
      },

      /**
       * Update global variables in current workspace
       */
      updateGlobalVariables: async (variables: any[]) => {
        const state = get();
        if (!state.currentWorkspace) {
          toast.error('No workspace selected');
          return;
        }

        try {
          const currentSettings = (state.currentWorkspace.settings as any) || {};
          const newSettings = {
            ...currentSettings,
            globalVariables: variables,
          };

          await workspaceService.updateWorkspace(state.currentWorkspace.id, {
            name: state.currentWorkspace.name,
            description: state.currentWorkspace.description || undefined,
            settings: newSettings,
          });

          // Update local state
          const updatedWorkspace = {
            ...state.currentWorkspace,
            settings: newSettings,
          };

          const workspaces = state.workspaces.map((w) =>
            w.id === state.currentWorkspace!.id ? updatedWorkspace : w
          );

          set({ workspaces, currentWorkspace: updatedWorkspace });
          toast.success('Global variables updated successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to update global variables');
        }
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
