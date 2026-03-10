import { ref, onUnmounted } from 'vue'

/**
 * Composable for continuous audio recording using MediaRecorder API.
 * Uses pause/resume to create a single combined audio file for the entire exam.
 */
export function useSpeakingRecorder() {
  const isRecording = ref(false)
  const hasPermission = ref(false)
  const permissionError = ref('')

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let stream: MediaStream | null = null

  async function requestPermission(): Promise<boolean> {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })
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
   * Start the continuous recording session (called once at exam start).
   */
  async function startRecording(): Promise<boolean> {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') return false

    if (!stream) {
      const granted = await requestPermission()
      if (!granted) return false
    }

    if (!stream) return false

    audioChunks = []

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType })
    } catch {
      mediaRecorder = new MediaRecorder(stream)
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.start(100)
    isRecording.value = true
    return true
  }

  /**
   * Pause recording (between questions/sections). Data is preserved.
   */
  function pauseRecording(): void {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      isRecording.value = false
    }
  }

  /**
   * Resume recording (when next question starts).
   */
  function resumeRecording(): void {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      isRecording.value = true
    }
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

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(audioChunks, { type: mimeType })
        audioChunks = []
        isRecording.value = false
        resolve(blob)
      }

      // If paused, resume briefly to flush any buffered data
      if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume()
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
