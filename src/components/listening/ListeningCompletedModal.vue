<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Checkmark icon -->
      <div class="icon-container">
        <svg class="checkmark-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#10b981" />
          <path d="M8 12l2.5 2.5L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h2 class="modal-title">Listening Section Completed</h2>

      <p class="modal-description">
        You have successfully completed the Listening section.
        Click the button below to proceed to the Reading section.
      </p>

      <div class="button-group">
        <button v-if="showBackButton" class="back-button" @click="goBack">
          <svg class="arrow-icon back" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>

        <button class="continue-button" @click="goToReading">
          Continue to Reading
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'

defineProps<{
  isVisible: boolean
}>()

const router = useRouter()
const listeningStore = useListeningStore()
const readingStore = useReadingStore()

const showBackButton = computed(() => listeningStore.isManualSubmit)

const goBack = () => {
  listeningStore.setCompleted(false)
}

const goToReading = () => {
  // Set timer start time when transitioning to Reading section
  readingStore.setStartTime(Date.now())
  router.push({ name: 'reading' })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 48px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.icon-container {
  margin-bottom: 24px;
}

.checkmark-icon {
  width: 80px;
  height: 80px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
}

.modal-description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
}

.continue-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.continue-button:hover {
  background: #2563eb;
}

.arrow-icon {
  width: 20px;
  height: 20px;
}

.arrow-icon.back {
  transform: scaleX(1);
}
</style>
