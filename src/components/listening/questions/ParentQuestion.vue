<template>
  <!-- Matching Information parent renders as a matrix table -->
  <MatchingInformationQuestion
    v-if="isMatchingInformation"
    :question="question"
  />

  <!-- Matching Group parent renders as side-by-side matching with single options bank -->
  <MatchingGroupQuestion
    v-else-if="isMatching"
    :question="question"
  />

  <template v-else>
    <!-- Parent question header -->
    <div class="question-item question-parent">
      <div class="question-text" v-html="question.title"></div>
      <div
        v-if="question.processedContent"
        class="question-content"
        v-html="question.processedContent"
      ></div>
      <div
        v-else-if="question.content"
        class="question-content"
        v-html="question.content"
      ></div>
    </div>

    <!-- Children questions -->
    <QuestionItem
      v-for="child in question.children"
      :key="child.id"
      :question="child"
      is-child
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import QuestionItem from './QuestionItem.vue'
import MatchingInformationQuestion from './MatchingInformationQuestion.vue'
import MatchingGroupQuestion from './MatchingGroupQuestion.vue'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const isMatchingInformation = computed(
  () => props.question.type === QuestionType.MATCHING_INFORMATION,
)

const isMatching = computed(
  () =>
    (props.question.type === QuestionType.MATCHING ||
      props.question.type === ('matching' as unknown)) &&
    Array.isArray(props.question.children) &&
    props.question.children.length > 0,
)
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.question-item {
  padding: 24px 32px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
}

.question-item.question-parent {
  border-bottom: none;
  padding-bottom: 12px;
}

.question-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
  display: block;
}
</style>
