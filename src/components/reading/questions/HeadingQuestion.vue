<template>
  <div class="heading-question">
    <div v-if="question.options_title" class="options-title">
      {{ question.options_title }}
    </div>
    <div class="question-options" v-html="formattedOptions"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionType, type ProcessedQuestion } from '@/types/test'

const props = defineProps<{
  question: ProcessedQuestion
}>()

// match_heading options belong to the 'heading' drop family; classic matching
// headings stay in the 'match' family. Keeps the two pools separate.
const kind = computed(() =>
  props.question.type === QuestionType.MATCH_HEADING ? 'heading' : 'match'
)

const formattedOptions = computed(() => {
  const options = props.question.options
  if (!options) return ''

  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        return `<span class="draggable-option" data-option-key="${opt}" data-option-value="${opt}" data-kind="${kind.value}">${opt}</span>`
      })
      .join('')
  }

  if (typeof options === 'object') {
    return Object.entries(options as Record<string, string>)
      .map(
        ([key, value]) =>
          `<span class="draggable-option" data-option-key="${key}" data-option-value="${value}" data-kind="${kind.value}">${value}</span>`
      )
      .join('')
  }

  return String(options)
})
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.heading-question {
  width: 100%;
}

.options-title {
  font-size: 14px;
  font-family: Arial, sans-serif;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.question-options {
  font-size: 14px;
  font-family: Arial, sans-serif;
  color: #374151;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
</style>
