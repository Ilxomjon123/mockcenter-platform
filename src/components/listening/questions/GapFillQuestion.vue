<template>
  <div
    v-if="question.processedContent"
    class="question-content"
    v-html="question.processedContent"
  ></div>
  <div v-else class="question-content" v-html="question.content"></div>
</template>

<script setup lang="ts">
import type { ProcessedQuestion } from '@/types/test'

defineProps<{
  question: ProcessedQuestion
}>()
</script>

<style scoped>
.question-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.8;
}

.question-content :deep(img) {
  max-height: 500px;
  height: auto;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin: 12px 0;
}

/* Gap input styles */
.question-content :deep(.gap-input) {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0 4px;
  text-align: center;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
}

.question-content :deep(.gap-input:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Match dropzone styles for gap fill with match */
:deep(.match-dropzone) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 32px;
  padding: 4px 12px;
  margin: 0 4px;
  border: 1px dashed #9ca3af;
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  vertical-align: middle;
  font-size: 13px;
  position: relative;
}

:deep(.match-dropzone:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

:deep(.match-dropzone.drag-over) {
  border-color: #3b82f6;
  border-style: dashed;
  background: #dbeafe;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

:deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #d1d5db;
  background: #ffffff;
  cursor: grab;
}

:deep(.match-dropzone.has-value:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

:deep(.match-dropzone.dragging-from) {
  opacity: 0.5;
  border-color: #3b82f6;
  border-style: dashed;
  cursor: grabbing;
}

:deep(.match-dropzone.drop-animation) {
  animation: drop-bounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes drop-bounce {
  0% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

:deep(.match-dropzone.remove-animation) {
  animation: shake-remove 0.15s ease-in-out;
}

@keyframes shake-remove {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

:deep(.match-number) {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

:deep(.match-dropzone.has-value .match-number) {
  display: none;
}

:deep(.match-value) {
  font-weight: 500;
  color: #374151;
}
</style>
