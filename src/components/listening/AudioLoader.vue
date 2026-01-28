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
import { computed } from 'vue'

const props = defineProps<{
  isLoading: boolean
  loadedCount: number
  totalAudios: number
  isStarted: boolean
}>()

defineEmits<{
  play: []
}>()

// Only show overlay if:
// 1. User hasn't started yet (first time visit)
// 2. There are audios to load (totalAudios > 0)
// On refresh (hasStarted=true), never show loader
const isVisible = computed(() => !props.isStarted && props.totalAudios > 0)
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
  background: rgba(55, 65, 81, 0.9);
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
  margin: 0 0 16px 0;
}

.play-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #374151;
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
