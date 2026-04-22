import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

describe('Auth Rate Limiting', () => {
  const testEmail = `ratelimit-test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  describe('POST /api/v1/auth/login - Auth Limiter (5 requests per 15 min)', () => {
    test('should allow first 5 requests', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });

        // Should receive 401 (invalid credentials) not 429 (rate limit)
        expect(response.status).toBe(401);
      }
    });

    test('should block 6th request with 429 status', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many authentication attempts');
    });

    test('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/register - Auth Limiter (5 requests per 15 min)', () => {
    test('should block after 5 registration attempts', async () => {
      const timestamp = Date.now();

      // Make 6 registration attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test-${timestamp}-${i}@example.com`,
            password: testPassword,
            name: `Test User ${i}`,
          });

        if (i < 5) {
          // First 5 should either succeed (201) or fail with validation error (400)
          expect([201, 400]).toContain(response.status);
        } else {
          // 6th request should be rate limited
          expect(response.status).toBe(429);
          expect(response.body.message).toContain('Too many authentication attempts');
        }
      }
    });
  });

  describe('POST /api/v1/auth/forgot-password - Password Reset Limiter (3 requests per hour)', () => {
    test('should allow first 3 password reset requests', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: `reset-test-${i}@example.com`,
          });

        // Should succeed (200) even if email doesn't exist (to prevent enumeration)
        expect(response.status).toBe(200);
      }
    });

    test('should block 4th password reset request', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'reset-test@example.com',
        });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many password reset attempts');
    });
  });

  describe('POST /api/v1/auth/refresh - Refresh Token Limiter (20 requests per 15 min)', () => {
    test('should allow more refresh requests than login (relaxed limit)', async () => {
      // Should allow up to 20 requests
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'invalid-token',
          });

        // Should receive 401 (invalid token) not 429 (rate limit)
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Rate Limit Headers', () => {
    test('should include standard rate limit headers', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      // Check for RateLimit headers (standard format)
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');

      // Should NOT have legacy X-RateLimit headers
      expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
    });

    test('should show decreasing remaining count', async () => {
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid-token');

        responses.push(response);
      }

      // Check that remaining count decreases
      const remaining1 = parseInt(responses[0].headers['ratelimit-remaining'] || '0');
      const remaining2 = parseInt(responses[1].headers['ratelimit-remaining'] || '0');
      const remaining3 = parseInt(responses[2].headers['ratelimit-remaining'] || '0');

      expect(remaining1).toBeGreaterThan(remaining2);
      expect(remaining2).toBeGreaterThan(remaining3);
    });
  });

  describe('Different Limits for Different Endpoints', () => {
    test('login should have stricter limit than logout', async () => {
      // Login has 5 requests limit
      // Logout has 100 requests limit (generalAuthLimiter)
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' });

      const loginLimit = parseInt(loginResponse.headers['ratelimit-limit'] || '0');
      const logoutLimit = parseInt(logoutResponse.headers['ratelimit-limit'] || '0');

      expect(logoutLimit).toBeGreaterThan(loginLimit);
    });

    test('password reset should have strictest limit', async () => {
      const forgotPasswordResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const resetLimit = parseInt(forgotPasswordResponse.headers['ratelimit-limit'] || '0');
      const loginLimit = parseInt(loginResponse.headers['ratelimit-limit'] || '0');

      // Password reset limit (3) should be lower than login limit (5)
      expect(resetLimit).toBeLessThan(loginLimit);
    });
  });
});
