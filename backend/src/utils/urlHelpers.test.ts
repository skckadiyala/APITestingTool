/**
 * Unit tests for URL Helper utilities
 */

import {
  extractPathParams,
  hasPathParams,
  substitutePathParams,
  getUnresolvedPathParams,
} from './urlHelpers';

describe('urlHelpers', () => {
  describe('extractPathParams', () => {
    it('should extract single path parameter with colon notation', () => {
      expect(extractPathParams('/users/:id')).toEqual(['id']);
      expect(extractPathParams('/api/users/:userId')).toEqual(['userId']);
      expect(extractPathParams('/:resourceId')).toEqual(['resourceId']);
    });

    it('should extract single path parameter with brace notation', () => {
      expect(extractPathParams('/users/{id}')).toEqual(['id']);
      expect(extractPathParams('/api/users/{userId}')).toEqual(['userId']);
      expect(extractPathParams('/{resourceId}')).toEqual(['resourceId']);
    });

    it('should extract multiple path parameters', () => {
      expect(extractPathParams('/users/:userId/posts/:postId')).toEqual([
        'userId',
        'postId',
      ]);
      expect(
        extractPathParams('/users/:userId/posts/:postId/comments/:commentId')
      ).toEqual(['userId', 'postId', 'commentId']);
    });

    it('should extract mixed notation path parameters', () => {
      expect(extractPathParams('/api/:version/users/{userId}')).toEqual([
        'version',
        'userId',
      ]);
      expect(extractPathParams('/{tenant}/users/:id/posts/{postId}')).toEqual([
        'tenant',
        'id',
        'postId',
      ]);
    });

    it('should handle URLs with query parameters', () => {
      expect(extractPathParams('/users/:id?page=1&limit=10')).toEqual(['id']);
      expect(extractPathParams('/api/{version}/users/:userId?active=true')).toEqual([
        'version',
        'userId',
      ]);
    });

    it('should handle URLs with fragments', () => {
      expect(extractPathParams('/users/:id#section')).toEqual(['id']);
      expect(extractPathParams('/posts/:postId#comments')).toEqual(['postId']);
    });

    it('should handle full URLs', () => {
      expect(
        extractPathParams('https://api.example.com/users/:id')
      ).toEqual(['id']);
      expect(
        extractPathParams('http://localhost:3000/api/:version/users/{userId}')
      ).toEqual(['version', 'userId']);
    });

    it('should return empty array for URLs without path parameters', () => {
      expect(extractPathParams('/users/123')).toEqual([]);
      expect(extractPathParams('/api/v1/users')).toEqual([]);
      expect(extractPathParams('https://api.example.com/data')).toEqual([]);
    });

    it('should handle edge cases', () => {
      expect(extractPathParams('')).toEqual([]);
      expect(extractPathParams('/')).toEqual([]);
      expect(extractPathParams(null as any)).toEqual([]);
      expect(extractPathParams(undefined as any)).toEqual([]);
      expect(extractPathParams(123 as any)).toEqual([]);
    });

    it('should handle malformed URLs gracefully', () => {
      expect(extractPathParams('/:id:')).toEqual(['id']);
      expect(extractPathParams('/{id')).toEqual([]);
      expect(extractPathParams('/id}')).toEqual([]);
    });

    it('should handle parameters with underscores and numbers', () => {
      expect(extractPathParams('/users/:user_id')).toEqual(['user_id']);
      expect(extractPathParams('/items/{item123}')).toEqual(['item123']);
      expect(extractPathParams('/api/:v2_users/:id_123')).toEqual([
        'v2_users',
        'id_123',
      ]);
    });
  });

  describe('hasPathParams', () => {
    it('should return true for URLs with path parameters', () => {
      expect(hasPathParams('/users/:id')).toBe(true);
      expect(hasPathParams('/api/{version}/users')).toBe(true);
      expect(hasPathParams('/users/:userId/posts/:postId')).toBe(true);
    });

    it('should return false for URLs without path parameters', () => {
      expect(hasPathParams('/users/123')).toBe(false);
      expect(hasPathParams('/api/v1/users')).toBe(false);
      expect(hasPathParams('')).toBe(false);
    });
  });

  describe('substitutePathParams', () => {
    it('should substitute single path parameter with colon notation', () => {
      expect(substitutePathParams('/users/:id', { id: '123' })).toBe(
        '/users/123'
      );
      expect(
        substitutePathParams('/api/users/:userId', { userId: '456' })
      ).toBe('/api/users/456');
    });

    it('should substitute single path parameter with brace notation', () => {
      expect(substitutePathParams('/users/{id}', { id: '123' })).toBe(
        '/users/123'
      );
      expect(
        substitutePathParams('/api/users/{userId}', { userId: '456' })
      ).toBe('/api/users/456');
    });

    it('should substitute multiple path parameters', () => {
      expect(
        substitutePathParams('/users/:userId/posts/:postId', {
          userId: '123',
          postId: '456',
        })
      ).toBe('/users/123/posts/456');

      expect(
        substitutePathParams('/api/{version}/users/{userId}', {
          version: 'v1',
          userId: '789',
        })
      ).toBe('/api/v1/users/789');
    });

    it('should substitute mixed notation path parameters', () => {
      expect(
        substitutePathParams('/api/:version/users/{userId}', {
          version: 'v2',
          userId: '123',
        })
      ).toBe('/api/v2/users/123');
    });

    it('should handle partial substitution', () => {
      expect(
        substitutePathParams('/users/:userId/posts/:postId', { userId: '123' })
      ).toBe('/users/123/posts/:postId');
    });

    it('should leave URL unchanged if no params provided', () => {
      expect(substitutePathParams('/users/:id', {})).toBe('/users/:id');
      expect(substitutePathParams('/users/:id', null as any)).toBe(
        '/users/:id'
      );
    });

    it('should handle empty or undefined values', () => {
      expect(substitutePathParams('/users/:id', { id: undefined as any })).toBe(
        '/users/:id'
      );
      expect(substitutePathParams('/users/:id', { id: null as any })).toBe(
        '/users/:id'
      );
    });

    it('should handle edge cases', () => {
      expect(substitutePathParams('', { id: '123' })).toBe('');
      expect(substitutePathParams(null as any, { id: '123' })).toBe(null);
      expect(substitutePathParams('/users/:id', { wrongKey: '123' })).toBe(
        '/users/:id'
      );
    });

    it('should handle special characters in values', () => {
      expect(
        substitutePathParams('/users/:id', { id: 'user@example.com' })
      ).toBe('/users/user@example.com');
      expect(substitutePathParams('/files/:name', { name: 'my file.pdf' })).toBe(
        '/files/my file.pdf'
      );
    });

    it('should use word boundaries to avoid partial replacements', () => {
      // Should replace :id but not :identifier which starts with "id"
      expect(
        substitutePathParams('/users/:id/identifiers/:identifier', {
          id: '123',
          identifier: '456',
        })
      ).toBe('/users/123/identifiers/456');
    });

    it('should handle full URLs', () => {
      expect(
        substitutePathParams('https://api.example.com/users/:id', { id: '123' })
      ).toBe('https://api.example.com/users/123');
    });
  });

  describe('getUnresolvedPathParams', () => {
    it('should return unresolved path parameters', () => {
      expect(getUnresolvedPathParams('/users/:id/posts/:postId')).toEqual([
        'id',
        'postId',
      ]);
      expect(getUnresolvedPathParams('/api/{version}/users/{userId}')).toEqual([
        'version',
        'userId',
      ]);
    });

    it('should return empty array for fully resolved URLs', () => {
      expect(getUnresolvedPathParams('/users/123/posts/456')).toEqual([]);
      expect(getUnresolvedPathParams('/api/v1/users/789')).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: extract → substitute → verify', () => {
      const url = '/users/:userId/posts/:postId';
      const params = extractPathParams(url);
      expect(params).toEqual(['userId', 'postId']);

      const resolvedUrl = substitutePathParams(url, {
        userId: '123',
        postId: '456',
      });
      expect(resolvedUrl).toBe('/users/123/posts/456');

      const unresolvedParams = getUnresolvedPathParams(resolvedUrl);
      expect(unresolvedParams).toEqual([]);
    });

    it('should handle GitHub-style URLs', () => {
      const url = 'https://api.github.com/repos/:owner/:repo/issues/:issue_number';
      const params = extractPathParams(url);
      expect(params).toEqual(['owner', 'repo', 'issue_number']);

      const resolved = substitutePathParams(url, {
        owner: 'facebook',
        repo: 'react',
        issue_number: '100',
      });
      expect(resolved).toBe(
        'https://api.github.com/repos/facebook/react/issues/100'
      );
    });

    it('should handle REST API versioning patterns', () => {
      const url = '/api/{version}/users/:userId/orders/{orderId}';
      const params = extractPathParams(url);
      expect(params).toEqual(['version', 'userId', 'orderId']);

      const resolved = substitutePathParams(url, {
        version: 'v2',
        userId: '789',
        orderId: 'order-123',
      });
      expect(resolved).toBe('/api/v2/users/789/orders/order-123');
    });
  });
});
