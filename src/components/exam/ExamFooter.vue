<template>
  <footer class="exam-footer">
    <div class="footer-parts">
      <template v-for="partOrder in partOrders" :key="partOrder">
        <!-- Part section -->
        <div class="part-section" :class="{ active: currentPage === partOrder }">
          <!-- Part label with count -->
          <button
            @click="emit('changePage', partOrder)"
            class="part-label"
            :class="{ active: currentPage === partOrder }"
          >
            Part {{ partOrder }}
          </button>

          <!-- Question indices - only show for active part -->
          <div v-if="currentPage === partOrder" class="question-indices">
            <button
              v-for="qNum in getQuestionsForPart(partOrder)"
              :key="qNum"
              @click="emit('changeQuestion', qNum)"
              class="question-index"
              :class="{
                active: currentQuestion === qNum,
                answered: isAnswered(qNum)
              }"
            >
              {{ qNum }}
            </button>
          </div>

          <!-- Part count -->
          <span class="part-count">{{ getAnsweredCount(partOrder) }} of {{ getTotalCount(partOrder) }}</span>
        </div>
      </template>
    </div>

    <!-- Submit button in footer - only show on last part -->
    <button v-if="isLastPart" @click="emit('submit')" class="submit-btn">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Floating navigation buttons -->
    <div class="floating-nav">
      <button
        class="float-btn prev"
        :disabled="!hasPreviousQuestion"
        @click="goToPreviousQuestion"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        class="float-btn next"
        :disabled="!hasNextQuestion"
        @click="goToNextQuestion"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PartStats {
  start: number
  end: number
}

interface Props {
  currentPage: number
  currentQuestion?: number
  totalPages?: number
  partOrders?: number[]
  partStats?: Record<number, PartStats>
  answers?: Record<string | number, string | number>
}

interface Emits {
  (e: 'changePage', page: number): void
  (e: 'changeQuestion', questionNumber: number): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  totalPages: 2,
  partOrders: () => [],
  partStats: () => ({}),
  answers: () => ({}),
  currentQuestion: 0,
})

const emit = defineEmits<Emits>()

// If partOrders is provided, use it; otherwise generate sequential numbers
const partOrders = computed(() => {
  if (props.partOrders.length > 0) {
    return props.partOrders
  }
  return Array.from({ length: props.totalPages }, (_, i) => i + 1)
})

// Get questions array for a part
const getQuestionsForPart = (partOrder: number): number[] => {
  const stats = props.partStats[partOrder]
  if (!stats) return []

  const questions: number[] = []
  for (let i = stats.start; i <= stats.end; i++) {
    questions.push(i)
  }
  return questions
}

// Get total questions count for a part
const getTotalCount = (partOrder: number): number => {
  const stats = props.partStats[partOrder]
  if (!stats) return 0
  return stats.end - stats.start + 1
}

// Get answered questions count for a part
const getAnsweredCount = (partOrder: number): number => {
  const questions = getQuestionsForPart(partOrder)
  let count = 0
  for (const qNum of questions) {
    const answer = props.answers[qNum]
    if (answer !== undefined && answer !== '') {
      count++
    }
  }
  return count
}

// Check if a question is answered
const isAnswered = (questionNumber: number): boolean => {
  const answer = props.answers[questionNumber]
  return answer !== undefined && answer !== ''
}

// Get the index of current page in the partOrders array
const getCurrentIndex = computed(() => {
  return partOrders.value.indexOf(props.currentPage)
})

// Check if current page is the last part
const isLastPart = computed(() => {
  return getCurrentIndex.value === partOrders.value.length - 1
})

// Check if we're in "parts only" mode (no individual questions, like Writing)
const isPartsOnlyMode = computed(() => {
  return Object.keys(props.partStats).length === 0
})

// Get all questions across all parts
const allQuestions = computed(() => {
  const questions: number[] = []
  for (const partOrder of partOrders.value) {
    questions.push(...getQuestionsForPart(partOrder))
  }
  return questions
})

// Check if there's a previous question/part
const hasPreviousQuestion = computed(() => {
  if (isPartsOnlyMode.value) {
    return getCurrentIndex.value > 0
  }
  if (!props.currentQuestion) return allQuestions.value.length > 0
  const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
  return currentIndex > 0
})

// Check if there's a next question/part
const hasNextQuestion = computed(() => {
  if (isPartsOnlyMode.value) {
    return getCurrentIndex.value < partOrders.value.length - 1
  }
  if (!props.currentQuestion) return allQuestions.value.length > 0
  const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
  return currentIndex < allQuestions.value.length - 1
})

// Go to previous question/part
const goToPreviousQuestion = () => {
  if (!hasPreviousQuestion.value) return

  // Parts only mode (Writing)
  if (isPartsOnlyMode.value) {
    const prevIndex = getCurrentIndex.value - 1
    const prevPage = partOrders.value[prevIndex]
    if (prevIndex >= 0 && prevPage !== undefined) {
      emit('changePage', prevPage)
    }
    return
  }

  let targetQuestion: number | undefined
  if (!props.currentQuestion) {
    targetQuestion = allQuestions.value[0]
  } else {
    const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
    targetQuestion = allQuestions.value[currentIndex - 1]
  }

  if (targetQuestion === undefined) return

  // Find which part this question belongs to and switch if needed
  for (const partOrder of partOrders.value) {
    const partQuestions = getQuestionsForPart(partOrder)
    if (partQuestions.includes(targetQuestion)) {
      if (props.currentPage !== partOrder) {
        emit('changePage', partOrder)
      }
      emit('changeQuestion', targetQuestion)
      break
    }
  }
}

// Go to next question/part
const goToNextQuestion = () => {
  if (!hasNextQuestion.value) return

  // Parts only mode (Writing)
  if (isPartsOnlyMode.value) {
    const nextIndex = getCurrentIndex.value + 1
    const nextPage = partOrders.value[nextIndex]
    if (nextIndex < partOrders.value.length && nextPage !== undefined) {
      emit('changePage', nextPage)
    }
    return
  }

  let targetQuestion: number | undefined
  if (!props.currentQuestion) {
    targetQuestion = allQuestions.value[0]
  } else {
    const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
    targetQuestion = allQuestions.value[currentIndex + 1]
  }

  if (targetQuestion === undefined) return

  // Find which part this question belongs to and switch if needed
  for (const partOrder of partOrders.value) {
    const partQuestions = getQuestionsForPart(partOrder)
    if (partQuestions.includes(targetQuestion)) {
      if (props.currentPage !== partOrder) {
        emit('changePage', partOrder)
      }
      emit('changeQuestion', targetQuestion)
      break
    }
  }
}
</script>

<style scoped>
.exam-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 14px 24px;
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.footer-parts {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow-x: auto;
  padding: 2px 0;
}

.footer-parts::-webkit-scrollbar {
  display: none;
}

.part-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.part-label {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.part-label:hover {
  background: #f1f5f9;
  color: #475569;
}

.part-label.active {
  color: #1e293b;
  background: #e2e8f0;
}

.question-indices {
  display: flex;
  align-items: center;
  gap: 5px;
}

.question-index {
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-index:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.question-index.active {
  color: white;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
}

.question-index.answered:not(.active) {
  color: white;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.25);
}

.part-count {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  white-space: nowrap;
  margin-left: 6px;
  padding: 4px 10px;
  background: #f8fafc;
  border-radius: 6px;
}

/* Floating navigation buttons */
.floating-nav {
  position: fixed;
  right: 24px;
  bottom: 90px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 50;
}

.float-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.float-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.float-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
}

.float-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.float-btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.float-btn:hover:not(:disabled) svg {
  transform: scale(1.1);
}

/* Submit button in footer */
.submit-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.submit-btn:active {
  transform: translateY(0) scale(0.97);
}

.submit-btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.submit-btn:hover svg {
  transform: scale(1.1);
}
</style>
