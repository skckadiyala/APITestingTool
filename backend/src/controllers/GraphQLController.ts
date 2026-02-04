
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GraphQLExecutor } from '../services/GraphQLExecutor';
import { PrismaClient } from '@prisma/client';
import { GraphQLQueryVariables } from '../types/request.types';

const prisma = new PrismaClient();
const graphqlExecutor = new GraphQLExecutor();

export class GraphQLController {
  /**
   * Execute GraphQL query
   * POST /api/v1/graphql/execute
   */
  async execute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { url, query, variables, operationName, headers, requestId } = req.body;
      const userId = req.user!.userId;

      // Validate required fields
      if (!url || !query) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: url and query'
        });
        return;
      }

      // Validate URL format (skip if contains variables)
      if (!url.includes('{{')) {
        try {
          new URL(url);
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid URL format'
          });
          return;
        }
      }

      // Validate variables is valid JSON if provided
      let parsedVariables: GraphQLQueryVariables | undefined;
      if (variables) {
        try {
          parsedVariables = typeof variables === 'string' 
            ? JSON.parse(variables) 
            : variables;
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid variables JSON format'
          });
          return;
        }
      }

      // Execute the GraphQL request
      const startTime = Date.now();
      const result = await graphqlExecutor.execute(
        url,
        query,
        parsedVariables,
        operationName,
        headers
      );
      const executionTime = Date.now() - startTime;

      // Save to history if requestId provided
      if (requestId) {
        try {
          await prisma.requestHistory.create({
            data: {
              requestId,
              userId,
              method: 'POST',
              url,
              requestBodyId: 'graphql-request',
              statusCode: result.errors ? 400 : 200,
              responseTime: executionTime,
            }
          });
        } catch (historyError) {
          console.error('Failed to save GraphQL request history:', historyError);
          // Don't fail the request if history save fails
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...result,
          executionTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GraphQL execute error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to execute GraphQL query',
        error: error.toString()
      });
    }
  }

  /**
   * Introspect GraphQL schema
   * POST /api/v1/graphql/introspect
   */
  async introspect(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { url, headers, requestId } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: url'
        });
        return;
      }

      // Validate URL format
      if (!url.includes('{{')) {
        try {
          new URL(url);
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid URL format'
          });
          return;
        }
      }

      // Introspect schema
      const startTime = Date.now();
      const schema = await graphqlExecutor.introspectSchema(url, headers);
      const introspectionTime = Date.now() - startTime;

      // Cache schema in database if requestId provided
      if (requestId) {
        try {
          await prisma.request.update({
            where: { id: requestId },
            data: {
              graphqlSchema: schema as any,
              graphqlSchemaUrl: url,
              graphqlSchemaLastFetched: new Date(),
            }
          });
        } catch (updateError) {
          console.error('Failed to cache schema:', updateError);
          // Don't fail the request if caching fails
        }
      }

      res.status(200).json({
        success: true,
        data: {
          schema,
          introspectionTime,
          timestamp: new Date().toISOString(),
          cached: !!requestId
        }
      });
    } catch (error: any) {
      console.error('GraphQL introspect error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to introspect GraphQL schema',
        error: error.toString()
      });
    }
  }

  /**
   * Get cached schema for a request
   * GET /api/v1/graphql/schema/:requestId
   */
  async getSchema(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const userId = req.user!.userId;

      if (!requestId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: requestId'
        });
        return;
      }

      // Get request with schema
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          graphqlSchema: true,
          graphqlSchemaUrl: true,
          graphqlSchemaLastFetched: true,
          collectionId: true,
          collection: {
            select: {
              workspaceId: true
            }
          }
        }
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Request not found'
        });
        return;
      }

      // Verify user has access to this workspace
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: request.collection.workspaceId,
          userId: userId
        }
      });

      if (!workspaceMember) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this workspace'
        });
        return;
      }

      if (!request.graphqlSchema) {
        res.status(404).json({
          success: false,
          message: 'No cached schema found for this request'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          schema: request.graphqlSchema,
          schemaUrl: request.graphqlSchemaUrl,
          lastFetched: request.graphqlSchemaLastFetched,
          requestId: request.id
        }
      });
    } catch (error: any) {
      console.error('Get GraphQL schema error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve GraphQL schema',
        error: error.toString()
      });
    }
  }

  /**
   * Validate GraphQL query
   * POST /api/v1/graphql/validate
   */
  async validate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: query'
        });
        return;
      }

      // Validate syntax
      const syntaxValidation = graphqlExecutor.validateQuerySyntax(query);

      if (!syntaxValidation.valid) {
        res.status(200).json({
          success: true,
          data: {
            valid: false,
            syntaxErrors: syntaxValidation.errors,
            schemaErrors: []
          }
        });
        return;
      }

      // If schema provided, validate against it
      // Note: Schema validation requires graphql-js parse/validate which
      // is more complex. For now, we return syntax validation only.
      // Full schema validation can be done client-side using the validator utility.

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          syntaxErrors: [],
          schemaErrors: [],
          message: 'Query syntax is valid'
        }
      });
    } catch (error: any) {
      console.error('GraphQL validate error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate GraphQL query',
        error: error.toString()
      });
    }
  }
}

export default new GraphQLController();
