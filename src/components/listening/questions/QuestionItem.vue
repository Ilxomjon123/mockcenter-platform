<template>
  <div class="question-item" :class="itemClass">
    <!-- Group Task Instruction Card -->
    <div v-if="hasGroupInstruction" class="group-instruction-card">
      <div class="group-instruction-header">
        <span class="group-instruction-badge">{{ groupInstructionBadge }}</span>
      </div>
      <div v-if="groupInstructionBody" class="group-instruction-body" v-html="groupInstructionBody"></div>
    </div>

    <!-- Question title/header -->
    <div v-if="shouldRenderTitle" class="question-text" :class="{ 'has-number': question.displayNumber || question.questionNumber }">
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
import { escapeHtml } from '@/utils/sanitize'

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

// MatchingQuestion (the options branch below) shows options_title above its own options
const rendersMatchingQuestion = computed(
  () => hasOptions.value && !isMultipleChoice.value && !isDropdown.value,
)

const hasGroupInstruction = computed(() => {
  return !!props.question.options_title && !rendersMatchingQuestion.value
})

const groupInstructionBadge = computed(() => {
  const text = (props.question.options_title || '').trim()
  return text.split('\n')[0]?.trim() || ''
})

const groupInstructionBody = computed(() => {
  const text = (props.question.options_title || '').trim()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return ''
  return lines.slice(1).map(escapeHtml).join('<br>')
})

const shouldRenderTitle = computed(() => {
  if (isMultipleChoice.value && !cleanedTitle.value) {
    return false
  }
  return !!(props.question.title && cleanedTitle.value)
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
.group-instruction-card {
  margin-bottom: 22px;
  padding: 14px 18px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.group-instruction-header {
  margin-bottom: 6px;
}

.group-instruction-badge {
  display: inline-block;
  font-weight: 700;
  font-size: 14.5px;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.group-instruction-body {
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
}

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
