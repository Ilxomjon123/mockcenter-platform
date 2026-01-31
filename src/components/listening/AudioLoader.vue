<template>
  <div v-if="isVisible" class="audio-loader-overlay">
    <!-- Loading state -->
    <div v-if="isLoading" class="loader-content">
      <div class="spinner"></div>
      <h2 class="loader-title">Your test will begin shortly</h2>
      <p class="loader-subtitle">Please wait</p>
    </div>

    <!-- Ready to play state -->
    <div v-else class="ready-content">
      <!-- Headphone icon -->
      <svg
        class="headphone-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 18V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M21 19C21 20.1046 20.1046 21 19 21H18C16.8954 21 16 20.1046 16 19V16C16 14.8954 16.8954 14 18 14H21V19Z"
          fill="currentColor"
        />
        <path
          d="M3 19C3 20.1046 3.89543 21 5 21H6C7.10457 21 8 20.1046 8 19V16C8 14.8954 7.10457 14 6 14H3V19Z"
          fill="currentColor"
        />
      </svg>

      <p class="instruction-text">
        You will be listening to an audio clip during this test. You will not be permitted to pause
        or rewind the audio while answering the questions.
      </p>

      <p class="action-text">To continue, click Play.</p>

      <!-- Speaker test section -->
      <div class="speaker-test">
        <p class="speaker-test-label">Test your speakers/headphones:</p>
        <button class="test-button" @click="playTestSound" :disabled="isTestPlaying">
          <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
          {{ isTestPlaying ? 'Playing...' : 'Test Sound' }}
        </button>
        <div v-if="isTestPlaying" class="progress-bar">
          <div class="progress-fill" :style="{ width: testProgress + '%' }"></div>
        </div>
      </div>

      <button class="play-button" @click="$emit('play')">
        <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Play
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  isLoading: boolean
  loadedCount: number
  totalAudios: number
  isStarted: boolean
}>()

defineEmits<{
  play: []
}>()

const isTestPlaying = ref(false)
const testProgress = ref(0)

// Only show overlay if:
// 1. User hasn't started yet (first time visit)
// 2. There are audios to load (totalAudios > 0)
// On refresh (hasStarted=true), never show loader
const isVisible = computed(() => !props.isStarted && props.totalAudios > 0)

// Play test sound - melodic sequence
const playTestSound = () => {
  if (isTestPlaying.value) return

  isTestPlaying.value = true
  testProgress.value = 0

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const duration = 3 // 3 seconds total

    // Progress bar animation
    const progressInterval = setInterval(() => {
      testProgress.value += 2
      if (testProgress.value >= 100) {
        clearInterval(progressInterval)
      }
    }, duration * 10)

    // Create master gain for overall volume control
    const masterGain = audioContext.createGain()
    masterGain.connect(audioContext.destination)
    masterGain.gain.value = 0.3

    // Melodic sequence: C5 - E5 - G5 - C6 (C major chord arpeggio)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.6 }, // C5
      { freq: 659.25, start: 0.6, duration: 0.6 }, // E5
      { freq: 783.99, start: 1.2, duration: 0.6 }, // G5
      { freq: 1046.5, start: 1.8, duration: 1.2 }, // C6 (longer)
    ]

    notes.forEach((note) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(masterGain)

      oscillator.frequency.value = note.freq
      oscillator.type = 'sine'

      const startTime = audioContext.currentTime + note.start
      const endTime = startTime + note.duration

      // Smooth envelope
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(1, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime - 0.05)

      oscillator.start(startTime)
      oscillator.stop(endTime)
    })

    // Add subtle harmony
    const harmonyOsc = audioContext.createOscillator()
    const harmonyGain = audioContext.createGain()

    harmonyOsc.connect(harmonyGain)
    harmonyGain.connect(masterGain)

    harmonyOsc.frequency.value = 261.63 // C4 (octave below)
    harmonyOsc.type = 'triangle'

    const harmonyStart = audioContext.currentTime
    const harmonyEnd = harmonyStart + duration

    harmonyGain.gain.setValueAtTime(0, harmonyStart)
    harmonyGain.gain.linearRampToValueAtTime(0.3, harmonyStart + 0.1)
    harmonyGain.gain.exponentialRampToValueAtTime(0.01, harmonyEnd - 0.2)

    harmonyOsc.start(harmonyStart)
    harmonyOsc.stop(harmonyEnd)

    setTimeout(() => {
      isTestPlaying.value = false
      testProgress.value = 0
      clearInterval(progressInterval)
      audioContext.close()
    }, duration * 1000)
  } catch (error) {
    console.error('Error playing test sound:', error)
    isTestPlaying.value = false
    testProgress.value = 0
  }
}
</script>

<style scoped>
.audio-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Loading state */
.loader-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #1f2937;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-align: center;
}

.loader-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  text-align: center;
}

/* Ready to play state */
.ready-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(55, 65, 81);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}

.headphone-icon {
  width: 80px;
  height: 80px;
  color: #ffffff;
  margin-bottom: 16px;
}

.instruction-text {
  font-size: 14px;
  color: #ffffff;
  line-height: 1.5;
  margin: 0 0 16px 0;
  max-width: 680px;
}

.action-text {
  font-size: 14px;
  color: #ffffff;
  margin: 0 0 24px 0;
}

/* Speaker test section */
.speaker-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  min-width: 250px;
}

.speaker-test-label {
  font-size: 13px;
  color: #e5e7eb;
  margin: 0;
}

.test-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.volume-icon {
  width: 16px;
  height: 16px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.1s linear;
  border-radius: 2px;
}

.play-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #19191a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.play-button:hover {
  background: #1f2937;
}

.play-icon {
  width: 18px;
  height: 18px;
}
</style>
