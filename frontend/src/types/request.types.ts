export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
  description?: string;
}

export interface RequestParam extends KeyValuePair {}
export interface RequestHeader extends KeyValuePair {}

export type RequestBodyType = 'none' | 'json' | 'xml' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

export interface RequestBody {
  type: RequestBodyType;
  content: string | Record<string, unknown> | FormData;
  raw?: string;
}

export interface Variable {
  id?: string;
  key: string;
  value: string;
  type?: 'default' | 'secret';
  enabled?: boolean;
}
