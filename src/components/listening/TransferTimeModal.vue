<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="modal-overlay">
        <div class="modal-content">
          <!-- Timer icon -->
          <div class="icon-container">
            <svg
              class="timer-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="#3b82f6" />
              <path
                d="M12 6v6l4 2"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <h2 class="modal-title">Audio Completed</h2>

          <p class="modal-description">
            The listening audio has finished. You now have <strong>2 minutes</strong> to review and
            complete your answers before moving to the next section.
          </p>

          <div class="info-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
              />
            </svg>
            <span
              >The timer will be displayed in the header. Make sure to complete all your answers
              before time runs out.</span
            >
          </div>

          <button class="start-button" @click="handleStart">
            Ok
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
}>()

const handleStart = () => {
  emit('start')
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
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.icon-container {
  margin-bottom: 24px;
}

.timer-icon {
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
  margin: 0 0 24px 0;
}

.modal-description strong {
  color: #3b82f6;
  font-weight: 600;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  border-radius: 12px;
  margin-bottom: 28px;
  text-align: left;
}

.info-box svg {
  width: 20px;
  height: 20px;
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 1px;
}

.info-box span {
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.start-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.start-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.start-button:active {
  transform: translateY(0);
}

.arrow-icon {
  width: 20px;
  height: 20px;
}

/* Transitions */
.modal-enter-active {
  animation: fadeIn 0.2s ease-out;
}

.modal-leave-active {
  animation: fadeOut 0.15s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
