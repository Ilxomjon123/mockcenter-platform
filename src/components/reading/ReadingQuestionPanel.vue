<template>
  <div class="question-panel">
    <!-- Display all questions in current part -->
    <div ref="questionsContainerRef" class="questions-container">
      <template v-for="question in processedQuestions" :key="question.id">
        <!-- Question with children (parent type) -->
        <ParentQuestion
          v-if="question.children && question.children.length > 0"
          :question="question"
        />

        <!-- Regular question without children -->
        <QuestionItem v-else :question="question" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useReadingQuestionProcessor } from '@/composables/useReadingQuestionProcessor'
import { useReadingDragAndDrop } from '@/composables/useReadingDragAndDrop'
import { QuestionItem, ParentQuestion } from './questions'

// Questions container ref
const questionsContainerRef = ref<HTMLElement | null>(null)

// Question processor composable
const { processedQuestions, restoreGapValues, setupInputListener } = useReadingQuestionProcessor({
  containerRef: questionsContainerRef,
})

// Drag and drop composable
const { setupEventListeners: setupDragDropListeners } = useReadingDragAndDrop({
  containerRef: questionsContainerRef,
})

// Setup event delegation on mount
onMounted(() => {
  setupInputListener()
  setupDragDropListeners()
  nextTick(restoreGapValues)
})
</script>

<style scoped>
.question-panel {
  flex: 1;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.questions-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Global drag ghost style */
:global(.drag-ghost) {
  padding: 6px 14px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #3b82f6;
  font-size: 13px;
  color: #374151;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
</style>
