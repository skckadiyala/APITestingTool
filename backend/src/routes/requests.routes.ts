import { Router, Request, Response } from 'express';
import { RequestExecutor } from '../services/RequestExecutor';
import { HistoryService } from '../services/HistoryService';
import { RequestConfig } from '../types/request.types';

const router = Router();
const requestExecutor = new RequestExecutor();
const historyService = new HistoryService();

/**
 * POST /api/requests/execute
 * Execute an HTTP request
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const config: RequestConfig = req.body;
    const environmentId = req.body.environmentId || null;
    const collectionId = req.body.collectionId || null;

    // Validate required fields
    if (!config.url) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: url',
        },
      });
    }

    // For GraphQL requests, method is optional (defaults to POST)
    // For REST requests, method is required
    if (config.requestType !== 'GRAPHQL' && !config.method) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: method',
        },
      });
    }

    // Set default method for GraphQL
    if (config.requestType === 'GRAPHQL' && !config.method) {
      config.method = 'POST';
    }

    // Validate URL format (skip validation if URL contains variables)
    if (!config.url.includes('{{')) {
      try {
        new URL(config.url);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid URL format',
          },
        });
      }
    }

    // Execute the request with environment and collection variables
    const result = await requestExecutor.execute(config, environmentId, collectionId);

    // Save to history (don't pass userId for now until auth is implemented)
    const requestId = req.body.requestId;
    
    try {
      const historyData = await historyService.saveToHistory(result, undefined, requestId);
      
      // Include history ID in response
      return res.json({
        ...result,
        historyId: historyData.historyId,
      });
    } catch (historyError) {
      // Still return the execution result even if history save fails
      return res.json(result);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to execute request',
        code: error.code,
      },
      executedAt: new Date(),
    });
  }
});

/**
 * GET /api/requests/history
 * Get request history with filtering
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const requestId = req.query.requestId as string;
    const method = req.query.method as string;
    const statusCodeMin = req.query.statusCodeMin ? parseInt(req.query.statusCodeMin as string) : undefined;
    const statusCodeMax = req.query.statusCodeMax ? parseInt(req.query.statusCodeMax as string) : undefined;
    const urlPattern = req.query.urlPattern as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await historyService.getHistory(userId, {
      limit,
      offset,
      requestId,
      method,
      statusCodeMin,
      statusCodeMax,
      urlPattern,
      startDate,
      endDate,
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: 'Failed to retrieve history',
      },
    });
  }
});

/**
 * GET /api/requests/history/:id
 * Get specific history entry with details
 */
router.get('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;

    const history = await historyService.getHistoryDetail(id, userId);

    if (!history) {
      return res.status(404).json({
        error: {
          message: 'History entry not found',
        },
      });
    }

    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: 'Failed to retrieve history detail',
      },
    });
  }
});

/**
 * DELETE /api/requests/history/:id
 * Delete a history entry
 */
router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;

    await historyService.deleteHistory(id, userId);

    return res.json({
      success: true,
      message: 'History entry deleted',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: error.message || 'Failed to delete history entry',
      },
    });
  }
});

/**
 * DELETE /api/requests/history
 * Clear all history for a user
 */
router.delete('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;

    await historyService.clearHistory(userId);

    return res.json({
      success: true,
      message: 'History cleared',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: 'Failed to clear history',
      },
    });
  }
});

export default router;
