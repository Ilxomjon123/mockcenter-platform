<template>
  <div class="question-item" :class="itemClass">
    <!-- Question title/header -->
    <div v-if="question.title" class="question-text" :class="{ 'has-number': question.displayNumber || question.questionNumber }">
      <span v-if="question.displayNumber || question.questionNumber" class="question-number">{{ question.displayNumber || question.questionNumber }}. </span>
      <span v-html="question.title"></span>
    </div>

    <!-- Multiple choice / test type / true_false_not_given -->
    <MultipleChoiceQuestion
      v-if="isMultipleChoice && hasOptions"
      :question="question"
    />

    <!-- Heading type (options only, dropzones are in passage) -->
    <HeadingQuestion
      v-else-if="isHeading && hasOptions"
      :question="question"
    />

    <!-- Matching/draggable type -->
    <MatchingQuestion
      v-else-if="isMatching && hasOptions"
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

const props = defineProps<{
  question: ProcessedQuestion
  isParent?: boolean
  isChild?: boolean
}>()

const isMultipleChoice = computed(() => {
  return props.question.type === QuestionType.MULTIPLE_CHOICE ||
         props.question.type === QuestionType.TRUE_FALSE_NOT_GIVEN ||
         props.question.type === QuestionType.YES_NO_NOT_GIVEN
})

// Heading-style matching: has options but dropzones are in passage (no [match] in question content)
const isHeading = computed(() => {
  if (props.question.type !== QuestionType.MATCHING) return false
  // If question content has [match], dropzones are in question, not heading style
  const hasMatchInContent = props.question.content?.includes('[match]') || false
  return !hasMatchInContent
})

const isMatching = computed(() => {
  return props.question.type === QuestionType.MATCHING
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

const itemClass = computed(() => ({
  'question-parent': props.isParent,
  'question-child': props.isChild,
}))
</script>

<style scoped>
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
