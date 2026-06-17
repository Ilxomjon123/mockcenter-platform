<template>
  <div class="mq">
    <!-- Options (draggable researcher cards), rendered once above the statements -->
    <div v-if="options.length" class="mq-options">
      <div v-if="question.options_title" class="mq-options-title">
        {{ question.options_title }}
      </div>
      <div class="mq-cards">
        <span
          v-for="opt in options"
          :key="opt.key"
          class="draggable-option mq-card"
          :data-option-key="opt.key"
          :data-option-value="opt.value"
          data-kind="match"
        >
          <span class="mq-card-letter">{{ opt.letter }}</span>
          <span class="mq-card-text">{{ opt.value }}</span>
        </span>
      </div>
    </div>

    <!-- Statements with their dropzones; each dropzone sits on its own row -->
    <div
      v-if="question.processedContent"
      class="question-content mq-content"
      v-html="question.processedContent"
    ></div>
    <div v-else class="question-content mq-content" v-html="question.content"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'

const props = defineProps<{
  question: ProcessedQuestion
}>()

interface MatchOption {
  key: string
  value: string
  letter: string
}

const options = computed<MatchOption[]>(() => {
  const opts = props.question.options
  if (!opts) return []

  // Array → letters are positional (A, B, C…). key stays the value so the
  // stored answer keeps matching backend scoring (which compares values).
  if (Array.isArray(opts)) {
    return opts.map((v, i) => ({
      key: String(v),
      value: String(v),
      letter: String.fromCharCode(65 + i),
    }))
  }

  if (typeof opts === 'object') {
    return Object.entries(opts as Record<string, string>).map(([key, value]) => ({
      key,
      value: String(value),
      letter: key,
    }))
  }

  return []
})
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.mq {
  display: flex;
  flex-direction: column;
}

/* Options block */
.mq-options-title {
  font-size: 14px;
  font-family: Arial, sans-serif;
  font-weight: 700;
  color: #374151;
  margin-bottom: 10px;
}

.mq-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

/* Full-width boxed cards (overrides the inline default from shared.css) */
.mq-cards :deep(.mq-card) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  margin: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
}

.mq-card-letter {
  font-weight: 700;
  color: #1f2937;
  min-width: 14px;
}

.mq-card-text {
  color: #374151;
}

/* Statements + dropzones */
.mq-content :deep(p) {
  margin: 0 0 6px 0;
}

/* Each dropzone breaks onto its own full-width row */
.mq-content :deep(.match-dropzone) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 28px;
  height: auto;
  margin: 2px 0 4px;
  padding: 3px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

/* Hide the internal gap number; show a placeholder while empty */
.mq-content :deep(.match-dropzone .match-number) {
  display: none;
}

.mq-content :deep(.match-dropzone .match-value:empty)::before {
  content: 'Drop a card here';
  color: #9ca3af;
}

.mq-content :deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #3b82f6;
}
</style>
