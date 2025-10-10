/**
 * Type Helper Utilities
 * Hilfsfunktionen für TypeScript Type Guards und Conversions
 */

/**
 * Prüft ob ein Wert ein Error-Objekt ist
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Extrahiert eine Error-Message aus einem unbekannten Error-Objekt
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'Unbekannter Fehler';
};

/**
 * Prüft ob ein Wert ein Array ist und gibt ein typsicheres Array zurück
 */
export const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
};

/**
 * Prüft ob ein Objekt eine bestimmte Property hat
 */
export const hasProperty = <K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj;
};

/**
 * Sichere Property-Zugriff mit Fallback
 */
export const getProperty = <T>(
  obj: unknown,
  key: string,
  fallback: T
): T => {
  if (hasProperty(obj, key)) {
    return (obj[key] as T) ?? fallback;
  }
  return fallback;
};
