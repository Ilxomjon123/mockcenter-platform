<template>
  <div class="question-item" :class="itemClass">
    <!-- Group Task Instruction Card (authentic topshiriq / savol matni) -->
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

    <!-- Multiple choice / test type / true_false_not_given -->
    <MultipleChoiceQuestion
      v-if="isMultipleChoice && hasOptions"
      :question="question"
    />

    <!-- Heading-style: options only, the dropzones are in the passage -->
    <HeadingQuestion
      v-else-if="isHeadingStyle"
      :question="question"
    />

    <!-- Matching: statement dropzones in content, or a single-answer letter picker -->
    <MatchingQuestion
      v-else-if="(isMatching || isMatchHeading) && hasOptions"
      :question="question"
    />

    <!-- Dropdown type (options are inside dropdowns, not shown separately) -->
    <GapFillQuestion
      v-else-if="isDropdown"
      :question="question"
    />

    <!-- Other types with options -->
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
import HeadingQuestion from './HeadingQuestion.vue'
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
  if (/^(?:Question|Statement)\s+\d+[\.:]?$/i.test(title)) {
    return ''
  }
  return title
})

const isMultipleChoice = computed(() => {
  return props.question.type === QuestionType.MULTIPLE_CHOICE ||
         props.question.type === QuestionType.TRUE_FALSE_NOT_GIVEN ||
         props.question.type === QuestionType.YES_NO_NOT_GIVEN
})

// Heading-style matching: options here, [match]/[heading_match] dropzones in the passage
const isHeadingStyle = computed(() => {
  const type = props.question.type
  if (type !== QuestionType.MATCHING && type !== QuestionType.MATCH_HEADING) return false
  return !!props.question.usesPassageDropzones && hasOptions.value
})

const isMatching = computed(() => {
  return props.question.type === QuestionType.MATCHING
})

// match_heading: heading-style, options in question column, [heading_match]
// dropzones live in the passage. Rendered like a heading question.
const isMatchHeading = computed(() => {
  return props.question.type === QuestionType.MATCH_HEADING
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

// HeadingQuestion renders options_title itself
const hasGroupInstruction = computed(() => {
  return !!props.question.options_title && !isHeadingStyle.value
})

const groupInstructionBadge = computed(() => {
  const text = (props.question.options_title || '').trim()
  const firstLine = text.split('\n')[0]?.trim() || ''
  return firstLine
})

const groupInstructionBody = computed(() => {
  const text = (props.question.options_title || '').trim()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return ''
  return lines.slice(1).map(escapeHtml).join('<br>')
})

// Same condition as MatchingQuestion's picker mode (any type routed to MatchingQuestion
// above, incl. matching_information without children): it renders "N. prompt" itself.
const isPickerMatching = computed(() => {
  if (!hasOptions.value || isMultipleChoice.value || isHeadingStyle.value || isDropdown.value) return false
  if (!props.question.questionNumber) return false
  const html = props.question.processedContent || ''
  return !/match-dropzone|gap-input|dropdown-select/.test(html)
})

const shouldRenderTitle = computed(() => {
  // If it's a picker matching question (e.g. Paragraph B heading picker), MatchingQuestion renders its own header
  if (isPickerMatching.value) {
    return false
  }
  // If it's multiple choice / TFNG and cleanedTitle is empty, MultipleChoiceQuestion renders the statement with number
  if (isMultipleChoice.value && !cleanedTitle.value) {
    return false
  }
  return !!(props.question.title && cleanedTitle.value)
})

const itemClass = computed(() => ({
  'question-parent': props.isParent,
  'question-child': props.isChild,
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

@media (max-width: 640px) {
  .question-item {
    padding: 16px;
  }
}

.question-item.question-parent {
  border-bottom: none;
  padding-bottom: 12px;
}

.question-item.question-child {
  padding-top: 16px;
  padding-left: 32px;
  border-bottom: 1px solid #f3f4f6;
}

@media (max-width: 640px) {
  .question-item.question-child {
    padding-left: 16px;
    padding-top: 12px;
  }
}

.question-item.question-child:last-child {
  border-bottom: 1px solid #e5e5e5;
}

.question-text {
  font-size: 16px;
  font-family: Arial, sans-serif;
  color: #374151;
  margin: 0 0 12px -16px;
  line-height: 1.6;
  display: block;
}

@media (max-width: 640px) {
  .question-text {
    font-size: 15px;
    margin: 0 0 10px -8px;
  }
}

.question-text.has-number {
  display: flex;
  align-items: baseline;
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
  font-family: Arial, sans-serif;
  color: #374151;
  flex-shrink: 0;
  margin-right: 8px;
  white-space: nowrap;
}

.question-text.has-number > span:last-child {
  flex: 1;
  min-width: 0;
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

:deep(.question-content) {
  margin-left: -16px;
}

@media (max-width: 640px) {
  :deep(.question-content) {
    margin-left: -8px;
  }
}
</style>
