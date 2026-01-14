<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <!-- Shared sticky header -->
      <div class="reading-header">
        <span class="part-label">Part {{ readingStore.currentPart }}</span>
        <p class="instruction">Read the text and answer questions {{ getQuestionsRange() }}</p>
      </div>

      <!-- Panels container -->
      <div class="panels-container">
        <ReadingPassagePanel
          :width="leftWidth"
          :passage="readingStore.currentPassage"
        />

        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

        <ReadingQuestionPanel />
      </div>
    </div>

    <ExamFooter
      :current-page="readingStore.currentPart"
      :total-pages="getTotalParts()"
      :part-orders="getPartOrders()"
      @change-page="handlePageChange"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import { useResizable } from '@/composables/useResizable'
import { useGlobalReadingDragDrop } from '@/composables/useGlobalReadingDragDrop'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ReadingPassagePanel from '@/components/reading/ReadingPassagePanel.vue'
import ReadingQuestionPanel from '@/components/reading/ReadingQuestionPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'

const readingStore = useReadingStore()
const { leftWidth, isDragging, startDrag } = useResizable()
const { setupGlobalListeners, cleanupGlobalListeners } = useGlobalReadingDragDrop()

onMounted(() => {
  setupGlobalListeners()
})

onUnmounted(() => {
  cleanupGlobalListeners()
})

const getQuestionsRange = (): string => {
  const part = readingStore.currentPart
  const stats = readingStore.partStats[part]
  if (stats) {
    return `${stats.start}-${stats.end}`
  }
  return ''
}

const getTotalParts = (): number => {
  return readingStore.test?.parts.length || 0
}

const getPartOrders = (): number[] => {
  // Return part orders from test
  return readingStore.test?.parts.map((p) => p.order) || []
}

const handlePageChange = (page: number): void => {
  // page here is the order value from API
  readingStore.setPart(page)
}

const handleSubmit = (): void => {
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 64px;
  bottom: 72px;
  left: 0;
  right: 0;
}

.reading-header {
  background: #f5f5f5;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.part-label {
  font-weight: 600;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.panels-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Make header sticky at top */
:deep(.exam-header) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Make footer sticky at bottom */
:deep(.exam-footer) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}
</style>
