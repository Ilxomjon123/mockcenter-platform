<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <QuestionPanel :page="examStore.currentPage" :width="leftWidth" />

      <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

      <AnswerPanel v-model="currentAnswer" />
    </div>

    <ExamFooter
      :current-page="examStore.currentPage"
      @change-page="examStore.setPage"
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
import QuestionPanel from '@/components/writing/QuestionPanel.vue'
import AnswerPanel from '@/components/writing/AnswerPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'

const examStore = useWritingStore()
const { leftWidth, isDragging, startDrag } = useResizable()

const currentAnswer = computed({
  get: (): string => examStore.currentAnswer,
  set: (value: string): void => examStore.updateAnswer(value),
})

const handleSubmit = (): void => {
  console.log('Exam submitted:', examStore.answers)
  alert('Exam submitted successfully!')
  // Imtihon topshirilgandan keyin ma'lumotlarni tozalash
  // examStore.clearExam()
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
