import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import graphqlController from '../controllers/GraphQLController';

const router = Router();

/**
 * POST /api/v1/graphql/execute
 * Execute a GraphQL query/mutation/subscription
 * Requires authentication
 */
router.post('/execute', authenticate, (req, res) => {
  graphqlController.execute(req, res);
});

/**
 * POST /api/v1/graphql/introspect
 * Introspect GraphQL schema from endpoint
 * Requires authentication
 */
router.post('/introspect', authenticate, (req, res) => {
  graphqlController.introspect(req, res);
});

/**
 * GET /api/v1/graphql/schema/:requestId
 * Get cached GraphQL schema for a request
 * Requires authentication
 */
router.get('/schema/:requestId', authenticate, (req, res) => {
  graphqlController.getSchema(req, res);
});

/**
 * POST /api/v1/graphql/validate
 * Validate GraphQL query syntax and schema
 * Requires authentication
 */
router.post('/validate', authenticate, (req, res) => {
  graphqlController.validate(req, res);
});

export default router;
