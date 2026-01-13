<template>
  <div>
    <div v-if="question.content" class="question-content" v-html="question.content"></div>
    <div class="radio-options">
      <label
        v-for="(opt, idx) in optionsArray"
        :key="idx"
        class="radio-option"
        :class="{ selected: selectedValue === opt.key }"
      >
        <input
          type="radio"
          :name="`question-${question.id}`"
          :value="opt.key"
          :checked="selectedValue === opt.key"
          @change="onSelect(opt.key)"
        />
        <span class="radio-label">{{ opt.value }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'
import { useListeningStore } from '@/stores/listeningStore'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const listeningStore = useListeningStore()

const questionKey = computed(() => props.question.questionNumber || props.question.id)

const selectedValue = computed(() => listeningStore.answers[questionKey.value])

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

const onSelect = (value: string) => {
  listeningStore.updateAnswer(questionKey.value, value)
}
</script>

<style scoped>
.question-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.8;
  margin-bottom: 12px;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
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

.radio-option:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.radio-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.radio-option input[type='radio'] {
  display: none;
}

.radio-label {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}
</style>
