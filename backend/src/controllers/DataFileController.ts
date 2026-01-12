import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { dataFileService } from '../services/DataFileService';

export class DataFileController {
  /**
   * Upload data file
   * POST /api/data-files/upload
   */
  async uploadDataFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { originalName, fileContent, size, workspaceId } = req.body;
      const userId = req.user!.userId;

      if (!originalName || !fileContent || !size || !workspaceId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: originalName, fileContent, size, workspaceId'
        });
        return;
      }

      const dataFile = await dataFileService.uploadDataFile({
        originalName,
        fileContent,
        size,
        workspaceId,
        userId
      });

      res.status(201).json({
        success: true,
        data: dataFile
      });
    } catch (error: any) {
      console.error('Upload data file error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload data file'
      });
    }
  }

  /**
   * Get data file by ID
   * GET /api/data-files/:id
   */
  async getDataFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const dataFile = await dataFileService.getDataFile(id, userId);

      res.status(200).json({
        success: true,
        data: dataFile
      });
    } catch (error: any) {
      console.error('Get data file error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Data file not found'
      });
    }
  }

  /**
   * Get all data files for workspace
   * GET /api/data-files/workspace/:workspaceId
   */
  async getDataFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;

      const dataFiles = await dataFileService.getDataFiles(workspaceId, userId);

      res.status(200).json({
        success: true,
        data: dataFiles
      });
    } catch (error: any) {
      console.error('Get data files error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get data files'
      });
    }
  }

  /**
   * Get full parsed data
   * GET /api/data-files/:id/data
   */
  async getParsedData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const data = await dataFileService.getParsedData(id, userId);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      console.error('Get parsed data error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Data file not found'
      });
    }
  }

  /**
   * Delete data file
   * DELETE /api/data-files/:id
   */
  async deleteDataFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await dataFileService.deleteDataFile(id, userId);

      res.status(200).json({
        success: true,
        message: 'Data file deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete data file error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to delete data file'
      });
    }
  }
}

export const dataFileController = new DataFileController();
