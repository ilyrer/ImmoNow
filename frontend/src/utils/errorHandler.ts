/**
 * Centralized Error Handling Utilities
 * Standardized error handling across the application
 */

import { logger } from './logger';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  userMessage?: string;
}

export class AppError extends Error implements AppError {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  userMessage?: string;

  constructor(
    message: string,
    options?: {
      code?: string;
      statusCode?: number;
      context?: Record<string, any>;
      userMessage?: string;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.context = options?.context;
    this.userMessage = options?.userMessage;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Extract error code from various error types
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AppError && error.code) {
    return error.code;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }

  return undefined;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Axios errors
    if ('isAxiosError' in error && error.isAxiosError) {
      return !('response' in error && error.response);
    }

    // Fetch API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Axios 401/403
    if ('response' in error && error.response) {
      const status = (error.response as any).status;
      return status === 401 || status === 403;
    }

    // AppError with status code
    if (error instanceof AppError) {
      return error.statusCode === 401 || error.statusCode === 403;
    }
  }

  return false;
}

/**
 * Handle error with logging
 */
export function handleError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  logger.error(message, context, error);

  // In production, you could send to error tracking service
  // Example: Sentry.captureException(error, { contexts: { custom: { context, code } } });
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }

  if (isAuthError(error)) {
    return 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';
  }

  return getErrorMessage(error);
}

/**
 * Error boundary error type
 */
export interface ErrorBoundaryError {
  error: Error;
  errorInfo?: {
    componentStack?: string;
  };
}

/**
 * Create error from API response
 */
export function createErrorFromResponse(
  response: any,
  defaultMessage = 'Ein Fehler ist aufgetreten'
): AppError {
  const message = 
    response?.data?.message ||
    response?.data?.detail ||
    response?.data?.error ||
    defaultMessage;

  const statusCode = response?.status || response?.statusCode;

  return new AppError(message, {
    statusCode,
    code: response?.data?.code,
    context: response?.data,
    userMessage: message,
  });
}
