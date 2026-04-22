/**
 * Test script size validation
 * Tests that scripts exceeding 50KB are rejected
 */

import request from 'supertest';
import { app } from '../app';

describe('Script Size Validation', () => {
  const MAX_SCRIPT_SIZE = 50 * 1024; // 50KB
  
  // Mock authentication middleware
  jest.mock('../middleware/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id' };
      next();
    },
  }));

  describe('POST /api/v1/collections/:id/requests', () => {
    it('should reject pre-request script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .post('/api/v1/collections/test-collection-id/requests')
        .send({
          name: 'Test Request',
          method: 'GET',
          url: 'https://example.com',
          preRequestScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Pre-request script exceeds maximum size of 50KB');
    });

    it('should reject test script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .post('/api/v1/collections/test-collection-id/requests')
        .send({
          name: 'Test Request',
          method: 'GET',
          url: 'https://example.com',
          testScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Test script exceeds maximum size of 50KB');
    });

    it('should accept scripts within 50KB limit', async () => {
      const validScript = 'pm.test("Valid test", () => { pm.expect(true).to.be.true; });';
      
      // This will fail for other reasons (no auth), but should pass size validation
      const response = await request(app)
        .post('/api/v1/collections/test-collection-id/requests')
        .send({
          name: 'Test Request',
          method: 'GET',
          url: 'https://example.com',
          preRequestScript: validScript,
          testScript: validScript,
        });

      // Should not fail due to script size
      expect(response.body.error).not.toContain('exceeds maximum size');
    });
  });

  describe('PUT /api/v1/collections/:id', () => {
    it('should reject collection pre-request script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .put('/api/v1/collections/test-collection-id')
        .send({
          name: 'Test Collection',
          preRequestScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Pre-request script exceeds maximum size of 50KB');
    });

    it('should reject collection test script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .put('/api/v1/collections/test-collection-id')
        .send({
          name: 'Test Collection',
          testScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Test script exceeds maximum size of 50KB');
    });
  });

  describe('PUT /api/v1/collections/requests/:id', () => {
    it('should reject request pre-request script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .put('/api/v1/collections/requests/test-request-id')
        .send({
          preRequestScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Pre-request script exceeds maximum size of 50KB');
    });

    it('should reject request test script exceeding 50KB', async () => {
      const oversizedScript = 'a'.repeat(MAX_SCRIPT_SIZE + 1);
      
      const response = await request(app)
        .put('/api/v1/collections/requests/test-request-id')
        .send({
          testScript: oversizedScript,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Test script exceeds maximum size of 50KB');
    });
  });
});
