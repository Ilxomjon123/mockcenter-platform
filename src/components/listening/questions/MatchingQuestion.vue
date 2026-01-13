<template>
  <div class="question-row">
    <div class="question-col">
      <div
        v-if="question.processedContent"
        class="question-content"
        v-html="question.processedContent"
      ></div>
      <div v-else class="question-content" v-html="question.content"></div>
    </div>
    <div class="question-col">
      <div v-if="question.options_title" class="options-title">
        {{ question.options_title }}
      </div>
      <div class="question-options" v-html="formattedOptions"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const formattedOptions = computed(() => {
  const options = props.question.options
  if (!options) return ''

  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        return `<span class="draggable-option" draggable="true" data-option-key="${opt}" data-option-value="${opt}">${opt}</span>`
      })
      .join('')
  }

  if (typeof options === 'object') {
    return Object.entries(options as Record<string, string>)
      .map(
        ([key, value]) =>
          `<span class="draggable-option" draggable="true" data-option-key="${key}" data-option-value="${value}">${value}</span>`
      )
      .join('')
  }

  return String(options)
})
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.question-row {
  display: flex;
  gap: 24px;
}

.question-col {
  flex: 1;
  min-width: 0;
}

.options-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.question-options {
  font-size: 14px;
  color: #374151;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
</style>
