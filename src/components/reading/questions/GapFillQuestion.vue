<template>
  <div class="gfq-container">
    <div
      v-if="question.processedContent"
      class="question-content"
      :class="{ 'has-prefix-number': showPrefixNumber }"
    >
      <span v-if="showPrefixNumber" class="question-number">{{ qNum }}. </span>
      <span class="gfq-body" v-html="question.processedContent"></span>
    </div>
    <div v-else class="question-content" :class="{ 'has-prefix-number': showPrefixNumber }">
      <span v-if="showPrefixNumber" class="question-number">{{ qNum }}. </span>
      <span class="gfq-body" v-html="question.content"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const qNum = computed(() => props.question.displayNumber || props.question.questionNumber)

const hasParentTitle = computed(() => {
  const t = (props.question.title || '').trim()
  if (!t) return false
  if (/^(?:Question|Statement)\s+\d+[\.:]?$/i.test(t)) return false
  const num = qNum.value
  if (num !== undefined && num !== null && num !== '') {
    const pattern = new RegExp(`^(?:(?:Question|Statement)\\s+${num}[.):\\-\\s\\u00a0]+|${num}[.):][\\s\\u00a0]+)`, 'i')
    const stripped = t.replace(pattern, '').trim()
    if (!stripped) return false
  }
  return true
})

const showPrefixNumber = computed(() => {
  if (hasParentTitle.value || !qNum.value) return false
  const html = (props.question.processedContent || props.question.content || '').trim()
  const plain = html.replace(/<[^>]*>/g, '').trim()
  // If plain text already starts with the question number e.g. "7." or "7 "
  const numPattern = new RegExp(`^\\(?0*${qNum.value}[.):\\s]`)
  if (numPattern.test(plain)) return false
  return true
})
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.gfq-container {
  width: 100%;
}

.question-content.has-prefix-number {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.question-content.has-prefix-number .question-number {
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  flex-shrink: 0;
}

.gfq-body {
  flex: 1;
}

.question-content.has-prefix-number .gfq-body :deep(p) {
  margin: 0;
  display: inline;
}
</style>
