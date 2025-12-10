import { Router, Request, Response } from 'express';
import CollectionService, { UpdateCollectionDto } from '../services/CollectionService';
import { CollectionType } from '@prisma/client';
import { ExportService } from '../services/ExportService';
import { ImportService } from '../services/ImportService';
import { CollectionRunner } from '../services/CollectionRunner';
import multer from 'multer';

// mergeParams: true allows access to params from parent route (workspaceId)
const router = Router({ mergeParams: true });

/**
 * POST /api/v1/collections
 * POST /api/v1/workspaces/:workspaceId/collections
 * Create a new collection
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, parentFolderId, type } = req.body;
    // Support both workspace-scoped route and legacy route
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!name || !workspaceId || !type) {
      res.status(400).json({
        error: 'Missing required fields: name, workspaceId, type',
      });
      return;
    }

    if (!Object.values(CollectionType).includes(type)) {
      res.status(400).json({
        error: 'Invalid collection type. Must be COLLECTION or FOLDER',
      });
      return;
    }

    const collection = await CollectionService.createCollection({
      name,
      description,
      workspaceId,
      parentFolderId,
      type,
    });

    res.status(201).json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create collection' });
  }
});

/**
 * GET /api/v1/collections?workspaceId=xxx
 * GET /api/v1/workspaces/:workspaceId/collections
 * List all collections in workspace
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Support both workspace-scoped route (/workspaces/:workspaceId/collections) and legacy route
    const workspaceId = req.params.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      res.status(400).json({
        error: 'Missing required parameter: workspaceId',
      });
      return;
    }

    const collections = await CollectionService.getCollections(
      workspaceId as string
    );

    res.json({
      collections,
      total: collections.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get collections' });
  }
});

/**
 * GET /api/v1/collections/:id
 * Get collection with requests
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const includeNested = req.query.nested === 'true';

    const collection = await CollectionService.getCollectionById(
      id,
      includeNested
    );

    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get collection' });
  }
});

/**
 * PUT /api/v1/collections/:id
 * Update collection
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, variables, preRequestScript, testScript, auth } = req.body;

    if (!name && !description && !variables && !preRequestScript && !testScript && !auth) {
      res.status(400).json({
        error: 'At least one field must be provided: name, description, variables, preRequestScript, testScript, or auth',
      });
      return;
    }

    const updateData: UpdateCollectionDto = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (variables !== undefined) updateData.variables = variables;
    if (preRequestScript !== undefined) updateData.preRequestScript = preRequestScript;
    if (testScript !== undefined) updateData.testScript = testScript;
    if (auth !== undefined) updateData.auth = auth;

    const collection = await CollectionService.updateCollection(id, updateData);

    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update collection' });
  }
});

/**
 * DELETE /api/v1/collections/:id
 * Delete collection
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await CollectionService.deleteCollection(id);

    res.json({ message: 'Collection deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete collection' });
  }
});

/**
 * POST /api/v1/collections/:id/folders
 * Create folder in collection
 */
router.post('/:id/folders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({
        error: 'Missing required field: name',
      });
      return;
    }

    const folder = await CollectionService.createFolder(id, {
      name,
      description,
    });

    res.status(201).json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create folder' });
  }
});

/**
 * POST /api/v1/collections/:id/requests
 * Add request to collection
 */
router.post('/:id/requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, method, url, requestBodyId, params, testScript, preRequestScript } = req.body;

    if (!name || !method || !url) {
      res.status(400).json({
        error: 'Missing required fields: name, method, url',
      });
      return;
    }

    const request = await CollectionService.addRequest(id, {
      name,
      method,
      url,
      requestBodyId,
      params,
      testScript,
      preRequestScript,
    });

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add request' });
  }
});

/**
 * PUT /api/v1/collections/requests/:id
 * Update a request
 */
router.put('/requests/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, method, url, params, headers, body, auth, testScript, preRequestScript } = req.body;

    const request = await CollectionService.updateRequest(id, {
      name,
      method,
      url,
      params,
      headers,
      body,
      auth,
      testScript,
      preRequestScript,
    });

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update request' });
  }
});

/**
 * PUT /api/v1/collections/requests/:id/move
 * Move request to different folder
 */
router.put('/requests/:id/move', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { collectionId, orderIndex } = req.body;

    if (!collectionId) {
      res.status(400).json({
        error: 'Missing required field: collectionId',
      });
      return;
    }

    const request = await CollectionService.moveRequest(id, {
      collectionId,
      orderIndex,
    });

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to move request' });
  }
});

/**
 * PUT /api/v1/collections/:id/reorder
 * Reorder items in collection
 */
router.put('/:id/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      res.status(400).json({
        error: 'Missing or invalid field: items (must be array)',
      });
      return;
    }

    // Validate items structure
    for (const item of items) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        res.status(400).json({
          error: 'Each item must have id and orderIndex',
        });
        return;
      }
    }

    const collection = await CollectionService.reorderItems(id, items);

    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reorder items' });
  }
});

/**
 * POST /api/v1/collections/:id/duplicate
 * Duplicate a collection
 */
router.post('/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const duplicatedCollection = await CollectionService.duplicateCollection(id);

    res.status(201).json(duplicatedCollection);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to duplicate collection',
    });
  }
});

/**
 * POST /api/v1/collections/:id/share
 * Generate shareable link
 */
router.post('/:id/share', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shareData = await CollectionService.generateShareLink(id);

    res.json(shareData);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to generate share link',
    });
  }
});

/**
 * DELETE /api/v1/collections/:id/share
 * Revoke shareable link
 */
router.delete('/:id/share', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await CollectionService.revokeShareLink(id);

    res.json({ message: 'Share link revoked successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to revoke share link',
    });
  }
});

/**
 * GET /api/v1/collections/shared/:token
 * Get collection by share token
 */
router.get('/shared/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const collection = await CollectionService.getCollectionByShareToken(token);

    if (!collection) {
      res.status(404).json({
        error: 'Shared collection not found or link expired',
      });
      return;
    }

    res.json(collection);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get shared collection',
    });
  }
});

/**
 * DELETE /api/collections/requests/:id
 * Delete a request from a collection
 */
router.delete('/requests/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    await CollectionService.deleteRequest(id);

    res.json({
      message: 'Request deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to delete request',
    });
  }
});

/**
 * GET /api/v1/collections/:id/export
 * Export collection in various formats
 */
router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format = 'postman' } = req.query;

    const exportService = new ExportService();

    let result: any;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'postman':
        result = await exportService.exportAsPostman(id);
        filename = `${result.info.name}.postman_collection.json`;
        contentType = 'application/json';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.json(result);
        return;

      case 'curl':
        result = await exportService.exportAsCurl(id);
        filename = 'requests.curl.sh';
        contentType = 'text/plain';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.send(result);
        return;

      case 'openapi':
        result = await exportService.exportAsOpenAPI(id);
        filename = `${result.info.title}.openapi.json`;
        contentType = 'application/json';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.json(result);
        return;

      case 'zip':
        result = await exportService.exportAsZip(id);
        filename = 'collection.zip';
        contentType = 'application/zip';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.send(result);
        return;

      default:
        res.status(400).json({
          error: 'Invalid format. Supported formats: postman, curl, openapi, zip'
        });
        return;
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to export collection',
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/collections/import
 * Import collection from file
 */
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, format } = req.body;
    const file = req.file;

    if (!workspaceId) {
      res.status(400).json({
        error: 'Missing required field: workspaceId'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        error: 'No file uploaded'
      });
      return;
    }

    const importService = new ImportService();
    let result;

    // Parse file content
    const content = file.buffer.toString('utf-8');
    let data: any;

    try {
      data = JSON.parse(content);
    } catch (e) {
      // If not JSON, treat as cURL commands
      if (format === 'curl' || content.includes('curl ')) {
        result = await importService.importCurl(content, workspaceId);
        res.status(201).json({
          message: 'Import successful',
          result
        });
        return;
      }

      res.status(400).json({
        error: 'Invalid file format. File must be valid JSON or cURL commands'
      });
      return;
    }

    // Import based on format or auto-detect
    if (format === 'postman') {
      result = await importService.importPostmanCollection(data, workspaceId);
    } else if (format === 'openapi') {
      result = await importService.importOpenAPI(data, workspaceId);
    } else if (format === 'insomnia') {
      result = await importService.importInsomniaCollection(data, workspaceId);
    } else {
      // Auto-detect
      result = await importService.autoImport(data, workspaceId);
    }

    res.status(201).json({
      message: 'Import successful',
      result
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to import collection',
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/collections/:id/run
 * Run a collection or folder
 */
router.post('/:id/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      environmentId,
      iterations,
      delay,
      stopOnError,
      folderId,
    } = req.body;

    const runner = new CollectionRunner();
    const result = await runner.run(id, {
      environmentId,
      iterations: iterations || 1,
      delay: delay || 0,
      stopOnError: stopOnError !== undefined ? stopOnError : false,
      folderId,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to run collection',
      details: error.message,
    });
  }
});

export default router;
