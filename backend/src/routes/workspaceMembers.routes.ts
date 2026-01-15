import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import WorkspaceMemberService from '../services/WorkspaceMemberService';
import { WorkspaceRole } from '@prisma/client';

const router = Router();

/**
 * Search for users by email or name
 * GET /api/users/search?q=searchTerm
 */
router.get('/users/search', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const searchTerm = req.query.q as string;

    if (!searchTerm || searchTerm.trim().length === 0) {
      res.status(400).json({ error: 'Search term is required' });
      return;
    }

    if (searchTerm.length < 2) {
      res.status(400).json({ error: 'Search term must be at least 2 characters' });
      return;
    }

    const users = await WorkspaceMemberService.searchUsers(searchTerm);

    res.json({ users });
  } catch (error: any) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message || 'Failed to search users' });
  }
});

/**
 * Get all workspaces where current user is member or owner
 * GET /api/workspaces/memberships
 */
router.get('/workspaces/memberships', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const memberships = await WorkspaceMemberService.getUserWorkspaceMemberships(userId);

    res.json({ memberships });
  } catch (error: any) {
    console.error('Error getting workspace memberships:', error);
    res.status(500).json({ error: error.message || 'Failed to get workspace memberships' });
  }
});

/**
 * Add a member to workspace
 * POST /api/workspaces/:workspaceId/members
 */
router.post('/workspaces/:workspaceId/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { userId, role } = req.body;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Validate input
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    // Validate role (only EDITOR or VIEWER can be assigned, not OWNER)
    if (role !== WorkspaceRole.EDITOR && role !== WorkspaceRole.VIEWER) {
      res.status(400).json({ error: 'Role must be EDITOR or VIEWER' });
      return;
    }

    const member = await WorkspaceMemberService.addMember(
      workspaceId,
      userId,
      role,
      requestingUserId
    );

    res.status(201).json({ member });
  } catch (error: any) {
    console.error('Error adding member:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    if (error.message.includes('already a member') || error.message.includes('Only workspace owners')) {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to add member' });
  }
});

/**
 * Get all members of a workspace
 * GET /api/workspaces/:workspaceId/members
 */
router.get('/workspaces/:workspaceId/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const members = await WorkspaceMemberService.getWorkspaceMembers(workspaceId, requestingUserId);

    res.json({ members });
  } catch (error: any) {
    console.error('Error getting workspace members:', error);
    
    if (error.message.includes('not found') || error.message.includes('do not have access')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to get workspace members' });
  }
});

/**
 * Update a member's role
 * PATCH /api/workspaces/:workspaceId/members/:memberId
 */
router.patch('/workspaces/:workspaceId/members/:memberId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Validate role
    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const updatedMember = await WorkspaceMemberService.updateMemberRole(
      workspaceId,
      memberId,
      role as WorkspaceRole,
      requestingUserId
    );

    res.json({ member: updatedMember });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    if (error.message.includes('Only workspace owners') || error.message.includes('Cannot change') || error.message.includes('last owner')) {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to update member role' });
  }
});

/**
 * Remove a member from workspace
 * DELETE /api/workspaces/:workspaceId/members/:memberId
 */
router.delete('/workspaces/:workspaceId/members/:memberId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, memberId } = req.params;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await WorkspaceMemberService.removeMember(
      workspaceId,
      memberId,
      requestingUserId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error removing member:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    if (error.message.includes('Only workspace owners') || error.message.includes('Cannot remove') || error.message.includes('last owner')) {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to remove member' });
  }
});

export default router;
