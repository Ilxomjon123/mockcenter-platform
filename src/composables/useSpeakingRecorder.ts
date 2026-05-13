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
  // Normalized mic input level (0..1) for UI animations. Updates each rAF tick.
  const level = ref(0)
  // Per-band levels (low/mid/high) so animations can react differently to bass vs treble — gives
  // the ripple a less synchronous, more organic feel than driving everything off one number.
  const lowLevel = ref(0)
  const midLevel = ref(0)
  const highLevel = ref(0)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let stream: MediaStream | null = null

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let rafId: number | null = null

  function startLevelMonitor(): void {
    if (!stream || analyser) return
    const AC: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined
    if (!AC) return

    try {
      audioContext = new AC()
      // Most browsers create AudioContext in 'suspended' state until a user gesture.
      // Without resume() the analyser returns silent buffers → animation looks static.
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => { /* ignore */ })
      }
      sourceNode = audioContext.createMediaStreamSource(stream)
      analyser = audioContext.createAnalyser()
      // Smaller FFT → cheaper + faster reaction. Lower smoothing → less inherent lag.
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.2
      sourceNode.connect(analyser)
      const timeBuffer = new Uint8Array(analyser.fftSize)
      const freqBuffer = new Uint8Array(analyser.frequencyBinCount)
      const sampleRate = audioContext.sampleRate

      // Frequency band boundaries (Hz) → bin indices.
      const binHz = sampleRate / 2 / analyser.frequencyBinCount
      const lowEnd = Math.max(1, Math.floor(300 / binHz))
      const midEnd = Math.max(lowEnd + 1, Math.floor(2000 / binHz))
      const highEnd = Math.min(analyser.frequencyBinCount, Math.max(midEnd + 1, Math.floor(6000 / binHz)))

      const smooth = (cur: number, next: number, attack: number, release: number): number => {
        const coef = next > cur ? attack : release
        return cur * (1 - coef) + next * coef
      }

      const shape = (x: number): number => Math.min(1, Math.pow(Math.max(0, x), 0.6) * 2.4)

      const tick = () => {
        if (!analyser) return

        // Overall envelope from time-domain RMS.
        analyser.getByteTimeDomainData(timeBuffer)
        let sumSq = 0
        for (let i = 0; i < timeBuffer.length; i++) {
          const v = (timeBuffer[i]! - 128) / 128
          sumSq += v * v
        }
        const rms = Math.sqrt(sumSq / timeBuffer.length)
        const noiseFloor = 0.015
        const overall = shape((Math.max(0, rms - noiseFloor)) / (1 - noiseFloor))
        // Snappy attack, gentle release — feels like real breath rather than a slow blob.
        level.value = smooth(level.value, overall, 0.7, 0.18)

        // Per-band energy from frequency-domain data.
        analyser.getByteFrequencyData(freqBuffer)
        let lowSum = 0
        for (let i = 1; i < lowEnd; i++) lowSum += freqBuffer[i]!
        let midSum = 0
        for (let i = lowEnd; i < midEnd; i++) midSum += freqBuffer[i]!
        let highSum = 0
        for (let i = midEnd; i < highEnd; i++) highSum += freqBuffer[i]!

        const lowAvg = lowSum / Math.max(1, lowEnd - 1) / 255
        const midAvg = midSum / Math.max(1, midEnd - lowEnd) / 255
        const highAvg = highSum / Math.max(1, highEnd - midEnd) / 255

        // Slightly different attack/release per band → rings don't move in lockstep.
        lowLevel.value = smooth(lowLevel.value, shape(lowAvg * 1.6), 0.55, 0.14)
        midLevel.value = smooth(midLevel.value, shape(midAvg * 1.6), 0.65, 0.18)
        highLevel.value = smooth(highLevel.value, shape(highAvg * 2.0), 0.78, 0.24)

        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    } catch {
      stopLevelMonitor()
    }
  }

  function stopLevelMonitor(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (sourceNode) {
      try { sourceNode.disconnect() } catch { /* ignore */ }
      sourceNode = null
    }
    if (analyser) {
      try { analyser.disconnect() } catch { /* ignore */ }
      analyser = null
    }
    if (audioContext) {
      try { void audioContext.close() } catch { /* ignore */ }
      audioContext = null
    }
    level.value = 0
    lowLevel.value = 0
    midLevel.value = 0
    highLevel.value = 0
  }

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
      startLevelMonitor()
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
    stopLevelMonitor()
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
    level,
    lowLevel,
    midLevel,
    highLevel,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    releaseStream,
  }
}
