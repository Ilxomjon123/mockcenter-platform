import { ref, computed, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { useAudioCache } from './useAudioCache'

export function useListeningAudio() {
  const listeningStore = useListeningStore()
  const audioCache = useAudioCache()

  // Audio refs storage
  const audioElements = ref<(HTMLAudioElement | null)[]>([])
  const visibleAudioRef = ref<HTMLAudioElement | null>(null)

  // Cached blob URLs
  const cachedUrls = ref<Map<string, string>>(new Map())

  // Loading state
  const isAudioLoading = ref(true)
  const loadedAudios = ref<Set<number>>(new Set())

  // Playback state - use store's hasStarted
  const isStarted = computed(() => listeningStore.hasStarted)
  const isAllAudiosFinished = ref(false)
  const isPlaying = ref(false)

  // Track if we need to restore time after load
  let shouldRestoreTime = false
  let pendingAutoPlay = false

  // Get all audio URLs from parts
  const audioUrls = computed(() => {
    if (!listeningStore.test?.parts) return []
    return [...listeningStore.test.parts]
      .sort((a, b) => a.order - b.order)
      .map((p) => p.file)
      .filter((url): url is string => !!url)
  })

  const totalAudios = computed(() => audioUrls.value.length)
  const loadedCount = computed(() => loadedAudios.value.size)
  const currentAudioIndex = computed(() => listeningStore.currentAudioIndex)
  const savedAudioTime = computed(() => listeningStore.currentAudioTime)

  // Set audio ref
  const setAudioRef = (el: HTMLAudioElement | null, index: number) => {
    if (el) {
      audioElements.value[index] = el
    }
  }

  // Get cached URL for original URL
  const getCachedUrl = (originalUrl: string): string => {
    return cachedUrls.value.get(originalUrl) || originalUrl
  }

  // Load current audio (internal)
  const loadCurrentAudio = () => {
    if (isAllAudiosFinished.value) return

    const originalUrl = audioUrls.value[currentAudioIndex.value]
    if (!originalUrl || !visibleAudioRef.value) return

    const url = getCachedUrl(originalUrl)
    visibleAudioRef.value.src = url
    shouldRestoreTime = savedAudioTime.value > 0
    visibleAudioRef.value.load()
  }

  // User clicks Play button - start playback
  const startPlayback = () => {
    listeningStore.setStarted(true)
    loadCurrentAudio()
  }

  // Cache and load all audio files
  const cacheAndLoadAudios = async () => {
    const urls = audioUrls.value
    if (urls.length === 0) return

    isAudioLoading.value = true
    loadedAudios.value = new Set()

    try {
      // Cache all audios and track progress
      const cached = await audioCache.cacheAllAudios(urls, (loaded, total) => {
        loadedAudios.value = new Set(Array.from({ length: loaded }, (_, i) => i))
      })

      cachedUrls.value = cached
      isAudioLoading.value = false

      // If user has already started (page refresh), auto-play
      if (listeningStore.hasStarted) {
        pendingAutoPlay = true
        loadCurrentAudio()
      }
    } catch (error) {
      console.error('Failed to cache audios:', error)
      isAudioLoading.value = false
    }
  }

  // Mark audio as loaded (for preload elements - now used as fallback)
  const onAudioLoaded = (index: number) => {
    loadedAudios.value.add(index)
  }

  const onAudioError = (index: number) => {
    console.error(`Audio ${index + 1} yuklanmadi`)
    loadedAudios.value.add(index)
  }

  // Handle audio can play - restore time and start playing
  const onAudioCanPlay = () => {
    if (!visibleAudioRef.value) return

    // Only play if user has started or pending auto-play
    if (!isStarted.value && !pendingAutoPlay) return

    if (shouldRestoreTime && savedAudioTime.value > 0) {
      visibleAudioRef.value.currentTime = savedAudioTime.value
      shouldRestoreTime = false
    }

    pendingAutoPlay = false
    visibleAudioRef.value.play().catch((err) => {
      console.log('Autoplay blocked:', err)
    })
  }

  // Save audio time periodically
  let lastSavedTime = 0
  const onAudioTimeUpdate = () => {
    if (!visibleAudioRef.value) return

    const currentTime = Math.floor(visibleAudioRef.value.currentTime)
    if (currentTime !== lastSavedTime && currentTime % 2 === 0) {
      lastSavedTime = currentTime
      listeningStore.setAudioTime(currentTime)
    }
  }

  // Handle audio ended - play next
  const onAudioEnded = () => {
    const nextIndex = currentAudioIndex.value + 1

    if (nextIndex < totalAudios.value) {
      listeningStore.setAudioIndex(nextIndex)
      loadCurrentAudio()
    } else {
      isAllAudiosFinished.value = true
      isPlaying.value = false
      alert("Barcha audiolar tugadi! Listening bo'limi yakunlandi.")
    }
  }

  const onAudioPlay = () => {
    isPlaying.value = true
  }

  const onAudioPause = () => {
    isPlaying.value = false
  }

  // Watch for test data to initialize
  watch(
    () => listeningStore.test,
    (newTest) => {
      if (newTest?.parts?.length) {
        const totalParts = newTest.parts.filter((p) => p.file).length
        if (currentAudioIndex.value >= totalParts && totalParts > 0) {
          isAllAudiosFinished.value = true
        } else {
          isAllAudiosFinished.value = false
        }

        // Start caching audio files
        cacheAndLoadAudios()
      }
    },
    { immediate: true }
  )

  return {
    // Refs
    audioElements,
    visibleAudioRef,

    // State
    isAudioLoading,
    isStarted,
    loadedCount,
    totalAudios,
    audioUrls,
    isPlaying,
    isAllAudiosFinished,

    // Methods
    setAudioRef,
    startPlayback,
    onAudioLoaded,
    onAudioError,
    onAudioCanPlay,
    onAudioTimeUpdate,
    onAudioEnded,
    onAudioPlay,
    onAudioPause,
  }
}
