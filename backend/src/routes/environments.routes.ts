import { Router, Request, Response } from 'express';
import EnvironmentService from '../services/EnvironmentService';

// mergeParams: true allows access to params from parent route (workspaceId)
const router = Router({ mergeParams: true });

/**
 * POST /api/v1/environments
 * POST /api/v1/workspaces/:workspaceId/environments
 * Create a new environment
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, variables } = req.body;
    // Support both workspace-scoped route and legacy route
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!name || !workspaceId) {
      res.status(400).json({
        error: 'Missing required fields: name, workspaceId',
      });
      return;
    }

    const environment = await EnvironmentService.createEnvironment({
      name,
      workspaceId,
      variables: variables || [],
    });

    res.status(201).json(environment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create environment' });
  }
});

/**
 * GET /api/v1/environments
 * GET /api/v1/workspaces/:workspaceId/environments
 * List all environments in a workspace
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Support both workspace-scoped route (/workspaces/:workspaceId/environments) and legacy route
    const workspaceId = req.params.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      res.status(400).json({ error: 'Missing required parameter: workspaceId' });
      return;
    }

    const environments = await EnvironmentService.listEnvironments(workspaceId as string);

    res.json({ environments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list environments' });
  }
});

/**
 * GET /api/v1/environments/:id
 * Get a single environment with all variables
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const environment = await EnvironmentService.getEnvironmentById(id);

    res.json(environment);
  } catch (error: any) {
    if (error.message === 'Environment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to get environment' });
    }
  }
});

/**
 * PUT /api/v1/environments/:id
 * Update an environment
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, variables } = req.body;

    const updated = await EnvironmentService.updateEnvironment(id, {
      name,
      variables,
    });

    res.json(updated);
  } catch (error: any) {
    if (error.message === 'Environment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update environment' });
    }
  }
});

/**
 * DELETE /api/v1/environments/:id
 * Delete an environment
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await EnvironmentService.deleteEnvironment(id);

    res.json(result);
  } catch (error: any) {
    if (error.message === 'Environment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete environment' });
    }
  }
});

/**
 * POST /api/v1/environments/:id/duplicate
 * Duplicate an environment
 */
router.post('/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const duplicate = await EnvironmentService.duplicateEnvironment(id);

    res.status(201).json(duplicate);
  } catch (error: any) {
    if (error.message === 'Environment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to duplicate environment' });
    }
  }
});

export default router;
