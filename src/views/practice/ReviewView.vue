<template>
  <div class="review-view">
    <div class="review-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 19l-7-7 7-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back to Dashboard
      </button>
      <h1>Exam Review</h1>
    </div>

    <!-- Section Filter Tabs -->
    <div class="section-tabs">
      <button
        v-for="section in sections"
        :key="section.value"
        :class="{ active: reviewStore.selectedSection === section.value }"
        @click="reviewStore.setSelectedSection(section.value)"
      >
        {{ section.label }}
      </button>
    </div>

    <!-- Stats Overview -->
    <div v-if="reviewStore.sectionStats" class="stats-overview">
      <div class="stat-card listening">
        <div class="stat-label">Listening</div>
        <div class="stat-score">{{ reviewStore.sectionStats.listening.band }}</div>
        <div class="stat-details">
          {{ reviewStore.sectionStats.listening.correct }}/{{ reviewStore.sectionStats.listening.total }}
        </div>
      </div>
      <div class="stat-card reading">
        <div class="stat-label">Reading</div>
        <div class="stat-score">{{ reviewStore.sectionStats.reading.band }}</div>
        <div class="stat-details">
          {{ reviewStore.sectionStats.reading.correct }}/{{ reviewStore.sectionStats.reading.total }}
        </div>
      </div>
      <div class="stat-card writing">
        <div class="stat-label">Writing</div>
        <div class="stat-score">{{ reviewStore.sectionStats.writing.band }}</div>
        <div class="stat-details">AI Review</div>
      </div>
      <div class="stat-card speaking">
        <div class="stat-label">Speaking</div>
        <div class="stat-score">{{ reviewStore.sectionStats.speaking.band }}</div>
        <div class="stat-details">Feedback</div>
      </div>
    </div>

    <!-- Questions Review -->
    <div class="questions-section">
      <div class="section-header">
        <h2>{{ sectionTitle }} Questions</h2>
        <div class="summary">
          <span class="correct">{{ reviewStore.correctCount }} Correct</span>
          <span class="separator">•</span>
          <span class="incorrect">{{ reviewStore.incorrectCount }} Incorrect</span>
        </div>
      </div>

      <div class="questions-list">
        <div
          v-for="review in allReviews"
          :key="review.question_id"
          :class="['question-card', { correct: review.is_correct, incorrect: !review.is_correct }]"
        >
          <div class="question-header">
            <div class="question-number">Q{{ review.question_number }}</div>
            <div :class="['status-badge', review.is_correct ? 'correct' : 'incorrect']">
              {{ review.is_correct ? 'Correct' : 'Incorrect' }}
            </div>
          </div>

          <div class="question-content">
            <div class="user-answer">
              <span class="label">Your Answer:</span>
              <span :class="['answer', { correct: review.is_correct, incorrect: !review.is_correct }]"
                >{{ formatAnswer(review.user_answer) }}</span
              >
            </div>

            <div v-if="!review.is_correct" class="correct-answer">
              <span class="label">Correct Answer:</span>
              <span class="answer correct">{{ formatAnswer(review.correct_answer) }}</span>
            </div>

            <!-- Keywords Highlight -->
            <div v-if="review.keywords && review.keywords.length > 0" class="keywords-section">
              <span class="label">Keywords:</span>
              <div class="keywords-list">
                <span v-for="(keyword, index) in review.keywords" :key="index" class="keyword-tag">
                  {{ keyword }}
                </span>
              </div>
            </div>

            <!-- Explanation -->
            <div v-if="review.explanation" class="explanation">
              <span class="label">Explanation:</span>
              <p class="explanation-text">{{ review.explanation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Writing Review Section -->
      <div v-if="reviewStore.selectedSection === 'writing'" class="writing-reviews">
        <h2>Writing Tasks</h2>
        <div v-for="review in reviewStore.writingReviews" :key="review.question_id" class="writing-card">
          <div class="band-breakdown">
            <div class="band-item">
              <span class="band-label">Task Response</span>
              <span class="band-score">{{ review.task_response_band }}</span>
            </div>
            <div class="band-item">
              <span class="band-label">Coherence</span>
              <span class="band-score">{{ review.coherence_band }}</span>
            </div>
            <div class="band-item">
              <span class="band-label">Lexical Resource</span>
              <span class="band-score">{{ review.lexical_resource_band }}</span>
            </div>
            <div class="band-item">
              <span class="band-label">Grammar</span>
              <span class="band-score">{{ review.grammatical_band }}</span>
            </div>
            <div class="band-item overall">
              <span class="band-label">Overall Band</span>
              <span class="band-score">{{ review.band_score }}</span>
            </div>
          </div>

          <div class="ai-feedback">
            <h3>AI Feedback</h3>
            <p>{{ review.ai_feedback }}</p>
          </div>

          <!-- Corrections -->
          <div v-if="review.corrections && review.corrections.length > 0" class="corrections">
            <h3>Suggested Corrections</h3>
            <div v-for="(correction, index) in review.corrections" :key="index" class="correction-item">
              <div class="correction-original">"{{ correction.original }}"</div>
              <div class="correction-arrow">→</div>
              <div class="correction-corrected">"{{ correction.corrected }}"</div>
              <span class="correction-type">{{ correction.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores/reviewStore'

const route = useRoute()
const router = useRouter()
const reviewStore = useReviewStore()

const sections = [
  { label: 'All', value: 'all' },
  { label: 'Listening', value: 'listening' },
  { label: 'Reading', value: 'reading' },
  { label: 'Writing', value: 'writing' },
  { label: 'Speaking', value: 'speaking' },
]

const examId = computed(() => parseInt(route.params.examId as string))

const sectionTitle = computed(() => {
  const section = sections.find((s) => s.value === reviewStore.selectedSection)
  return section?.label || 'All'
})

const allReviews = computed(() => reviewStore.allReviews)

const formatAnswer = (answer: string | string[] | null | undefined): string => {
  if (!answer) return '-'
  if (Array.isArray(answer)) return answer.join(', ')
  return answer
}

const goBack = () => {
  router.push('/practice/dashboard')
}

onMounted(async () => {
  await reviewStore.fetchExamReview(examId.value)
})
</script>

<style scoped>
.review-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
}

.review-header {
  max-width: 1200px;
  margin: 0 auto 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: #f9fafb;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.review-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.section-tabs {
  max-width: 1200px;
  margin: 0 auto 24px;
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.section-tabs button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-tabs button.active {
  background: #f9fafb;
  color: #111827;
  font-weight: 600;
}

.stats-overview {
  max-width: 1200px;
  margin: 0 auto 32px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.stat-card.listening {
  border-top: 4px solid #3b82f6;
}

.stat-card.reading {
  border-top: 4px solid #10b981;
}

.stat-card.writing {
  border-top: 4px solid #f59e0b;
}

.stat-card.speaking {
  border-top: 4px solid #ef4444;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.stat-score {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-details {
  font-size: 14px;
  color: #6b7280;
}

.questions-section {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}

.summary .correct {
  color: #10b981;
}

.summary .incorrect {
  color: #ef4444;
}

.summary .separator {
  color: #d1d5db;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
}

.question-card.correct {
  border-left: 4px solid #10b981;
}

.question-card.incorrect {
  border-left: 4px solid #ef4444;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-number {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.correct {
  background: #d1fae5;
  color: #059669;
}

.status-badge.incorrect {
  background: #fee2e2;
  color: #dc2626;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-answer,
.correct-answer {
  display: flex;
  gap: 12px;
  font-size: 14px;
}

.label {
  font-weight: 600;
  color: #6b7280;
  min-width: 100px;
}

.answer {
  color: #111827;
}

.answer.correct {
  color: #059669;
  font-weight: 500;
}

.answer.incorrect {
  color: #dc2626;
  text-decoration: line-through;
}

.keywords-section {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.keyword-tag {
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
}

.explanation {
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
}

.explanation-text {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #92400e;
  line-height: 1.6;
}

.writing-reviews {
  margin-top: 32px;
}

.writing-reviews h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.writing-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.band-breakdown {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.band-item {
  text-align: center;
}

.band-item.overall {
  background: #059669;
  color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.band-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.band-item.overall .band-label {
  color: #fff;
}

.band-score {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.band-item.overall .band-score {
  color: #fff;
}

.ai-feedback {
  margin-bottom: 20px;
  padding: 16px;
  background: #ecfdf5;
  border-radius: 8px;
}

.ai-feedback h3 {
  font-size: 16px;
  font-weight: 600;
  color: #059669;
  margin: 0 0 12px 0;
}

.ai-feedback p {
  margin: 0;
  font-size: 14px;
  color: #047857;
  line-height: 1.6;
}

.corrections h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.correction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.correction-original {
  flex: 1;
  font-size: 14px;
  color: #dc2626;
  text-decoration: line-through;
}

.correction-arrow {
  color: #6b7280;
}

.correction-corrected {
  flex: 1;
  font-size: 14px;
  color: #059669;
  font-weight: 500;
}

.correction-type {
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

@media (max-width: 1024px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .band-breakdown {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .review-header h1 {
    font-size: 24px;
  }

  .section-tabs {
    flex-wrap: wrap;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .band-breakdown {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
