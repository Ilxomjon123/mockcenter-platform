const DB_NAME = 'listening_audio_cache'
const DB_VERSION = 1
const STORE_NAME = 'audio_files'

interface CachedAudio {
  url: string
  blob: Blob
  timestamp: number
}

class AudioCacheDB {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' })
        }
      }
    })

    return this.initPromise
  }

  async get(url: string): Promise<CachedAudio | null> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async set(url: string, blob: Blob): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const data: CachedAudio = { url, blob, timestamp: Date.now() }
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

const audioCacheDB = new AudioCacheDB()

export function useAudioCache() {
  // Check if audio is cached
  const isCached = async (url: string): Promise<boolean> => {
    try {
      const cached = await audioCacheDB.get(url)
      return cached !== null
    } catch {
      return false
    }
  }

  // Get cached audio as blob URL
  const getCachedUrl = async (url: string): Promise<string | null> => {
    try {
      const cached = await audioCacheDB.get(url)
      if (cached) {
        return URL.createObjectURL(cached.blob)
      }
      return null
    } catch {
      return null
    }
  }

  // Download and cache audio
  const cacheAudio = async (url: string): Promise<string> => {
    try {
      // Check if already cached
      const cached = await audioCacheDB.get(url)
      if (cached) {
        return URL.createObjectURL(cached.blob)
      }

      // Download audio
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch audio')

      const blob = await response.blob()

      // Save to cache
      await audioCacheDB.set(url, blob)

      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to cache audio:', error)
      // Return original URL if caching fails
      return url
    }
  }

  // Cache multiple audio files
  const cacheAllAudios = async (
    urls: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Map<string, string>> => {
    const cachedUrls = new Map<string, string>()
    let loaded = 0

    for (const url of urls) {
      const cachedUrl = await cacheAudio(url)
      cachedUrls.set(url, cachedUrl)
      loaded++
      onProgress?.(loaded, urls.length)
    }

    return cachedUrls
  }

  // Clear all cached audio
  const clearCache = async (): Promise<void> => {
    try {
      await audioCacheDB.clear()
    } catch (error) {
      console.error('Failed to clear audio cache:', error)
    }
  }

  return {
    isCached,
    getCachedUrl,
    cacheAudio,
    cacheAllAudios,
    clearCache,
  }
}
