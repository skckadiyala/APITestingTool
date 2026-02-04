import type { AuthConfig } from './auth.types';
import type { Variable, RequestBody, RequestParam, RequestHeader } from './request.types';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  parentFolderId?: string | null;
  type: 'COLLECTION' | 'FOLDER';
  orderIndex: number;
  shareToken?: string | null;
  isShared: boolean;
  variables?: Variable[];
  preRequestScript?: string | null;
  testScript?: string | null;
  auth?: AuthConfig | null;
  createdAt: string;
  updatedAt: string;
  childFolders?: Collection[];
  requests?: CollectionRequest[];
}

export interface CollectionRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  collectionId: string;
  requestBodyId?: string | null;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  body: RequestBody | null;
  headers?: RequestHeader[];
  auth?: AuthConfig | null;
  params?: RequestParam[];
  orderIndex: number;
  testScript?: string | null;
  preRequestScript?: string | null;
  graphqlQuery?: string | null;
  graphqlVariables?: Record<string, any> | null;
  graphqlSchema?: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  workspaceId: string;
  parentFolderId?: string;
  type: 'COLLECTION' | 'FOLDER';
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  variables?: Variable[];
  preRequestScript?: string;
  testScript?: string;
  auth?: AuthConfig | null;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
}

export interface AddRequestDto {
  name: string;
  method: string;
  url: string;
  requestBodyId?: string;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  params?: RequestParam[];
  headers?: RequestHeader[];
  body?: RequestBody | null;
  auth?: AuthConfig | null;
  testScript?: string;
  preRequestScript?: string;
  graphqlQuery?: string;
  graphqlVariables?: Record<string, any>;
  graphqlSchema?: any;
}

export interface UpdateRequestDto {
  name?: string;
  method?: string;
  url?: string;
  requestType?: 'REST' | 'GRAPHQL' | 'WEBSOCKET';
  params?: RequestParam[];
  headers?: RequestHeader[];
  body?: RequestBody | null;
  auth?: AuthConfig | null;
  testScript?: string;
  preRequestScript?: string;
  graphqlQuery?: string;
  graphqlVariables?: Record<string, any>;
  graphqlSchema?: any;
}

export interface MoveRequestDto {
  collectionId: string;
  orderIndex?: number;
}

export interface ReorderItemDto {
  id: string;
  orderIndex: number;
}
