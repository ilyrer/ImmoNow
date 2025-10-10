/**
 * Error Utilities für sichere Fehlerbehandlung
 */

export const getErrorMessage = (error: any): string => {
  // If it's already a string
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message;
  }

  // If it's an API response error
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data) {
    // If data is a string
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    
    // If data has any message-like properties
    if (error.response.data.error) {
      return error.response.data.error;
    }
  }

  // If it has a message property
  if (error?.message) {
    return error.message;
  }

  // If it's an object, try to stringify it safely
  if (typeof error === 'object' && error !== null) {
    try {
      // Check if it looks like a validation error object
      if (error.type && error.msg) {
        return error.msg;
      }
      
      return JSON.stringify(error, null, 2);
    } catch {
      return 'Unbekannter Fehler (Objekt)';
    }
  }

  // Fallback
  return 'Unbekannter Fehler';
};

export const logError = (context: string, error: any) => {
  console.error(`[${context}] Fehler:`, error);
  
  // Additional error details for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      type: typeof error,
      constructor: error?.constructor?.name,
      keys: error && typeof error === 'object' ? Object.keys(error) : null,
      stringified: JSON.stringify(error, null, 2)
    });
  }
};

export const createSafeErrorHandler = (context: string) => {
  return (error: any) => {
    logError(context, error);
    return getErrorMessage(error);
  };
};
