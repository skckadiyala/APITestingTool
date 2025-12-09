import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EnvironmentVariable {
  key: string;
  value: string;
  type: 'default' | 'secret';
  enabled: boolean;
  description?: string;
  initialValue?: string;
}

interface CreateEnvironmentDto {
  name: string;
  workspaceId: string;
  variables?: EnvironmentVariable[];
}

interface UpdateEnvironmentDto {
  name?: string;
  variables?: EnvironmentVariable[];
}

class EnvironmentService {
  /**
   * Create a new environment
   */
  async createEnvironment(data: CreateEnvironmentDto) {
    const { name, workspaceId, variables = [] } = data;

    // Validate workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Create environment
    const environment = await prisma.environment.create({
      data: {
        name,
        workspaceId,
        variables: variables as any,
      },
    });

    return environment;
  }

  /**
   * Get all environments in a workspace
   */
  async listEnvironments(workspaceId: string) {
    const environments = await prisma.environment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return environments;
  }

  /**
   * Get a single environment by ID with all variables
   */
  async getEnvironmentById(id: string) {
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      throw new Error('Environment not found');
    }

    return environment;
  }

  /**
   * Update an environment
   */
  async updateEnvironment(id: string, data: UpdateEnvironmentDto) {
    // Verify environment exists
    const existing = await prisma.environment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Environment not found');
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.variables !== undefined) {
      updateData.variables = data.variables;
    }

    const updated = await prisma.environment.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string) {
    // Verify environment exists
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      throw new Error('Environment not found');
    }

    await prisma.environment.delete({
      where: { id },
    });

    return { success: true, message: 'Environment deleted successfully' };
  }

  /**
   * Duplicate an environment
   */
  async duplicateEnvironment(id: string) {
    // Get the original environment
    const original = await prisma.environment.findUnique({
      where: { id },
    });

    if (!original) {
      throw new Error('Environment not found');
    }

    // Create a copy with " (Copy)" appended to the name
    const duplicate = await prisma.environment.create({
      data: {
        name: `${original.name} (Copy)`,
        workspaceId: original.workspaceId,
        variables: original.variables as any,
      },
    });

    return duplicate;
  }

  /**
   * Get environment variables (helper method)
   */
  getVariables(environment: any): EnvironmentVariable[] {
    if (!environment.variables) {
      return [];
    }

    // Variables are stored as JSON, parse if needed
    if (typeof environment.variables === 'string') {
      return JSON.parse(environment.variables);
    }

    return environment.variables as EnvironmentVariable[];
  }

  /**
   * Resolve variable value (used in request execution)
   */
  resolveVariable(
    environmentId: string | null,
    variableKey: string,
    environments: any[]
  ): string | undefined {
    if (!environmentId) {
      return undefined;
    }

    const environment = environments.find((env) => env.id === environmentId);
    if (!environment) {
      return undefined;
    }

    const variables = this.getVariables(environment);
    const variable = variables.find(
      (v) => v.key === variableKey && v.enabled !== false
    );

    return variable?.value;
  }

  /**
   * Replace variables in a string
   * Format: {{variableName}}
   */
  replaceVariables(
    text: string,
    environmentId: string | null,
    environments: any[]
  ): string {
    if (!text) {
      return text;
    }

    // Find all {{variableName}} patterns
    const variablePattern = /\{\{([^}]+)\}\}/g;
    
    return text.replace(variablePattern, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      // Check for built-in dynamic variables
      if (trimmedName === '$timestamp') {
        return Date.now().toString();
      }
      if (trimmedName === '$isoTimestamp') {
        return new Date().toISOString();
      }
      if (trimmedName === '$randomInt') {
        return Math.floor(Math.random() * 1000).toString();
      }
      if (trimmedName === '$randomUUID') {
        return crypto.randomUUID();
      }
      if (trimmedName === '$randomEmail') {
        const randomStr = Math.random().toString(36).substring(7);
        return `user${randomStr}@example.com`;
      }

      // Resolve from environment
      const value = this.resolveVariable(environmentId, trimmedName, environments);
      return value !== undefined ? value : match;
    });
  }
}

export default new EnvironmentService();
