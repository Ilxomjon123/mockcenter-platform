<template>
  <div class="answer-panel">
    <div class="answer-area">
      <textarea
        class="answer-textarea"
        :value="modelValue"
        @input="handleInput"
        placeholder="Type your answer here..."
      />
    </div>
    <div class="word-count">Words: {{ wordCount }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const wordCount = computed((): number => {
  if (!props.modelValue) return 0
  return props.modelValue
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
})

const handleInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.answer-panel {
  flex: 1;
  background: #fafafa;
  padding: 32px;
  padding-bottom: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.answer-area {
  flex: 1;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.answer-textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: none;
  outline: none;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.word-count {
  text-align: right;
  font-size: 14px;
  color: #6b7280;
  flex-shrink: 0;
  padding-right: 100px;
}
</style>
