import { ref, computed, watch, getCurrentInstance, onBeforeUnmount } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { useAudioCache } from './useAudioCache'

export function useListeningAudio() {
  const listeningStore = useListeningStore()
  const audioCache = useAudioCache()

  // Audio ref
  const visibleAudioRef = ref<HTMLAudioElement | null>(null)

  // Cached blob URLs
  const cachedUrls = ref<Map<string, string>>(new Map())

  // Loading state
  const isAudioLoading = ref(true)
  const loadedAudios = ref<Set<number>>(new Set())

  // Playback state
  const isStarted = computed(() => listeningStore.hasStarted)
  let isAllAudiosFinished = false
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

  // Get cached URL for original URL
  const getCachedUrl = (originalUrl: string): string => {
    return cachedUrls.value.get(originalUrl) || originalUrl
  }

  // Load current audio (internal)
  const loadCurrentAudio = () => {
    if (isAllAudiosFinished) return

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
      const cached = await audioCache.cacheAllAudios(urls, (loaded) => {
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
      console.log('Autoplay deferred until user interaction:', err)
      armResumeOnGesture()
    })
  }

  // Autoplay after a page refresh is blocked until the user interacts with the
  // page. Resume on the first gesture. Only one set of listeners is ever armed,
  // they are all removed together after the first gesture, and on unmount.
  // Not every event grants user activation on every platform (a touch pointerdown
  // does not; its pointerup/touchend does), so listen to several and re-arm if
  // play() is still rejected.
  const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const
  let gestureArmed = false

  const disarmResumeOnGesture = () => {
    if (!gestureArmed) return
    gestureArmed = false
    GESTURE_EVENTS.forEach((type) => window.removeEventListener(type, resumeOnGesture, true))
  }

  function resumeOnGesture() {
    disarmResumeOnGesture()
    const audio = visibleAudioRef.value
    if (audio && audio.paused && isStarted.value && !isAllAudiosFinished) {
      audio.play().catch((err) => {
        console.warn('Playback request rejected:', err)
        armResumeOnGesture()
      })
    }
  }

  function armResumeOnGesture() {
    if (gestureArmed) return
    gestureArmed = true
    GESTURE_EVENTS.forEach((type) => window.addEventListener(type, resumeOnGesture, true))
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(disarmResumeOnGesture)
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

  // Track if all audios finished (for showing transfer time modal)
  const allAudiosFinished = ref(false)

  // Handle audio ended - play next
  const onAudioEnded = () => {
    const nextIndex = currentAudioIndex.value + 1

    if (nextIndex < totalAudios.value) {
      listeningStore.setAudioIndex(nextIndex)
      loadCurrentAudio()
    } else {
      isAllAudiosFinished = true
      // Don't set completed directly - show transfer time modal first
      // Only set allAudiosFinished flag if not already in transfer time or completed
      if (!listeningStore.isInTransferTime && !listeningStore.isCompleted) {
        allAudiosFinished.value = true
      }
    }
  }

  const isPlaying = ref(false)

  const onAudioPlay = () => {
    isPlaying.value = true
    disarmResumeOnGesture()
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
        isAllAudiosFinished = currentAudioIndex.value >= totalParts && totalParts > 0
        cacheAndLoadAudios()
      }
    },
    { immediate: true }
  )

  return {
    visibleAudioRef,
    isAudioLoading,
    isStarted,
    isPlaying,
    loadedCount,
    totalAudios,
    allAudiosFinished,
    startPlayback,
    onAudioCanPlay,
    onAudioTimeUpdate,
    onAudioEnded,
    onAudioPlay,
    onAudioPause,
  }
}
