<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'
import { useSpeakingStore } from '@/stores/speakingStore'

const router = useRouter()
const listeningStore = useListeningStore()
const readingStore = useReadingStore()
const writingStore = useWritingStore()
const speakingStore = useSpeakingStore()

const sections = computed(() => [
  {
    key: 'listening',
    label: 'Listening',
    icon: '🎧',
    available: !!listeningStore.test?.parts?.length,
    route: '/listening',
  },
  {
    key: 'reading',
    label: 'Reading',
    icon: '📖',
    available: !!readingStore.test?.parts?.length,
    route: '/reading',
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: '✍️',
    available: !!writingStore.test?.parts?.length,
    route: '/writing',
  },
  {
    key: 'speaking',
    label: 'Speaking',
    icon: '🗣️',
    available: !!speakingStore.test?.parts?.length,
    route: '/speaking',
  },
])

function selectSection(section: (typeof sections.value)[0]) {
  if (section.available) {
    router.push(section.route)
  }
}
</script>

<template>
  <div class="section-select">
    <div class="section-select__header">
      <h1 class="section-select__title">Select a Section</h1>
      <p class="section-select__subtitle">Choose which section you would like to start with</p>
    </div>

    <div class="section-select__grid">
      <button
        v-for="section in sections"
        :key="section.key"
        class="section-card"
        :class="{
          'section-card--disabled': !section.available,
          'section-card--available': section.available,
        }"
        :disabled="!section.available"
        @click="selectSection(section)"
      >
        <span class="section-card__icon">{{ section.icon }}</span>
        <span class="section-card__label">{{ section.label }}</span>
        <span v-if="!section.available" class="section-card__unavailable">Not available</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.section-select {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f8f9fa;
}

.section-select__header {
  text-align: center;
  margin-bottom: 48px;
}

.section-select__title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.section-select__subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.section-select__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 520px;
  width: 100%;
}

.section-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.section-card--available:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.15);
  transform: translateY(-2px);
}

.section-card--available:active {
  transform: translateY(0);
}

.section-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.section-card__icon {
  font-size: 40px;
}

.section-card__label {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.section-card__unavailable {
  font-size: 12px;
  color: #999;
}
</style>
