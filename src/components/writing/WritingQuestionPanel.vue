<template>
  <div class="question-panel" :style="{ width: `${width}%` }">
    <div class="question-header">
      <h2 class="part-title">Part {{ page }}</h2>
      <p class="part-subtitle">{{ subtitle }}</p>
    </div>

    <div class="question-content">
      <div class="instructions">
        <p class="instruction-text">{{ promptTitle }}</p>
        <p class="instruction-bold">{{ promptContent }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWritingStore } from '@/stores/writingStore'

interface Props {
  page: number
  width: number
}

const props = defineProps<Props>()

const subtitle = computed(() => {
  return props.page === 1
    ? 'You should spend about 20 minutes on this task. Write at least 150 words.'
    : 'You should spend about 40 minutes on this task. Write at least 250 words.'
})

const writingStore = useWritingStore()
const prompt = computed(() => {
  const prompts = (writingStore as any).prompts as { title: string; content: string }[] | undefined
  const idx = Math.max(0, Math.min((props.page || 1) - 1, (prompts?.length || 1) - 1))
  return prompts?.[idx]
})
const promptTitle = computed(() => prompt.value?.title || 'Write about the following topic:')
const promptContent = computed(() => prompt.value?.content || '')
</script>

<style scoped>
.question-panel {
  background: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.question-header {
  padding: 32px 32px 16px 32px;
  flex-shrink: 0;
}

.part-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.part-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.question-content {
  padding: 0 32px 32px 32px;
  overflow-y: auto;
  flex: 1;
}

.instructions {
  margin-top: 16px;
}

.instruction-text {
  font-size: 14px;
  margin-bottom: 16px;
}

.instruction-bold {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
