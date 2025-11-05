<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <ReadingPassagePanel
        :part="readingStore.currentPart"
        :width="leftWidth"
        :passage="readingStore.currentPassage"
        :questions-range="getQuestionsRange()"
      />

      <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

      <ReadingQuestionPanel
        :questions="readingStore.currentPassage?.questions || []"
        :questions-range="getQuestionsRange()"
        :instruction="getInstruction()"
        :answers="readingStore.answers"
        @update-answer="readingStore.updateAnswer"
      />
    </div>

    <ExamFooter
      :current-page="readingStore.currentPart"
      :total-pages="3"
      @change-page="readingStore.setPart"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { useReadingStore } from '@/stores/readingStore'
import { useResizable } from '@/composables/useResizable'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ReadingPassagePanel from '@/components/reading/ReadingPassagePanel.vue'
import ReadingQuestionPanel from '@/components/reading/ReadingQuestionPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'

const readingStore = useReadingStore()
const { leftWidth, isDragging, startDrag } = useResizable()

const getQuestionsRange = (): string => {
  const passage = readingStore.currentPassage
  if (!passage || passage.questions.length === 0) return ''

  const firstQ = passage.questions[0].id
  const lastQ = passage.questions[passage.questions.length - 1].id

  return firstQ === lastQ ? `${firstQ}` : `${firstQ}-${lastQ}`
}

const getInstruction = (): string => {
  const part = readingStore.currentPart
  if (part === 1) {
    return 'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.'
  } else if (part === 2) {
    return 'The text has four sections. Choose the correct heading for each section and move it into the gap.'
  } else {
    return 'Complete the summary. Write ONE WORD ONLY from the text for each answer.'
  }
}

const handleSubmit = (): void => {
  console.log('Reading exam submitted:', readingStore.answers)
  alert('Reading exam submitted successfully!')
}
</script>

<style scoped>
.exam-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
