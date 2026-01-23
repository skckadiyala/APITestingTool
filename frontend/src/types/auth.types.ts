export type AuthType = 'none' | 'noauth' | 'bearer' | 'basic' | 'api-key' | 'oauth2';

export interface BearerAuth {
  type: 'bearer';
  token: string;
}

export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

export interface ApiKeyAuth {
  type: 'api-key';
  key: string;
  value: string;
  in: 'header' | 'query';
}

export interface OAuth2Auth {
  type: 'oauth2';
  accessToken: string;
  tokenType?: string;
  refreshToken?: string;
}

export interface NoAuth {
  type: 'none' | 'noauth';
}

export type AuthConfig = BearerAuth | BasicAuth | ApiKeyAuth | OAuth2Auth | NoAuth;
