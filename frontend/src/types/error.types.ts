import { AxiosError } from 'axios';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Type guard to check if an error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'statusCode' in error;
}

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Extract status code from error if available
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  
  if (isAppError(error)) {
    return error.statusCode;
  }
  
  return undefined;
}
