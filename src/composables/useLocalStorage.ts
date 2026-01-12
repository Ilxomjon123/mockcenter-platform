/**
 * Shared localStorage utility for type-safe storage operations
 * Provides consistent error handling and serialization across the application
 */

export interface StorageOptions<T> {
  key: string
  defaultValue?: T
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
}

/**
 * Generic localStorage utility with type safety
 * @param key - localStorage key
 * @param defaultValue - Optional default value if nothing is stored
 * @returns Object with load, save, and remove methods
 */
export function useLocalStorage<T>(key: string, defaultValue?: T) {
  /**
   * Load value from localStorage
   * @returns The stored value or defaultValue if not found/error
   */
  const load = (): T | undefined => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        return JSON.parse(saved) as T
      }
    } catch (error) {
      console.error(`Error loading from localStorage (key: ${key}):`, error)
    }
    return defaultValue
  }

  /**
   * Save value to localStorage
   * @param value - Value to store
   */
  const save = (value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving to localStorage (key: ${key}):`, error)
    }
  }

  /**
   * Remove value from localStorage
   */
  const remove = (): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error)
    }
  }

  return {
    load,
    save,
    remove,
  }
}

/**
 * Specialized storage for primitive values (string, number, boolean)
 * Avoids JSON serialization for simple types
 */
export function useLocalStoragePrimitive(key: string, defaultValue?: string | number | boolean) {
  const load = (): string | number | boolean | undefined => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        if (typeof defaultValue === 'number') {
          const parsed = parseFloat(saved)
          return isNaN(parsed) ? defaultValue : parsed
        }
        if (typeof defaultValue === 'boolean') {
          return saved === 'true'
        }
        return saved
      }
    } catch (error) {
      console.error(`Error loading primitive from localStorage (key: ${key}):`, error)
    }
    return defaultValue
  }

  const save = (value: string | number | boolean): void => {
    try {
      localStorage.setItem(key, String(value))
    } catch (error) {
      console.error(`Error saving primitive to localStorage (key: ${key}):`, error)
    }
  }

  const remove = (): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing primitive from localStorage (key: ${key}):`, error)
    }
  }

  return {
    load,
    save,
    remove,
  }
}
