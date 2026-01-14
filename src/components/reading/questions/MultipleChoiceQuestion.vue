<template>
  <div>
    <div v-if="question.content" class="question-content" v-html="question.content"></div>
    <div class="options-container">
      <label
        v-for="(opt, idx) in optionsArray"
        :key="idx"
        class="option-item"
        :class="{
          selected: isSelected(opt.key),
          disabled: isMultiple && !isSelected(opt.key) && selectedValues.length >= maxAnswers,
        }"
      >
        <input
          :type="isMultiple ? 'checkbox' : 'radio'"
          :name="`question-${question.id}`"
          :value="opt.key"
          :checked="isSelected(opt.key)"
          :disabled="isMultiple && !isSelected(opt.key) && selectedValues.length >= maxAnswers"
          @change="onToggle(opt.key)"
        />
        <span class="option-label">{{ opt.value }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'
import { useReadingStore } from '@/stores/readingStore'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const readingStore = useReadingStore()

const baseQuestionNumber = computed(() => props.question.questionNumber || props.question.id)
const maxAnswers = computed(() => props.question.answers_count || 1)
const isMultiple = computed(() => maxAnswers.value > 1)

// Get all selected values from sequential keys (e.g., 11, 12, 13 for answers_count=3)
const selectedValues = computed(() => {
  const values: string[] = []
  for (let i = 0; i < maxAnswers.value; i++) {
    const key = baseQuestionNumber.value + i
    const answer = readingStore.answers[key]
    if (answer !== undefined && answer !== '') {
      values.push(String(answer))
    }
  }
  return values
})

const isSelected = (key: string) => selectedValues.value.includes(key)

const optionsArray = computed(() => {
  const options = props.question.options
  if (!options) return []

  if (Array.isArray(options)) {
    return options.map((opt) => ({
      key: String(opt),
      value: String(opt),
    }))
  }

  if (typeof options === 'object') {
    return Object.entries(options as Record<string, string>).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  }

  return []
})

// Get option index for sorting by options order
const getOptionIndex = (value: string): number => {
  return optionsArray.value.findIndex((opt) => opt.key === value)
}

const onToggle = (value: string) => {
  if (isMultiple.value) {
    let newValues = [...selectedValues.value]

    if (isSelected(value)) {
      // Remove the value
      newValues = newValues.filter((v) => v !== value)
    } else {
      // Add if not at limit
      if (newValues.length < maxAnswers.value) {
        newValues.push(value)
      } else {
        return
      }
    }

    // Sort by options order (not selection order)
    newValues.sort((a, b) => getOptionIndex(a) - getOptionIndex(b))

    // Clear all slots first, then reassign in sorted order
    for (let i = 0; i < maxAnswers.value; i++) {
      const key = baseQuestionNumber.value + i
      const sortedValue = newValues[i] || ''
      readingStore.updateAnswer(key, sortedValue)
    }
  } else {
    readingStore.updateAnswer(baseQuestionNumber.value, value)
  }
}
</script>

<style scoped>
.question-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.8;
  margin-bottom: 12px;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
}

.option-item:hover:not(.disabled) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.option-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-item input {
  display: none;
}

.option-label {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}
</style>
