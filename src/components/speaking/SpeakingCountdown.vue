<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  total: number
  size?: 'small' | 'large'
}>()

const sizeConfig = computed(() => {
  if (props.size === 'large') return { dim: 160, stroke: 6, fontSize: 56 }
  return { dim: 110, stroke: 5, fontSize: 44 }
})

const radius = computed(() => (sizeConfig.value.dim - sizeConfig.value.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const progress = computed(() => {
  const pct = props.value / props.total
  return circumference.value * (1 - pct)
})

const displayValue = computed(() => String(props.value).padStart(2, '0'))
const isLow = computed(() => props.value <= 3 && props.value > 0)
</script>

<template>
  <div
    class="countdown"
    :class="[`countdown--${size ?? 'small'}`, { 'countdown--low': isLow }]"
    :style="{ width: sizeConfig.dim + 'px', height: sizeConfig.dim + 'px' }"
  >
    <svg :width="sizeConfig.dim" :height="sizeConfig.dim" class="countdown__svg">
      <circle
        class="countdown__track"
        :cx="sizeConfig.dim / 2"
        :cy="sizeConfig.dim / 2"
        :r="radius"
        fill="none"
        :stroke-width="sizeConfig.stroke"
      />
      <circle
        class="countdown__progress"
        :cx="sizeConfig.dim / 2"
        :cy="sizeConfig.dim / 2"
        :r="radius"
        fill="none"
        :stroke-width="sizeConfig.stroke"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="progress"
        stroke-linecap="round"
      />
    </svg>
    <span class="countdown__value" :style="{ fontSize: sizeConfig.fontSize + 'px' }">
      {{ displayValue }}
    </span>
  </div>
</template>

<style scoped>
.countdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: countdownFadeIn 0.4s ease;
}

@keyframes countdownFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.countdown__svg {
  transform: rotate(-90deg);
  position: absolute;
}

.countdown__track {
  stroke: #e5e7eb;
}

.countdown__progress {
  stroke: #1e3a5f;
  transition: stroke-dashoffset 1s linear;
}

.countdown--low .countdown__progress {
  stroke: #ef4444;
}

.countdown__value {
  font-weight: 800;
  color: #1a1a1a;
  z-index: 1;
  font-variant-numeric: tabular-nums;
}

.countdown--low .countdown__value {
  color: #ef4444;
}

@media (max-width: 480px) {
  .countdown--small {
    transform: scale(0.75);
  }

  .countdown--large {
    transform: scale(0.7);
  }
}
</style>
