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

/**
 * Validate a URL after path parameter substitution
 * Detects common issues like trailing slashes, double slashes, etc.
 * 
 * @param url - The URL to validate
 * @returns Array of validation warning messages
 * 
 * @example
 * validateSubstitutedUrl('https://api.example.com/users/') // returns ['URL path ends with /']
 * validateSubstitutedUrl('https://api.example.com/users//posts') // returns ['URL contains consecutive slashes //']
 */
export function validateSubstitutedUrl(url: string): string[] {
  const warnings: string[] = [];

  if (!url || typeof url !== 'string') {
    warnings.push('Invalid URL: empty or not a string');
    return warnings;
  }

  try {
    const urlObj = new URL(url);
    
    // Check for trailing slash after path params
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      warnings.push('URL path ends with / - check if path parameter values are correct');
    }

    // Check for double slashes in path (except after protocol)
    const pathWithoutProtocol = url.replace(/^https?:\/\//, '');
    if (pathWithoutProtocol.includes('//')) {
      warnings.push('URL contains consecutive slashes // - check path parameter values');
    }

    // Check if path params placeholders still exist (unresolved)
    const unresolvedParams = getUnresolvedPathParams(url);
    if (unresolvedParams.length > 0) {
      warnings.push(`Unresolved path parameters in URL: ${unresolvedParams.map(p => `:${p}`).join(', ')}`);
    }
  } catch (error) {
    // URL is malformed
    warnings.push('Malformed URL after path parameter substitution');
  }

  return warnings;
}

/**
 * Check if a path parameter value contains special characters that may cause issues
 * 
 * @param value - The path parameter value
 * @returns Object with hasIssues flag and array of specific issues
 * 
 * @example
 * checkPathParamSpecialChars('user/123') // returns { hasIssues: true, issues: ['Contains / character'] }
 * checkPathParamSpecialChars('user name') // returns { hasIssues: true, issues: ['Contains spaces'] }
 */
export function checkPathParamSpecialChars(value: string): { hasIssues: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!value || typeof value !== 'string') {
    return { hasIssues: false, issues };
  }

  // Check for forward slash (likely a mistake)
  if (value.includes('/')) {
    issues.push('Contains / character - this may be a mistake');
  }

  // Check for spaces (should be encoded)
  if (value.includes(' ')) {
    issues.push('Contains spaces - will be URL-encoded as %20');
  }

  // Check for other special characters that need encoding
  const specialChars = /[<>{}|\[\]^`]/;
  if (specialChars.test(value)) {
    issues.push('Contains special characters that will be URL-encoded');
  }

  return { hasIssues: issues.length > 0, issues };
}

/**
 * Validate path parameters before sending request
 * Returns validation errors and warnings
 * 
 * @param pathParams - Array of path parameters
 * @returns Object with errors and warnings arrays
 * 
 * @example
 * validatePathParams([{ key: 'id', value: '' }]) 
 * // returns { errors: [], warnings: ['Path parameter :id has no value'] }
 */
export function validatePathParams(pathParams: Array<{ key: string; value: string }>): { 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pathParams || pathParams.length === 0) {
    return { errors, warnings };
  }

  // Detect duplicate param names
  const paramNames = pathParams.map(p => p.key);
  const duplicates = paramNames.filter((name, index) => paramNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    uniqueDuplicates.forEach(dup => {
      warnings.push(`Duplicate path parameter ':${dup}' - same value will be used for all occurrences`);
    });
  }

  // Check for empty values
  pathParams.forEach(param => {
    if (!param.value || param.value.trim() === '') {
      warnings.push(`Path parameter ':${param.key}' has no value`);
    } else {
      // Check for special characters in non-empty values
      const { hasIssues, issues } = checkPathParamSpecialChars(param.value);
      if (hasIssues) {
        issues.forEach(issue => {
          warnings.push(`Path parameter ':${param.key}': ${issue}`);
        });
      }
    }
  });

  return { errors, warnings };
}
