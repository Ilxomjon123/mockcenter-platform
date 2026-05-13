<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  active?: boolean
  // Overall mic level (0..1) — drives the central mic capsule scale.
  level?: number
  // Per-band levels — each ring follows one band so they breathe out of sync.
  low?: number
  mid?: number
  high?: number
}>(), {
  active: false,
  level: 0,
  low: 0,
  mid: 0,
  high: 0,
})

const clamp01 = (v: number): number => {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

// Idle motion: drives a continuous animated "time" value so even in silence the rings
// drift gently. Voice level is added on top so it never looks static.
const tNow = ref(0)
let rafId: number | null = null
const startedAt = performance.now()

function tick(now: number): void {
  tNow.value = (now - startedAt) / 1000
  rafId = requestAnimationFrame(tick)
}

watch(() => props.active, (now) => {
  if (now && rafId === null) {
    rafId = requestAnimationFrame(tick)
  } else if (!now && rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
    tNow.value = 0
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

const lvl = computed(() => clamp01(props.level))
const lowLvl = computed(() => clamp01(props.low))
const midLvl = computed(() => clamp01(props.mid))
const highLvl = computed(() => clamp01(props.high))

// Organic blob border-radius: 4 percentages per axis morph over time. Voice level widens
// the morph amplitude so loud speech distorts the shape more — quiet speech stays nearly round.
function blobRadius(t: number, voice: number, seed: number): string {
  const amp = 10 + voice * 28
  const f = (i: number) => 50 + Math.sin(t * (0.55 + i * 0.11) + seed + i * 1.3) * amp
  return `${f(1).toFixed(2)}% ${f(2).toFixed(2)}% ${f(3).toFixed(2)}% ${f(4).toFixed(2)}% / ${f(5).toFixed(2)}% ${f(6).toFixed(2)}% ${f(7).toFixed(2)}% ${f(8).toFixed(2)}%`
}

// Central capsule: bigger amplitude than before → noticeably reactive even at moderate volumes.
const circleStyle = computed(() => {
  if (!props.active) return { transform: 'scale(1)', borderRadius: '50%' }
  const t = tNow.value
  const idleScale = Math.sin(t * 1.8) * 0.5 + 0.5 // 0..1
  const scale = 1 + idleScale * 0.05 + lvl.value * 0.28
  return {
    transform: `scale(${scale.toFixed(3)})`,
    borderRadius: blobRadius(t * 1.4, lvl.value * 0.7, 0.0),
  }
})

const ringStyle = (bandLevel: number, scaleAmp: number, phase: number, baseOpacity: number, seed: number) => {
  const t = tNow.value
  // Each ring has its own slow drift independent of voice — keeps motion alive in silence.
  const drift = Math.sin(t * (0.9 + phase * 0.4) + phase * Math.PI * 2) * 0.5 + 0.5
  const scale = 0.78 + drift * 0.08 + bandLevel * scaleAmp
  const opacity = baseOpacity + bandLevel * (1 - baseOpacity) * 0.9 + drift * 0.08
  return {
    transform: `scale(${scale.toFixed(3)})`,
    opacity: Math.min(1, opacity).toFixed(3),
    borderRadius: blobRadius(t + seed, bandLevel * 0.85 + 0.15, seed),
  }
}

// Outer ← low (bass), middle ← mid, inner ← high (treble) → rings react to different sounds.
const outerRingStyle = computed(() => ringStyle(lowLvl.value, 0.7, 0.0, 0.1, 1.7))
const middleRingStyle = computed(() => ringStyle(midLvl.value, 0.6, 0.33, 0.18, 3.4))
const innerRingStyle = computed(() => ringStyle(highLvl.value, 0.5, 0.66, 0.28, 5.1))
</script>

<template>
  <div
    class="mic-button"
    :class="{ 'mic-button--active': active }"
  >
    <div
      v-if="active"
      class="mic-button__ring mic-button__ring--outer"
      :style="outerRingStyle"
    />
    <div
      v-if="active"
      class="mic-button__ring mic-button__ring--middle"
      :style="middleRingStyle"
    />
    <div
      v-if="active"
      class="mic-button__ring mic-button__ring--inner"
      :style="innerRingStyle"
    />
    <div class="mic-button__circle" :style="circleStyle">
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
  will-change: transform;
}

.mic-button__ring {
  position: absolute;
  border-radius: 50%;
  will-change: transform, opacity;
}

.mic-button__ring--outer {
  width: 160px;
  height: 160px;
  background: rgba(239, 68, 68, 0.1);
  z-index: 1;
}

.mic-button__ring--middle {
  width: 136px;
  height: 136px;
  background: rgba(239, 68, 68, 0.18);
  z-index: 2;
}

.mic-button__ring--inner {
  width: 116px;
  height: 116px;
  background: rgba(239, 68, 68, 0.28);
  z-index: 3;
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
