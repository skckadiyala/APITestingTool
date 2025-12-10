import api from './api';

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings?: any;
  collectionsCount?: number;
  environmentsCount?: number;
}

export interface WorkspaceDetails extends Workspace {
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Get all workspaces for the authenticated user
 */
export const getWorkspaces = async (): Promise<Workspace[]> => {
  try {
    const response = await api.get('/workspaces');
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch workspaces';
    throw new Error(message);
  }
};

/**
 * Get workspace by ID
 */
export const getWorkspace = async (id: string): Promise<WorkspaceDetails> => {
  try {
    const response = await api.get(`/workspaces/${id}`);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch workspace';
    throw new Error(message);
  }
};

/**
 * Create a new workspace
 */
export const createWorkspace = async (data: { name: string; description?: string }): Promise<Workspace> => {
  // Validate input
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Workspace name is required');
  }

  if (data.name.length > 100) {
    throw new Error('Workspace name must be 100 characters or less');
  }

  try {
    const response = await api.post('/workspaces', data);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create workspace';
    throw new Error(message);
  }
};

/**
 * Update workspace
 */
export const updateWorkspace = async (
  id: string,
  data: { name?: string; description?: string; settings?: any }
): Promise<Workspace> => {
  // Validate input
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Workspace name is required');
  }

  if (data.name.length > 100) {
    throw new Error('Workspace name must be 100 characters or less');
  }

  try {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to update workspace';
    throw new Error(message);
  }
};

/**
 * Delete workspace
 */
export const deleteWorkspace = async (id: string): Promise<void> => {
  try {
    await api.delete(`/workspaces/${id}`);
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to delete workspace';
    throw new Error(message);
  }
};

/**
 * Duplicate workspace
 */
export const duplicateWorkspace = async (id: string): Promise<Workspace> => {
  try {
    const response = await api.post(`/workspaces/${id}/duplicate`);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to duplicate workspace';
    throw new Error(message);
  }
};
