/**
 * Error Utilities für sichere Fehlerbehandlung
 * @deprecated Use errorHandler.ts instead. This file is kept for backward compatibility.
 */

import { getErrorMessage as getErrorMessageNew, handleError as handleErrorNew, getUserFriendlyMessage as getUserFriendlyMessageNew } from './errorHandler';

/**
 * @deprecated Use getErrorMessage from errorHandler.ts
 */
export const getErrorMessage = getErrorMessageNew;

/**
 * @deprecated Use handleError from errorHandler.ts
 */
export const logError = (context: string, error: any) => {
  handleErrorNew(error, context);
};

/**
 * @deprecated Use getUserFriendlyMessage from errorHandler.ts
 */
export const createSafeErrorHandler = (context: string) => {
  return (error: any) => {
    handleErrorNew(error, context);
    return getUserFriendlyMessageNew(error);
  };
};
