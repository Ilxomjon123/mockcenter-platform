<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <WritingQuestionPanel :page="writingStore.currentPage" :width="leftWidth" />

      <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

      <WritingAnswerPanel v-model="currentAnswer" />
    </div>

    <ExamFooter
      :current-page="writingStore.currentPage"
      :total-pages="2"
      @change-page="handlePageChange"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWritingStore } from '@/stores/writingStore'
import { useResizable } from '@/composables/useResizable'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import WritingQuestionPanel from '@/components/writing/WritingQuestionPanel.vue'
import WritingAnswerPanel from '@/components/writing/WritingAnswerPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'

const writingStore = useWritingStore()
const { leftWidth, isDragging, startDrag } = useResizable()

const currentAnswer = computed({
  get: (): string => writingStore.currentAnswer,
  set: (value: string): void => writingStore.updateAnswer(value),
})

const handlePageChange = (page: number): void => {
  if (page >= 1 && page <= 2) {
    writingStore.setPage(page)
  }
}

const handleSubmit = (): void => {
  alert('Writing exam submitted successfully!')
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
