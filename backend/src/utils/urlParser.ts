/**
 * Shared URL parsing utilities for Postman import/export
 */

export interface PostmanUrlObject {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{
    key: string;
    value: string;
    disabled?: boolean;
  }>;
}

export interface QueryParam {
  key: string;
  value: string;
  enabled?: boolean;
}

export class URLParser {
  /**
   * Parse a Postman URL object from a string or object
   * Used during import to extract URL components
   */
  static parsePostmanUrl(url: string | any): { url: string; params: QueryParam[] } {
    let urlString: string;
    let params: QueryParam[] = [];

    // Handle URL as string or object
    if (typeof url === 'string') {
      urlString = url;
    } else if (typeof url === 'object') {
      urlString = url.raw || '';
      
      // Extract query parameters from URL object
      if (url.query && Array.isArray(url.query)) {
        params = url.query.map((q: any) => ({
          key: q.key,
          value: q.value || '',
          enabled: q.disabled !== true
        }));
      }
    } else {
      urlString = '';
    }

    return { url: urlString, params };
  }

  /**
   * Build a Postman URL object from a URL string
   * Used during export to create Postman-compatible URL structure
   */
  static buildPostmanUrl(urlString: string, params?: QueryParam[]): PostmanUrlObject {
    const urlObj: PostmanUrlObject = {
      raw: urlString
    };

    // Remove query string for parsing
    let urlToParse = urlString;
    const queryStartIndex = urlToParse.indexOf('?');
    if (queryStartIndex !== -1) {
      urlToParse = urlToParse.substring(0, queryStartIndex);
    }

    // Try to parse URL, or manually extract host and path
    try {
      const parsedUrl = new URL(urlToParse);
      urlObj.protocol = parsedUrl.protocol.replace(':', '');
      urlObj.host = parsedUrl.hostname.split('.');
      urlObj.path = parsedUrl.pathname.split('/').filter(Boolean);
    } catch (error) {
      // URL contains variables (e.g., {{base_url}}), manually extract host and path
      // Remove protocol if present
      let urlWithoutProtocol = urlToParse.replace(/^https?:\/\//, '');
      
      // Split by first /
      const firstSlashIndex = urlWithoutProtocol.indexOf('/');
      
      if (firstSlashIndex !== -1) {
        // Extract host part (e.g., {{base_url}})
        const hostPart = urlWithoutProtocol.substring(0, firstSlashIndex);
        urlObj.host = [hostPart];
        
        // Extract path parts (e.g., {{assets_version}}/assets/software/brand-filter)
        const pathPart = urlWithoutProtocol.substring(firstSlashIndex + 1);
        urlObj.path = pathPart.split('/').filter(Boolean);
      } else {
        // No path, just host
        urlObj.host = [urlWithoutProtocol];
        urlObj.path = [];
      }
    }

    // Add query parameters if present
    if (params && Array.isArray(params) && params.length > 0) {
      urlObj.query = params.map((p: QueryParam) => ({
        key: p.key,
        value: p.value,
        disabled: p.enabled === false
      }));
    }

    return urlObj;
  }

  /**
   * Convert headers array to Postman format
   */
  static convertHeadersToPostman(headers: any[]): any[] {
    if (!headers || !Array.isArray(headers)) {
      return [];
    }

    return headers
      .filter((h: any) => h.enabled !== false)
      .map((h: any) => ({
        key: h.key,
        value: h.value || ''
      }));
  }

  /**
   * Convert Postman headers to our format
   */
  static convertHeadersFromPostman(headers: any[]): any[] {
    if (!headers || !Array.isArray(headers)) {
      return [];
    }

    return headers
      .filter((h: any) => !h.disabled)
      .map((h: any) => ({
        key: h.key,
        value: h.value || ''
      }));
  }
}
