/**
 * Application configuration constants
 * Centralized configuration for app-wide settings
 */

export const APP_CONFIG = {
  // Request body size limits
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '10mb',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  RATE_LIMIT_MESSAGE: 'Too many requests from this IP, please try again later.',
  
  // Server
  PORT: parseInt(process.env.PORT || '5000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Frontend URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 
    `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || '5173'}`,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()).filter(o => o) || [],
};
