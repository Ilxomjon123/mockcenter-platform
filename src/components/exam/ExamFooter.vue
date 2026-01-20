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

    <div class="nav-buttons">
      <button
        v-if="getPreviousPartOrder !== null"
        @click="emit('changePage', getPreviousPartOrder!)"
        class="nav-btn back"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        v-if="!isLastPart && getNextPartOrder !== null"
        @click="emit('changePage', getNextPartOrder!)"
        class="nav-btn"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button v-else-if="isLastPart" @click="emit('submit')" class="nav-btn">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
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

// Get previous part order
const getPreviousPartOrder = computed(() => {
  const currentIndex = getCurrentIndex.value
  if (currentIndex > 0) {
    return partOrders.value[currentIndex - 1]
  }
  return null
})

// Get next part order
const getNextPartOrder = computed(() => {
  const currentIndex = getCurrentIndex.value
  if (currentIndex >= 0 && currentIndex < partOrders.value.length - 1) {
    return partOrders.value[currentIndex + 1]
  }
  return null
})

// Check if current page is the last part
const isLastPart = computed(() => {
  return getCurrentIndex.value === partOrders.value.length - 1
})
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

.nav-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

.nav-btn {
  background: #1f2937;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #111827;
}

.nav-btn.back {
  background: #4b5563;
}

.nav-btn.back:hover {
  background: #374151;
}

.nav-btn svg {
  width: 18px;
  height: 18px;
}
</style>
