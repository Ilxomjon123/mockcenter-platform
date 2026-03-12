import { ref, onUnmounted } from 'vue'

/**
 * Composable for continuous audio recording using MediaRecorder API.
 * Uses pause/resume to create a single combined audio file for the entire exam.
 * Includes mobile-specific workarounds for iOS Safari and Android browsers.
 */
export function useSpeakingRecorder() {
  const isRecording = ref(false)
  const hasPermission = ref(false)
  const permissionError = ref('')

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let stream: MediaStream | null = null

  /**
   * Check if pause/resume is supported (not available on some mobile browsers).
   * Falls back to stop/start approach if not supported.
   */
  let supportsPauseResume = true

  /**
   * Detect if MediaRecorder API is available at all.
   */
  function isMediaRecorderSupported(): boolean {
    return typeof MediaRecorder !== 'undefined'
  }

  async function requestPermission(): Promise<boolean> {
    if (!isMediaRecorderSupported()) {
      permissionError.value = 'Your browser does not support audio recording. Please use a modern browser (Chrome, Safari 14.3+, or Firefox).'
      return false
    }

    try {
      // On mobile, simpler audio constraints work more reliably
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

      const audioConstraints: MediaTrackConstraints = isMobile
        ? { echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }

      stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      hasPermission.value = true
      permissionError.value = ''
      return true
    } catch (error) {
      hasPermission.value = false
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          permissionError.value = 'Microphone access denied. Please allow microphone access in your browser settings.'
        } else if (error.name === 'NotFoundError') {
          permissionError.value = 'No microphone found. Please connect a microphone and try again.'
        } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
          permissionError.value = 'Microphone is in use by another app. Please close other apps using the microphone and try again.'
        } else {
          permissionError.value = `Microphone error: ${error.message}`
        }
      } else {
        permissionError.value = 'Failed to access microphone'
      }
      return false
    }
  }

  /**
   * Get the best supported MIME type for recording.
   */
  function getSupportedMimeType(): string | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return undefined // Let the browser choose
  }

  /**
   * Start the continuous recording session (called once at exam start).
   */
  async function startRecording(): Promise<boolean> {
    if (!isMediaRecorderSupported()) return false
    if (mediaRecorder && mediaRecorder.state !== 'inactive') return false

    if (!stream) {
      const granted = await requestPermission()
      if (!granted) return false
    }

    if (!stream) return false

    audioChunks = []

    const mimeType = getSupportedMimeType()

    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
    } catch {
      try {
        mediaRecorder = new MediaRecorder(stream)
      } catch {
        permissionError.value = 'Failed to start audio recording. Please try a different browser.'
        return false
      }
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    // Some mobile browsers don't support timeslice parameter — use it only if safe
    try {
      mediaRecorder.start(100)
    } catch {
      mediaRecorder.start()
    }

    // Test if pause/resume is available
    try {
      if (typeof mediaRecorder.pause !== 'function' || typeof mediaRecorder.resume !== 'function') {
        supportsPauseResume = false
      }
    } catch {
      supportsPauseResume = false
    }

    isRecording.value = true
    return true
  }

  /**
   * Pause recording (between questions/sections). Data is preserved.
   * On browsers without pause support, recording continues (audio will include silence).
   */
  function pauseRecording(): void {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return

    if (supportsPauseResume) {
      try {
        mediaRecorder.pause()
      } catch {
        // pause not supported — keep recording
        supportsPauseResume = false
      }
    }
    isRecording.value = false
  }

  /**
   * Resume recording (when next question starts).
   */
  function resumeRecording(): void {
    if (!mediaRecorder) return

    if (supportsPauseResume && mediaRecorder.state === 'paused') {
      try {
        mediaRecorder.resume()
      } catch {
        supportsPauseResume = false
      }
    }
    isRecording.value = true
  }

  /**
   * Stop recording entirely and return the combined audio Blob.
   */
  function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(new Blob([], { type: 'audio/webm' }))
        return
      }

      // Safety timeout in case onstop never fires (some mobile browsers)
      const safetyTimer = setTimeout(() => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(audioChunks, { type: mimeType })
        audioChunks = []
        isRecording.value = false
        resolve(blob)
      }, 3000)

      mediaRecorder.onstop = () => {
        clearTimeout(safetyTimer)
        const mimeType = mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(audioChunks, { type: mimeType })
        audioChunks = []
        isRecording.value = false
        resolve(blob)
      }

      // If paused, resume briefly to flush any buffered data
      if (mediaRecorder.state === 'paused') {
        try {
          mediaRecorder.resume()
        } catch {
          // ignore
        }
      }
      mediaRecorder.stop()
    })
  }

  function releaseStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
    mediaRecorder = null
    isRecording.value = false
  }

  onUnmounted(() => {
    releaseStream()
  })

  return {
    isRecording,
    hasPermission,
    permissionError,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    releaseStream,
  }
}
