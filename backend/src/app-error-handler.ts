/**
 * Secure Global Error Handler
 * This file contains the improved error handler that should replace the one in app.ts
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './utils/errors';

/**
 * Secure error handler that never exposes stack traces or internal error details to clients
 * All errors are logged server-side for debugging
 */
export const secureErrorHandler = (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  // Log error for debugging (server-side only)
  console.error('Error:', err);
  console.error('Stack trace:', err.stack);

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message, // AppError messages are designed to be user-safe
    });
  }

  // Handle Prisma errors - sanitize database details
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
      // Details intentionally omitted for security
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }

  // Handle validation errors - sanitize error details
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
    });
  }

  // Default to 500 server error - never expose internal error details
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    // Error details intentionally omitted for security
    // Full error logged above for debugging
  });
};
