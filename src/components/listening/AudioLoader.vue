<template>
  <div v-if="isVisible" class="audio-loader-overlay">
    <!-- Loading state -->
    <div v-if="isLoading" class="loader-content">
      <div class="spinner"></div>
      <p class="loader-text">Loading... ({{ loadedCount }}/{{ totalAudios }})</p>
    </div>

    <!-- Ready to play state -->
    <div v-else class="ready-content">
      <!-- Headphone icon -->
      <svg class="headphone-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 19C21 20.1046 20.1046 21 19 21H18C16.8954 21 16 20.1046 16 19V16C16 14.8954 16.8954 14 18 14H21V19Z" fill="currentColor"/>
        <path d="M3 19C3 20.1046 3.89543 21 5 21H6C7.10457 21 8 20.1046 8 19V16C8 14.8954 7.10457 14 6 14H3V19Z" fill="currentColor"/>
      </svg>

      <p class="instruction-text">
        You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
      </p>

      <p class="action-text">To continue, click Play.</p>

      <button class="play-button" @click="$emit('play')">
        <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
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

// Only show overlay if user hasn't started yet (first time visit)
// On refresh (hasStarted=true), never show loader
const isVisible = computed(() => !props.isStarted)
</script>

<style scoped>
.audio-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Loading state */
.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 16px;
  color: #ffffff;
  margin: 0;
}

/* Ready to play state */
.ready-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
  padding: 0 24px;
}

.headphone-icon {
  width: 120px;
  height: 120px;
  color: #ffffff;
  margin-bottom: 32px;
}

.instruction-text {
  font-size: 18px;
  color: #ffffff;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.action-text {
  font-size: 18px;
  color: #ffffff;
  font-weight: 500;
  margin: 0 0 24px 0;
}

.play-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: #1f2937;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.play-button:hover {
  background: #111827;
}

.play-icon {
  width: 24px;
  height: 24px;
}
</style>
