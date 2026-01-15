import { Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import WorkspaceMemberService from '../services/WorkspaceMemberService';
import { AuthRequest } from './auth.middleware';

// Extend Express Request type to include userRole
declare global {
  namespace Express {
    interface Request {
      userRole?: WorkspaceRole | null;
    }
  }
}

/**
 * Middleware factory to check workspace access
 * @param minRole - Minimum role required (optional)
 */
export const requireWorkspaceAccess = (minRole?: WorkspaceRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID is required' });
        return;
      }

      // Check user's permission level
      const userRole = await WorkspaceMemberService.checkUserPermission(workspaceId, userId);

      if (!userRole) {
        res.status(403).json({ error: 'You do not have access to this workspace' });
        return;
      }

      // If minimum role is specified, verify user has sufficient role
      if (minRole && !WorkspaceMemberService.hasPermission(userRole, minRole)) {
        res.status(403).json({ 
          error: `Insufficient permissions. ${minRole} role or higher required.` 
        });
        return;
      }

      // Attach userRole to request object for use in controllers
      req.userRole = userRole;

      next();
    } catch (error: any) {
      console.error('Workspace access middleware error:', error);
      res.status(500).json({ error: 'Failed to verify workspace access' });
      return;
    }
  };
};

/**
 * Shorthand middleware for requiring workspace owner
 */
export const requireWorkspaceOwner = () => {
  return requireWorkspaceAccess(WorkspaceRole.OWNER);
};

/**
 * Shorthand middleware for requiring workspace editor (or higher)
 */
export const requireWorkspaceEditor = () => {
  return requireWorkspaceAccess(WorkspaceRole.EDITOR);
};

/**
 * Shorthand middleware for requiring workspace viewer (or higher)
 * This allows all members to access
 */
export const requireWorkspaceViewer = () => {
  return requireWorkspaceAccess(WorkspaceRole.VIEWER);
};
