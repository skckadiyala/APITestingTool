/**
 * URL Helper Utilities
 * Functions for parsing and manipulating URLs, including path parameter extraction
 */

/**
 * Extract path parameter names from a URL
 * Supports both :paramName and {paramName} syntax
 * 
 * @param url - The URL string to parse (can be full URL or just path)
 * @returns Array of parameter names (without : or {})
 * 
 * @example
 * extractPathParams('/users/:id') // returns ['id']
 * extractPathParams('/api/{version}/users/{userId}') // returns ['version', 'userId']
 * extractPathParams('/users/:userId/posts/:postId') // returns ['userId', 'postId']
 */
export function extractPathParams(url: string): string[] {
  if (!url || typeof url !== 'string') {
    return [];
  }

  // Remove query parameters and fragments to only parse the path
  const pathOnly = url.split('?')[0].split('#')[0];

  // Extract path from URL (remove protocol, host, and port)
  let path = pathOnly;
  if (pathOnly.includes('://')) {
    const urlParts = pathOnly.split('://');
    if (urlParts.length > 1) {
      // Get the part after protocol
      const afterProtocol = urlParts[1];
      // Find first slash which starts the path
      const pathStartIndex = afterProtocol.indexOf('/');
      if (pathStartIndex !== -1) {
        path = afterProtocol.substring(pathStartIndex);
      } else {
        // No path, just host
        return [];
      }
    }
  }

  // Regex to match :paramName or {paramName} patterns
  // For colon notation: must be preceded by / to avoid matching port numbers
  const paramRegex = /(?:\/|^):(\w+)|\{(\w+)\}/g;
  const params: string[] = [];
  let match;

  while ((match = paramRegex.exec(path)) !== null) {
    // match[1] is from :paramName, match[2] is from {paramName}
    const paramName = match[1] || match[2];
    if (paramName) {
      params.push(paramName);
    }
  }

  return params;
}

/**
 * Check if a URL contains path parameters
 * 
 * @param url - The URL string to check
 * @returns true if URL contains path parameters, false otherwise
 * 
 * @example
 * hasPathParams('/users/:id') // returns true
 * hasPathParams('/users/123') // returns false
 */
export function hasPathParams(url: string): boolean {
  return extractPathParams(url).length > 0;
}

/**
 * Substitute path parameters in a URL with provided values
 * 
 * @param url - The URL template with path parameters
 * @param params - Object mapping parameter names to values
 * @returns URL with parameters substituted
 * 
 * @example
 * substitutePathParams('/users/:id', { id: '123' }) // returns '/users/123'
 * substitutePathParams('/api/{version}/users/{userId}', { version: 'v1', userId: '456' }) 
 * // returns '/api/v1/users/456'
 */
export function substitutePathParams(url: string, params: Record<string, string>): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  if (!params || typeof params !== 'object') {
    return url;
  }

  let result = url;

  // Replace each parameter in the URL
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      // Replace both :paramName and {paramName} patterns
      // Use word boundary \b to avoid partial replacements
      const colonPattern = new RegExp(`:${key}\\b`, 'g');
      const bracePattern = new RegExp(`\\{${key}\\}`, 'g');
      
      result = result.replace(colonPattern, value);
      result = result.replace(bracePattern, value);
    }
  });

  return result;
}

/**
 * Get unresolved path parameters (parameters in URL without values)
 * 
 * @param url - The URL with potential path parameters
 * @returns Array of parameter names that are still in the URL
 * 
 * @example
 * getUnresolvedPathParams('/users/:id/posts/:postId') // returns ['id', 'postId']
 * getUnresolvedPathParams('/users/123/posts/456') // returns []
 */
export function getUnresolvedPathParams(url: string): string[] {
  return extractPathParams(url);
}
