import { Router, Response } from 'express';
import { WorkspaceService } from '../services/WorkspaceService';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireWorkspaceViewer, requireWorkspaceOwner } from '../middleware/workspace.middleware';
import collectionsRoutes from './collections.routes';
import environmentsRoutes from './environments.routes';

const router = Router();

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required',
      });
    }

    const workspace = await WorkspaceService.createWorkspace(req.user!.userId, name, description);

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: workspace,
    });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create workspace',
    });
  }
});

/**
 * GET /api/workspaces
 * Get all workspaces for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workspaces = await WorkspaceService.getUserWorkspaces(req.user!.userId);

    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error: any) {
    console.error('Get workspaces error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch workspaces',
    });
  }
});

/**
 * GET /api/workspaces/:id
 * Get workspace by ID
 */
router.get('/:id', authenticate, requireWorkspaceViewer(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await WorkspaceService.getWorkspaceById(id, req.user!.userId);

    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error: any) {
    console.error('Get workspace error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch workspace',
    });
  }
});

/**
 * PUT /api/workspaces/:id
 * Update workspace
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, settings } = req.body;

    // At least one field must be provided
    if (name === undefined && description === undefined && settings === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name, description, or settings) must be provided',
      });
    }

    const workspace = await WorkspaceService.updateWorkspace(id, req.user!.userId, { 
      name, 
      description, 
      settings 
    });

    return res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: workspace,
    });
  } catch (error: any) {
    console.error('Update workspace error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update workspace',
    });
  }
});

/**
 * DELETE /api/workspaces/:id
 * Delete workspace
 */
router.delete('/:id', authenticate, requireWorkspaceOwner(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await WorkspaceService.deleteWorkspace(id, req.user!.userId);

    return res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete workspace error:', error);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('only workspace')
      ? 400
      : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete workspace',
    });
  }
});

/**
 * POST /api/workspaces/:id/duplicate
 * Duplicate workspace
 */
router.post('/:id/duplicate', authenticate, requireWorkspaceViewer(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await WorkspaceService.duplicateWorkspace(id, req.user!.userId);

    return res.status(201).json({
      success: true,
      message: 'Workspace duplicated successfully',
      data: workspace,
    });
  } catch (error: any) {
    console.error('Duplicate workspace error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to duplicate workspace',
    });
  }
});

// Nested routes for workspace-scoped resources
// These handle routes like /api/v1/workspaces/:workspaceId/collections
// Note: Authentication is handled within the individual route handlers
router.use('/:workspaceId/collections', collectionsRoutes);
router.use('/:workspaceId/environments', environmentsRoutes);

export default router;
