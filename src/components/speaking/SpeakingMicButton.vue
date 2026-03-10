<script setup lang="ts">
defineProps<{
  active?: boolean
}>()
</script>

<template>
  <div
    class="mic-button"
    :class="{ 'mic-button--active': active }"
  >
    <div v-if="active" class="mic-button__ring mic-button__ring--outer" />
    <div v-if="active" class="mic-button__ring mic-button__ring--middle" />
    <div v-if="active" class="mic-button__ring mic-button__ring--inner" />
    <div class="mic-button__circle">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
          fill="white"
        />
        <path
          d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
          fill="white"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.mic-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border: none;
  background: transparent;
  cursor: default;
  padding: 0;
  animation: micFadeIn 0.4s ease;
}

@keyframes micFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mic-button__circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  transition: transform 0.2s;
}

.mic-button--active .mic-button__circle {
  animation: mic-pulse 1.5s ease-in-out infinite;
}

.mic-button__ring {
  position: absolute;
  border-radius: 50%;
}

.mic-button__ring--outer {
  width: 160px;
  height: 160px;
  background: rgba(239, 68, 68, 0.08);
  z-index: 1;
  animation: ring-expand 1.5s ease-in-out infinite;
}

.mic-button__ring--middle {
  width: 136px;
  height: 136px;
  background: rgba(239, 68, 68, 0.15);
  z-index: 2;
  animation: ring-expand 1.5s ease-in-out infinite 0.2s;
}

.mic-button__ring--inner {
  width: 116px;
  height: 116px;
  background: rgba(239, 68, 68, 0.25);
  z-index: 3;
  animation: ring-expand 1.5s ease-in-out infinite 0.4s;
}

@keyframes mic-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@keyframes ring-expand {
  0%, 100% { transform: scale(0.95); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 1; }
}

@media (max-width: 768px) {
  .mic-button {
    width: 120px;
    height: 120px;
  }

  .mic-button__circle {
    width: 72px;
    height: 72px;
  }

  .mic-button__circle svg {
    width: 36px;
    height: 36px;
  }

  .mic-button__ring--outer {
    width: 120px;
    height: 120px;
  }

  .mic-button__ring--middle {
    width: 100px;
    height: 100px;
  }

  .mic-button__ring--inner {
    width: 88px;
    height: 88px;
  }
}

@media (max-width: 480px) {
  .mic-button {
    width: 100px;
    height: 100px;
  }

  .mic-button__circle {
    width: 60px;
    height: 60px;
  }

  .mic-button__circle svg {
    width: 28px;
    height: 28px;
  }

  .mic-button__ring--outer {
    width: 100px;
    height: 100px;
  }

  .mic-button__ring--middle {
    width: 84px;
    height: 84px;
  }

  .mic-button__ring--inner {
    width: 72px;
    height: 72px;
  }
}
</style>
