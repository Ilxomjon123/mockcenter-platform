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

// Debounce timers cache
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Generic localStorage utility with type safety and debounced saving
 * @param key - localStorage key
 * @param defaultValue - Optional default value if nothing is stored
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Object with load, save, saveImmediate, and remove methods
 */
export function useLocalStorage<T>(key: string, defaultValue?: T, debounceMs: number = 300) {
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
   * Save value to localStorage immediately (no debounce)
   * @param value - Value to store
   */
  const saveImmediate = (value: T): void => {
    // Clear any pending debounced save
    const existingTimer = debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
      debounceTimers.delete(key)
    }

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving to localStorage (key: ${key}):`, error)
    }
  }

  /**
   * Save value to localStorage with debounce
   * @param value - Value to store
   */
  const save = (value: T): void => {
    // Clear existing timer for this key
    const existingTimer = debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new debounced save
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error saving to localStorage (key: ${key}):`, error)
      }
      debounceTimers.delete(key)
    }, debounceMs)

    debounceTimers.set(key, timer)
  }

  /**
   * Remove value from localStorage
   */
  const remove = (): void => {
    // Clear any pending save
    const existingTimer = debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
      debounceTimers.delete(key)
    }

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error)
    }
  }

  return {
    load,
    save,
    saveImmediate,
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
