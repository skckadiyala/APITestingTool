import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
    const response = await axios.post(`${API_BASE_URL}/environments`, {
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
    const response = await axios.get(`${API_BASE_URL}/environments`, {
      params: { workspaceId },
    });
    return response.data.environments;
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string): Promise<Environment> {
    const response = await axios.get(`${API_BASE_URL}/environments/${id}`);
    return response.data;
  }

  /**
   * Update an environment
   */
  async updateEnvironment(
    id: string,
    data: { name?: string; variables?: EnvironmentVariable[] }
  ): Promise<Environment> {
    const response = await axios.put(`${API_BASE_URL}/environments/${id}`, data);
    return response.data;
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/environments/${id}`);
  }

  /**
   * Duplicate an environment
   */
  async duplicateEnvironment(id: string): Promise<Environment> {
    const response = await axios.post(`${API_BASE_URL}/environments/${id}/duplicate`);
    return response.data;
  }
}

export default new EnvironmentService();
