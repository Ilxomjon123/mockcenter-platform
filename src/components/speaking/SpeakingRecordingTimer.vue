<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  seconds: number
}>()

const display = computed(() => {
  const mins = Math.floor(props.seconds / 60)
  const secs = props.seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const isLow = computed(() => props.seconds <= 5)
</script>

<template>
  <div class="recording-timer" :class="{ 'recording-timer--low': isLow }">
    {{ display }}
  </div>
</template>

<style scoped>
.recording-timer {
  font-size: 72px;
  font-weight: 800;
  color: #1a1a1a;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
  animation: timerFadeIn 0.4s ease;
}

@keyframes timerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.recording-timer--low {
  color: #ef4444;
  animation: timer-pulse 1s ease-in-out infinite;
}

@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .recording-timer {
    font-size: 52px;
  }
}

@media (max-width: 480px) {
  .recording-timer {
    font-size: 40px;
  }
}
</style>
