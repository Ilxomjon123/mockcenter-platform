<template>
  <div class="mg-container">
    <!-- Parent instruction -->
    <div v-if="question.title" class="mg-instruction" v-html="question.title"></div>
    <div
      v-if="question.processedContent"
      class="question-content mg-instruction-content"
      v-html="question.processedContent"
    ></div>

    <!-- Shared options (draggable cards), rendered once under the parent -->
    <div v-if="options.length" class="mg-options">
      <div v-if="optionsTitle" class="mg-options-title">{{ optionsTitle }}</div>
      <div class="mg-option-cards">
        <span
          v-for="opt in options"
          :key="opt.key"
          class="draggable-option mg-option-card"
          :data-option-key="opt.key"
          :data-option-value="opt.value"
          data-kind="match"
        >
          <span class="mg-option-letter">{{ opt.letter }}</span>
          <span class="mg-option-text">{{ opt.value }}</span>
        </span>
      </div>
    </div>

    <!-- Child statements, each with its own dropzone on a separate row -->
    <div class="mg-children">
      <div v-for="child in children" :key="child.id" class="mg-child">
        <div class="mg-statement">
          <span v-if="child.displayNumber" class="mg-num">{{ child.displayNumber }}</span>
          <span class="mg-statement-text" v-html="child.title"></span>
        </div>
        <div class="mg-drop" v-html="child.processedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const children = computed(() => props.question.children ?? [])

// Options live on each matching child (all identical) or on the parent.
// Prefer the parent's options, else fall back to the first child that has some.
const sourceOptions = computed(() => {
  const hasItems = (o: unknown): boolean =>
    (Array.isArray(o) && o.length > 0) ||
    (!!o && typeof o === 'object' && Object.keys(o as object).length > 0)

  if (hasItems(props.question.options)) return props.question.options
  for (const child of children.value) {
    if (hasItems(child.options)) return child.options
  }
  return null
})

const optionsTitle = computed(() => {
  if (props.question.options_title) return props.question.options_title
  for (const child of children.value) {
    if (child.options_title) return child.options_title
  }
  return ''
})

interface MatchOption {
  key: string
  value: string
  letter: string
}

const options = computed<MatchOption[]>(() => {
  const opts = sourceOptions.value
  if (!opts) return []

  // Array → letters are positional (A, B, C…), key stays the value so the
  // stored answer keeps matching the backend scoring (which compares values).
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
.mg-container {
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

@media (max-width: 640px) {
  .mg-container {
    padding: 16px;
  }
}

.mg-instruction {
  font-size: 14px;
  font-family: Arial, sans-serif;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 16px;
}

.mg-instruction-content {
  margin-bottom: 16px;
}

/* Options block */
.mg-options-title {
  font-size: 14px;
  font-family: Arial, sans-serif;
  font-weight: 700;
  color: #374151;
  margin-bottom: 10px;
}

.mg-option-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

/* Full-width boxed option cards (overrides the inline default from shared.css) */
.mg-option-cards :deep(.mg-option-card) {
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

.mg-option-letter {
  font-weight: 700;
  color: #1f2937;
  min-width: 14px;
}

.mg-option-text {
  color: #374151;
}

/* Children */
.mg-children {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mg-statement {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  font-family: Arial, sans-serif;
  color: #374151;
  line-height: 1.6;
}

.mg-num {
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}

.mg-statement-text {
  flex: 1;
  min-width: 0;
}

.mg-statement-text :deep(p) {
  display: inline;
  margin: 0;
  padding: 0;
}

/* Each dropzone sits on its own full-width row */
.mg-drop {
  margin-top: 6px;
}

.mg-drop :deep(.match-dropzone) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 28px;
  height: auto;
  margin: 0;
  padding: 3px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

/* Number is shown next to the statement, not inside the dropzone */
.mg-drop :deep(.match-dropzone .match-number) {
  display: none;
}

/* Placeholder text for an empty dropzone */
.mg-drop :deep(.match-dropzone .match-value:empty)::before {
  content: 'Drop a card here';
  color: #9ca3af;
}

.mg-drop :deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #3b82f6;
}
</style>
