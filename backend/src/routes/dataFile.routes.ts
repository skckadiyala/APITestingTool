import { Router } from 'express';
import { dataFileController } from '../controllers/DataFileController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload data file
router.post('/upload', (req, res) => dataFileController.uploadDataFile(req, res));

// Get all data files for workspace
router.get('/workspace/:workspaceId', (req, res) => dataFileController.getDataFiles(req, res));

// Get data file by ID
router.get('/:id', (req, res) => dataFileController.getDataFile(req, res));

// Get full parsed data
router.get('/:id/data', (req, res) => dataFileController.getParsedData(req, res));

// Delete data file
router.delete('/:id', (req, res) => dataFileController.deleteDataFile(req, res));

export default router;
