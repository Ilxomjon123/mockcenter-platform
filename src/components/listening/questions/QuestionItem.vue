<template>
  <div class="question-item" :class="itemClass">
    <!-- Question title/header -->
    <div v-if="question.title && cleanedTitle" class="question-text" :class="{ 'has-number': question.displayNumber || question.questionNumber }">
      <span v-if="question.displayNumber || question.questionNumber" class="question-number">{{ question.displayNumber || question.questionNumber }}. </span>
      <span v-html="cleanedTitle"></span>
    </div>

    <!-- Multiple choice / test type -->
    <MultipleChoiceQuestion
      v-if="isMultipleChoice && hasOptions"
      :question="question"
    />

    <!-- Dropdown type (options are inside dropdowns, not shown separately) -->
    <GapFillQuestion
      v-else-if="isDropdown"
      :question="question"
    />

    <!-- Matching/draggable type -->
    <MatchingQuestion
      v-else-if="hasOptions"
      :question="question"
    />

    <!-- Gap fill (no options) -->
    <GapFillQuestion
      v-else
      :question="question"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import MultipleChoiceQuestion from './MultipleChoiceQuestion.vue'
import MatchingQuestion from './MatchingQuestion.vue'
import GapFillQuestion from './GapFillQuestion.vue'

const props = defineProps<{
  question: ProcessedQuestion
  isParent?: boolean
  isChild?: boolean
}>()

const cleanedTitle = computed(() => {
  let title = (props.question.title || '').trim()
  const num = props.question.displayNumber || props.question.questionNumber
  if (num !== undefined && num !== null && num !== '') {
    const pattern = new RegExp(`^(?:(?:Question|Statement)\\s+${num}[.):\\-\\s\\u00a0]+|${num}[.):][\\s\\u00a0]+)`, 'i')
    while (pattern.test(title)) {
      title = title.replace(pattern, '').trim()
    }
  }
  // Strip redundant leading sub-number (e.g. "1. How does..." or "(1) How does...")
  // (only "1. " / "(1) " style; keeps titles such as "24-hour service" or "10:30 start")
  title = title.replace(/^\(?\d{1,2}[.)]\s+/, '').trim()

  if (/^(?:Question|Statement)\s+\d+[\.:]?$/i.test(title)) {
    return ''
  }
  return title
})

// TRUE/FALSE/NOT GIVEN (and YES/NO/NOT GIVEN) are single-choice questions too:
// they take a number in partStats and need radio options (as in reading).
const isMultipleChoice = computed(() => {
  return (
    props.question.type === QuestionType.MULTIPLE_CHOICE ||
    props.question.type === QuestionType.TRUE_FALSE_NOT_GIVEN ||
    props.question.type === QuestionType.YES_NO_NOT_GIVEN
  )
})

const isDropdown = computed(() => {
  return props.question.type === QuestionType.DROP_DOWN
})

const hasOptions = computed(() => {
  const options = props.question.options
  if (!options) return false
  if (Array.isArray(options) && options.length > 0) return true
  if (typeof options === 'object' && Object.keys(options as object).length > 0) return true
  return false
})

const isGapFill = computed(() => {
  return props.question.type === QuestionType.GAP_FILLING && !hasOptions.value
})

const itemClass = computed(() => ({
  'question-parent': props.isParent,
  'question-child': props.isChild,
  'question-gap-fill': isGapFill.value,
}))
</script>

<style scoped>
.question-item {
  padding: 24px 32px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
}

.question-item.question-gap-fill {
  background: transparent;
  border-bottom: none;
  padding: 16px 32px;
}

.question-item.question-parent {
  border-bottom: none;
  padding-bottom: 12px;
}

.question-item.question-child {
  padding-top: 16px;
  padding-left: 48px;
  border-bottom: 1px solid #f3f4f6;
}

.question-item.question-child:last-child {
  border-bottom: 1px solid #e5e5e5;
}

.question-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
  display: block;
}

.question-text.has-number {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
}

.question-text span {
  display: inline;
}

.question-text.has-number p {
  display: inline !important;
  margin: 0 !important;
  padding: 0 !important;
}

.question-number {
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
  margin-right: 8px;
  font-size: inherit;
}

.question-text.has-number :deep(p),
.question-text.has-number :deep(div),
.question-text.has-number :deep(h1),
.question-text.has-number :deep(h2),
.question-text.has-number :deep(h3),
.question-text.has-number :deep(h4),
.question-text.has-number :deep(h5),
.question-text.has-number :deep(h6) {
  display: inline !important;
  margin: 0 !important;
  padding: 0 !important;
}

.question-text.has-number :deep(*) {
  font-size: inherit !important;
}
</style>
