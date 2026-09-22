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

  async delete(url: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(url)

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

// Anything smaller than this cannot be a listening recording (an HTML error or
// SPA fallback page easily passes a naive "response.ok" check).
const MIN_AUDIO_BYTES = 1024

const isAudioContentType = (type: string): boolean => {
  const t = type.toLowerCase().split(';')[0]!.trim()
  return (
    t.startsWith('audio/') ||
    t.startsWith('video/') || // mp4/webm/ogg containers holding audio
    t === 'application/octet-stream' ||
    t === 'binary/octet-stream' ||
    t === 'application/ogg'
  )
}

/** Sniff the first bytes: an HTML/text page (SPA fallback, error page) is never audio. */
const looksLikeText = async (blob: Blob): Promise<boolean> => {
  try {
    const head = (await blob.slice(0, 64).text()).trimStart().toLowerCase()
    return head.startsWith('<') || head.startsWith('{')
  } catch {
    return false
  }
}

const isUsableAudioBlob = async (blob: Blob, contentType: string): Promise<boolean> => {
  if (blob.size < MIN_AUDIO_BYTES) return false
  if (contentType && !isAudioContentType(contentType)) return false
  if (await looksLikeText(blob)) return false
  return true
}

/**
 * The URL to download from. Audio URLs are absolute (the backend resolves
 * /storage paths against APP_URL), so they are fetched as given. Only in local
 * development, a /storage URL on a loopback backend (e.g. 127.0.0.1:8001) is
 * routed through Vite's /storage proxy to avoid CORS.
 */
const resolveFetchUrl = (url: string): string => {
  if (!import.meta.env.DEV) return url
  try {
    const parsed = new URL(url, window.location.href)
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    if (isLoopback && parsed.origin !== window.location.origin && parsed.pathname.startsWith('/storage/')) {
      return parsed.pathname + parsed.search
    }
  } catch {
    // fall through
  }
  return url
}

export function useAudioCache() {
  /** Cached entry for a URL, purging entries that are not real audio (e.g. a cached text/html page). */
  const getValidEntry = async (url: string) => {
    const cached = await audioCacheDB.get(url)
    if (!cached) return null
    if (!(await isUsableAudioBlob(cached.blob, cached.blob.type))) {
      await audioCacheDB.delete(url).catch(() => undefined)
      return null
    }
    return cached
  }

  // Check if audio is cached
  const isCached = async (url: string): Promise<boolean> => {
    try {
      return (await getValidEntry(url)) !== null
    } catch {
      return false
    }
  }

  // Get cached audio as blob URL
  const getCachedUrl = async (url: string): Promise<string | null> => {
    try {
      const cached = await getValidEntry(url)
      return cached ? URL.createObjectURL(cached.blob) : null
    } catch {
      return null
    }
  }

  // Download and cache audio
  const cacheAudio = async (url: string): Promise<string> => {
    try {
      // Check if already cached
      const cached = await getValidEntry(url)
      if (cached) {
        return URL.createObjectURL(cached.blob)
      }

      // Download audio
      const response = await fetch(resolveFetchUrl(url))
      if (!response.ok) throw new Error(`Failed to fetch audio (HTTP ${response.status})`)

      const contentType = response.headers.get('content-type') || ''
      const blob = await response.blob()
      if (!(await isUsableAudioBlob(blob, contentType))) {
        throw new Error(`Not an audio response (${contentType || 'unknown type'}, ${blob.size} bytes)`)
      }

      // Save to cache
      await audioCacheDB.set(url, blob)

      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to cache audio:', error)
      // Let the <audio> element stream the original URL directly
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
