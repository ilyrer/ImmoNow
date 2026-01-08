/**
 * Centralized Storage Service
 * Type-safe localStorage wrapper with validation
 */

type StorageKey = 
  | 'auth_token'
  | 'tenant_id'
  | 'refresh_token'
  | 'authToken'
  | 'tenantId'
  | 'refreshToken'
  | 'kpiGoals'
  | 'recentSearches'
  | 'dashboardWidgets_admin'
  | 'dashboardWidgets_manager'
  | 'dashboardWidgets_agent'
  | 'dashboardWidgets_viewer'
  | 'dashboardWidgets_default'
  | string; // Allow custom keys for backward compatibility

interface StorageService {
  get<T = any>(key: StorageKey): T | null;
  set<T = any>(key: StorageKey, value: T): void;
  remove(key: StorageKey): void;
  clear(): void;
  has(key: StorageKey): boolean;
}

class Storage implements StorageService {
  private prefix = 'immonow_';
  private isAvailable: boolean;

  constructor() {
    // Check if localStorage is available
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
      console.warn('localStorage is not available');
    }
  }

  private getKey(key: StorageKey): string {
    // For backward compatibility, don't prefix existing keys immediately
    // In future, migrate all keys to use prefix
    return key.startsWith(this.prefix) ? key : key;
  }

  get<T = any>(key: StorageKey): T | null {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const fullKey = this.getKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If not JSON, return as string
        return item as T;
      }
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  set<T = any>(key: StorageKey, value: T): void {
    if (!this.isAvailable) {
      return;
    }

    try {
      const fullKey = this.getKey(key);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to clear old data');
        this.clearOldData();
      }
    }
  }

  remove(key: StorageKey): void {
    if (!this.isAvailable) {
      return;
    }

    try {
      const fullKey = this.getKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  }

  clear(): void {
    if (!this.isAvailable) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  has(key: StorageKey): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear old data when quota is exceeded
   * This is a simple implementation - you might want to implement LRU cache
   */
  private clearOldData(): void {
    // Clear non-essential data
    // Keep auth tokens, but clear things like search history, etc.
    try {
      this.remove('recentSearches');
      // Add more non-essential keys here
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  }

  /**
   * Get all keys with our prefix
   */
  getAllKeys(): string[] {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  /**
   * Get storage size estimate (in bytes)
   */
  getSize(): number {
    if (!this.isAvailable) {
      return 0;
    }

    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      return total;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const storage = new Storage();

// Export type for use in components
export type { StorageKey, StorageService };
