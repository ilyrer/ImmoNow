/**
 * Storage Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

describe('Storage Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should store and retrieve string values', () => {
    storage.set('test_key', 'test_value');
    expect(storage.get('test_key')).toBe('test_value');
  });

  it('should store and retrieve object values', () => {
    const testObject = { name: 'Test', value: 123 };
    storage.set('test_object', testObject);
    expect(storage.get('test_object')).toEqual(testObject);
  });

  it('should return null for non-existent keys', () => {
    expect(storage.get('non_existent')).toBeNull();
  });

  it('should remove keys', () => {
    storage.set('test_key', 'test_value');
    storage.remove('test_key');
    expect(storage.get('test_key')).toBeNull();
  });

  it('should check if key exists', () => {
    expect(storage.has('test_key')).toBe(false);
    storage.set('test_key', 'test_value');
    expect(storage.has('test_key')).toBe(true);
  });

  it('should clear all storage', () => {
    storage.set('key1', 'value1');
    storage.set('key2', 'value2');
    storage.clear();
    expect(storage.get('key1')).toBeNull();
    expect(storage.get('key2')).toBeNull();
  });
});
