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

// Get all questions across all parts
const allQuestions = computed(() => {
  const questions: number[] = []
  for (const partOrder of partOrders.value) {
    questions.push(...getQuestionsForPart(partOrder))
  }
  return questions
})

// Check if there's a previous question
const hasPreviousQuestion = computed(() => {
  if (!props.currentQuestion) return allQuestions.value.length > 0
  const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
  return currentIndex > 0
})

// Check if there's a next question
const hasNextQuestion = computed(() => {
  if (!props.currentQuestion) return allQuestions.value.length > 0
  const currentIndex = allQuestions.value.indexOf(props.currentQuestion)
  return currentIndex < allQuestions.value.length - 1
})

// Go to previous question
const goToPreviousQuestion = () => {
  if (!hasPreviousQuestion.value) return

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

// Go to next question
const goToNextQuestion = () => {
  if (!hasNextQuestion.value) return

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
  border-top: 1px solid #e5e5e5;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.footer-parts {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
}

.part-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.part-label {
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.part-label:hover {
  background: #f3f4f6;
}

.part-label.active {
  color: #374151;
  background: #e5e7eb;
}

.question-indices {
  display: flex;
  align-items: center;
  gap: 4px;
}

.question-index {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.question-index:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.question-index.active {
  color: white;
  background: #374151;
  border-color: #374151;
}

.question-index.answered:not(.active) {
  color: white;
  background: #22c55e;
  border-color: #22c55e;
}

.part-count {
  font-size: 13px;
  color: #9ca3af;
  white-space: nowrap;
  margin-left: 4px;
}

/* Floating navigation buttons */
.floating-nav {
  position: fixed;
  right: 24px;
  bottom: 90px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 50;
}

.float-btn {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: none;
  background: #1f2937;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.float-btn:hover:not(:disabled) {
  background: #111827;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.float-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.float-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.float-btn.prev {
  background: #4b5563;
}

.float-btn.prev:hover:not(:disabled) {
  background: #374151;
}

.float-btn svg {
  width: 18px;
  height: 18px;
}

/* Submit button in footer */
.submit-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: #1f2937;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.submit-btn:hover {
  background: #111827;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn svg {
  width: 18px;
  height: 18px;
}
</style>
