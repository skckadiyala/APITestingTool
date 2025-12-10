import { create } from 'zustand';
import environmentService, { type Environment, type EnvironmentVariable } from '../services/environmentService';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from './workspaceStore';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  currentWorkspaceId: string;
  loading: boolean;
  error: string | null;

  // Actions
  loadEnvironments: (workspaceId: string) => Promise<void>;
  createEnvironment: (workspaceId: string, name: string, variables?: EnvironmentVariable[]) => Promise<Environment | null>;
  updateEnvironment: (id: string, data: { name?: string; variables?: EnvironmentVariable[] }) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  duplicateEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => void;
  getActiveEnvironment: () => Environment | null;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,
  currentWorkspaceId: '',
  loading: false,
  error: null,

  loadEnvironments: async (workspaceId: string) => {
    // Prevent concurrent loads
    const state = get();
    if (state.loading) {
      return;
    }
    
    set({ loading: true, error: null, currentWorkspaceId: workspaceId });
    try {
      const environments = await environmentService.listEnvironments(workspaceId);
      set({ environments, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error('Failed to load environments');
    }
  },

  createEnvironment: async (workspaceId: string, name: string, variables = []) => {
    try {
      const newEnvironment = await environmentService.createEnvironment(workspaceId, name, variables);
      set((state) => ({
        environments: [...state.environments, newEnvironment],
      }));
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success('Environment created successfully');
      return newEnvironment;
    } catch (error: any) {
      toast.error('Failed to create environment');
      return null;
    }
  },

  updateEnvironment: async (id: string, data) => {
    try {
      const workspaceId = get().currentWorkspaceId;
      const updated = await environmentService.updateEnvironment(id, workspaceId, data);
      set((state) => ({
        environments: state.environments.map((env) =>
          env.id === id ? updated : env
        ),
      }));
      toast.success('Environment updated successfully');
    } catch (error: any) {
      toast.error('Failed to update environment');
    }
  },

  deleteEnvironment: async (id: string) => {
    try {
      const workspaceId = get().currentWorkspaceId;
      await environmentService.deleteEnvironment(id, workspaceId);
      set((state) => ({
        environments: state.environments.filter((env) => env.id !== id),
        activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
      }));
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success('Environment deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete environment');
    }
  },

  duplicateEnvironment: async (id: string) => {
    try {
      const workspaceId = get().currentWorkspaceId;
      const duplicate = await environmentService.duplicateEnvironment(id, workspaceId);
      set((state) => ({
        environments: [...state.environments, duplicate],
      }));
      
      // Refresh workspace counts
      useWorkspaceStore.getState().fetchWorkspaces();
      
      toast.success('Environment duplicated successfully');
    } catch (error: any) {
      toast.error('Failed to duplicate environment');
    }
  },

  setActiveEnvironment: (id: string | null) => {
    set({ activeEnvironmentId: id });
    if (id) {
      localStorage.setItem('activeEnvironmentId', id);
    } else {
      localStorage.removeItem('activeEnvironmentId');
    }
  },

  getActiveEnvironment: () => {
    const { environments, activeEnvironmentId } = get();
    return environments.find((env) => env.id === activeEnvironmentId) || null;
  },
}));
