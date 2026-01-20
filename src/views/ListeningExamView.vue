<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <ListeningQuestionPanel ref="questionPanelRef" />
    </div>

    <ExamFooter
      :current-page="listeningStore.currentPart"
      :current-question="currentQuestion"
      :total-pages="listeningStore.test?.parts?.length || 0"
      :part-orders="listeningStore.partOrders"
      :part-stats="listeningStore.partStats"
      :answers="listeningStore.answers"
      @change-page="listeningStore.setPart"
      @change-question="handleQuestionChange"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ListeningQuestionPanel from '@/components/listening/ListeningQuestionPanel.vue'
import { useListeningStore } from '@/stores/listeningStore'

const listeningStore = useListeningStore()
const questionPanelRef = ref<InstanceType<typeof ListeningQuestionPanel> | null>(null)
const currentQuestion = ref(0)

// Handle focus/click on inputs to update footer
const handleInputFocus = (e: Event) => {
  const target = e.target as HTMLElement

  // Check if it's a gap input
  if (target.classList.contains('gap-input')) {
    const gap = (target as HTMLInputElement).dataset.gap
    if (gap) {
      currentQuestion.value = parseInt(gap, 10)
    }
    return
  }

  // Check if it's a match dropzone
  if (target.classList.contains('match-dropzone') || target.closest('.match-dropzone')) {
    const dropzone = target.classList.contains('match-dropzone')
      ? target
      : target.closest('.match-dropzone')
    const gap = (dropzone as HTMLElement)?.dataset.gap
    if (gap) {
      currentQuestion.value = parseInt(gap, 10)
    }
    return
  }

  // Check if it's inside a multiple choice question
  const mcQuestion = target.closest('[data-question-number]')
  if (mcQuestion) {
    const qNum = (mcQuestion as HTMLElement).dataset.questionNumber
    if (qNum) {
      currentQuestion.value = parseInt(qNum, 10)
    }
  }
}

onMounted(() => {
  document.addEventListener('focusin', handleInputFocus)
  document.addEventListener('click', handleInputFocus)
})

onUnmounted(() => {
  document.removeEventListener('focusin', handleInputFocus)
  document.removeEventListener('click', handleInputFocus)
})

const handleQuestionChange = async (questionNumber: number): Promise<void> => {
  currentQuestion.value = questionNumber

  await nextTick()

  // Find the input or dropzone with the matching data-gap attribute
  const container = document.querySelector('.questions-container')
  if (!container) return

  // Try gap input first
  let element = container.querySelector<HTMLInputElement>(
    `.gap-input[data-gap="${questionNumber}"]`
  )

  // If not found, try match dropzone
  if (!element) {
    element = container.querySelector<HTMLElement>(
      `.match-dropzone[data-gap="${questionNumber}"]`
    ) as HTMLInputElement
  }

  // If not found, try multiple choice option with matching question number
  if (!element) {
    const mcQuestion = container.querySelector(
      `[data-question-number="${questionNumber}"]`
    )
    if (mcQuestion) {
      mcQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (element.tagName === 'INPUT') {
      element.focus()
    }
  }
}

const handleSubmit = (): void => {
  listeningStore.setCompleted(true, true) // isManual = true
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
  /* Add margin to account for fixed header and footer */
  margin-top: 85px;
  margin-bottom: 72px;
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
