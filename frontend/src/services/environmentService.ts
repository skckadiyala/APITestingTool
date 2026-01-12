import axios from 'axios';
import { API_BASE_URL } from './api';

export interface EnvironmentVariable {
  key: string;
  value: string;
  type: 'default' | 'secret';
  enabled: boolean;
  description?: string;
  initialValue?: string;
}

export interface Environment {
  id: string;
  name: string;
  workspaceId: string;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

class EnvironmentService {
  /**
   * Create a new environment
   */
  async createEnvironment(
    workspaceId: string,
    name: string,
    variables: EnvironmentVariable[] = []
  ): Promise<Environment> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/environments`, {
      name,
      workspaceId,
      variables,
    });
    return response.data;
  }

  /**
   * Get all environments in a workspace
   */
  async listEnvironments(workspaceId: string): Promise<Environment[]> {
    const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/environments`);
    return response.data.environments;
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string, workspaceId: string): Promise<Environment> {
    const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/environments/${id}`);
    return response.data;
  }

  /**
   * Update an environment
   */
  async updateEnvironment(
    id: string,
    workspaceId: string,
    data: { name?: string; variables?: EnvironmentVariable[] }
  ): Promise<Environment> {
    const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}/environments/${id}`, data);
    return response.data;
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string, workspaceId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}/environments/${id}`);
  }

  /**
   * Duplicate an environment
   */
  async duplicateEnvironment(id: string, workspaceId: string): Promise<Environment> {
    const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/environments/${id}/duplicate`);
    return response.data;
  }
}

export default new EnvironmentService();
