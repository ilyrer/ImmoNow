/**
 * Error Handler Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  getErrorMessage,
  getErrorCode,
  isNetworkError,
  isAuthError,
  getUserFriendlyMessage,
  createErrorFromResponse,
} from '../errorHandler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with message', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
    });

    it('should create error with code and status', () => {
      const error = new AppError('Test error', {
        code: 'TEST_CODE',
        statusCode: 404,
      });
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(404);
    });

    it('should use userMessage when provided', () => {
      const error = new AppError('Technical error', {
        userMessage: 'User-friendly error',
      });
      expect(error.userMessage).toBe('User-friendly error');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from AppError', () => {
      const error = new AppError('Test', { userMessage: 'User message' });
      expect(getErrorMessage(error)).toBe('User message');
    });

    it('should extract message from Error', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown errors', () => {
      expect(getErrorMessage(null)).toBe('Ein unbekannter Fehler ist aufgetreten');
    });
  });

  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      const error = new TypeError('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });
  });

  describe('isAuthError', () => {
    it('should detect auth errors from AppError', () => {
      const error = new AppError('Unauthorized', { statusCode: 401 });
      expect(isAuthError(error)).toBe(true);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for network errors', () => {
      const error = new TypeError('Failed to fetch');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Netzwerkfehler');
    });

    it('should return friendly message for auth errors', () => {
      const error = new AppError('Unauthorized', { statusCode: 401 });
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Sitzung');
    });
  });

  describe('createErrorFromResponse', () => {
    it('should create error from API response', () => {
      const response = {
        status: 404,
        data: {
          message: 'Not found',
          code: 'NOT_FOUND',
        },
      };
      const error = createErrorFromResponse(response);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });
});
