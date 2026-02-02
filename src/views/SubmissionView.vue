<template>
  <div class="submission-view">
    <ExamHeader />

    <div class="submission-content">
      <div class="submission-card">
        <div class="card-header">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1>Review & Submit</h1>
        </div>

        <p class="description">
          Please review your answers before final submission. Once submitted, you cannot make any
          changes.
        </p>

        <!-- Progress Summary -->
        <div class="progress-summary">
          <div v-if="hasListening" class="progress-item">
            <div class="progress-icon listening">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828"
                />
              </svg>
            </div>
            <div class="progress-info">
              <span class="progress-label">Listening</span>
              <span class="progress-status" :class="listeningStatus.class">{{
                listeningStatus.text
              }}</span>
            </div>
            <span class="progress-count">{{ listeningAnsweredCount }}/{{ listeningTotalQuestions }}</span>
          </div>

          <div v-if="hasReading" class="progress-item">
            <div class="progress-icon reading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div class="progress-info">
              <span class="progress-label">Reading</span>
              <span class="progress-status" :class="readingStatus.class">{{
                readingStatus.text
              }}</span>
            </div>
            <span class="progress-count">{{ readingAnsweredCount }}/{{ readingTotalQuestions }}</span>
          </div>

          <div v-if="hasWriting" class="progress-item">
            <div class="progress-icon writing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div class="progress-info">
              <span class="progress-label">Writing</span>
              <span class="progress-status" :class="writingStatus.class">{{
                writingStatus.text
              }}</span>
            </div>
            <span class="progress-count">{{ writingAnsweredCount }}/{{ writingTotalQuestions }}</span>
          </div>
        </div>

        <!-- Warning -->
        <div v-if="hasUnanswered" class="warning-box">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          <span>You have unanswered questions. Are you sure you want to submit?</span>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn-secondary" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
          <button class="btn-primary" :disabled="isSubmitting" @click="handleSubmit">
            <svg v-if="!isSubmitting" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Submitting...' : 'Submit Exam' }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="isConfirmModalOpen"
      title="Submit Exam"
      message="Are you sure you want to submit your exam? This action cannot be undone."
      confirm-text="Yes, submit"
      cancel-text="Cancel"
      type="warning"
      @confirm="confirmSubmit"
      @cancel="isConfirmModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'
import { useAuthStore } from '@/stores/authStore'
import { QuestionType } from '@/types/test'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const route = useRoute()
const listeningStore = useListeningStore()
const readingStore = useReadingStore()
const writingStore = useWritingStore()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const isConfirmModalOpen = ref(false)

// Check if sections are available
const hasListening = computed(() => !!listeningStore.test?.parts?.length)
const hasReading = computed(() => !!readingStore.test?.parts?.length)
const hasWriting = computed(() => !!writingStore.test?.parts?.length)

// Helper function to count questions in a part
const countQuestionsInPart = (part: { content?: string | null; questions?: Array<{ type: string; content?: string | null; answers_count?: number; children?: Array<{ type: string; content?: string | null }> }> }): number => {
  let count = 0

  const countGapsAndMatches = (text: string | null | undefined): number => {
    if (!text) return 0
    const gaps = (text.match(/\[gap\]/g) || []).length
    const matches = (text.match(/\[match\]/g) || []).length
    return gaps + matches
  }

  // Count gaps in part content
  count += countGapsAndMatches(part.content)

  // Count questions
  if (part.questions) {
    for (const q of part.questions) {
      if (q.type === QuestionType.TRUE_FALSE_NOT_GIVEN || q.type === QuestionType.YES_NO_NOT_GIVEN) {
        count += 1
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        count += q.answers_count || 1
      }
      count += countGapsAndMatches(q.content)

      // Count children
      if (q.children) {
        for (const child of q.children) {
          if (child.type === QuestionType.TRUE_FALSE_NOT_GIVEN || child.type === QuestionType.YES_NO_NOT_GIVEN) {
            count += 1
          }
          count += countGapsAndMatches(child.content)
        }
      }
    }
  }

  return count
}

// Calculate total questions for each section
const listeningTotalQuestions = computed(() => {
  if (!listeningStore.test?.parts) return 0
  return listeningStore.test.parts.reduce((total, part) => total + countQuestionsInPart(part), 0)
})

const readingTotalQuestions = computed(() => {
  if (!readingStore.test?.parts) return 0
  return readingStore.test.parts.reduce((total, part) => total + countQuestionsInPart(part), 0)
})

const writingTotalQuestions = computed(() => {
  if (!writingStore.test?.parts) return 0
  return writingStore.test.parts.length
})

const listeningAnsweredCount = computed(() => {
  const answers = listeningStore.answers as Record<string, unknown>
  return Object.keys(answers).filter((key) => answers[key]).length
})

const readingAnsweredCount = computed(() => {
  const answers = readingStore.answers as Record<string, unknown>
  return Object.keys(answers).filter((key) => answers[key]).length
})

const writingAnsweredCount = computed(() => {
  const answers = writingStore.answers as Record<string, unknown>
  return Object.keys(answers).filter((key) => answers[key] && String(answers[key]).trim()).length
})

const listeningStatus = computed(() => {
  if (!hasListening.value) return { text: 'Not Available', class: 'not-started' }
  if (listeningStore.isCompleted) {
    return { text: 'Completed', class: 'completed' }
  }
  if (listeningAnsweredCount.value > 0) {
    return { text: 'In Progress', class: 'in-progress' }
  }
  return { text: 'Not Started', class: 'not-started' }
})

const readingStatus = computed(() => {
  if (!hasReading.value) return { text: 'Not Available', class: 'not-started' }
  if (readingStore.isCompleted) {
    return { text: 'Completed', class: 'completed' }
  }
  if (readingAnsweredCount.value > 0) {
    return { text: 'In Progress', class: 'in-progress' }
  }
  return { text: 'Not Started', class: 'not-started' }
})

const writingStatus = computed(() => {
  if (!hasWriting.value) return { text: 'Not Available', class: 'not-started' }
  if (writingStore.isCompleted) {
    return { text: 'Completed', class: 'completed' }
  }
  if (writingAnsweredCount.value > 0) {
    return { text: 'In Progress', class: 'in-progress' }
  }
  return { text: 'Not Started', class: 'not-started' }
})

const hasUnanswered = computed(() => {
  let unanswered = false

  if (hasListening.value && listeningAnsweredCount.value < listeningTotalQuestions.value) {
    unanswered = true
  }
  if (hasReading.value && readingAnsweredCount.value < readingTotalQuestions.value) {
    unanswered = true
  }
  if (hasWriting.value && writingAnsweredCount.value < writingTotalQuestions.value) {
    unanswered = true
  }

  return unanswered
})

const goBack = () => {
  // Check if we have a 'from' query param indicating which section user came from
  const fromSection = route.query.from as string

  if (fromSection) {
    // Navigate back to the section user came from
    if (fromSection === 'listening' && listeningStore.test?.parts?.length) {
      router.push({ name: 'listening' })
      return
    }
    if (fromSection === 'reading' && readingStore.test?.parts?.length) {
      router.push({ name: 'reading' })
      return
    }
    if (fromSection === 'writing' && writingStore.test?.parts?.length) {
      router.push({ name: 'writing' })
      return
    }
  }

  // Fallback: Navigate to last available section for review
  if (writingStore.test?.parts?.length) {
    router.push({ name: 'writing' })
  } else if (readingStore.test?.parts?.length) {
    router.push({ name: 'reading' })
  } else if (listeningStore.test?.parts?.length) {
    router.push({ name: 'listening' })
  } else {
    window.history.back()
  }
}

const handleSubmit = () => {
  if (isSubmitting.value) return
  isConfirmModalOpen.value = true
}

const confirmSubmit = async () => {
  isConfirmModalOpen.value = false
  isSubmitting.value = true

  // Default values
  let queryParams = {
    l_c: '0',
    r_c: '0',
    l_s: '0',
    r_s: '0',
    o: '0',
  }

  try {
    const result = await authStore.submitExam()

    // Use API results if available
    if (result.success && result.results) {
      queryParams = {
        l_c: result.results.listening_count.toString(),
        r_c: result.results.reading_count.toString(),
        l_s: result.results.listening_score.toString(),
        r_s: result.results.reading_score.toString(),
        o: result.results.overall.toString(),
      }
    }
  } catch (error) {
    console.error('Submit exam error:', error)
  }

  // Always navigate to completed page after submit attempt
  try {
    await authStore.logout('/completed?' + new URLSearchParams(queryParams).toString())
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: force navigation
    window.location.href = '/completed?' + new URLSearchParams(queryParams).toString()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.submission-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.submission-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 85px);
  padding: 40px 20px;
}

.submission-card {
  background: white;
  border-radius: 20px;
  padding: 36px;
  max-width: 520px;
  width: 100%;
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.03);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  color: #10b981;
}

.card-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.3px;
}

.description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 28px;
}

.progress-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.progress-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.progress-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.progress-icon svg {
  width: 22px;
  height: 22px;
  color: white;
}

.progress-icon.listening {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.progress-icon.reading {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.progress-icon.writing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.progress-status {
  font-size: 12px;
  font-weight: 500;
}

.progress-status.completed {
  color: #10b981;
}

.progress-status.in-progress {
  color: #f59e0b;
}

.progress-status.not-started {
  color: #94a3b8;
}

.progress-count {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
  border-radius: 14px;
  margin-bottom: 20px;
}

.warning-box svg {
  width: 22px;
  height: 22px;
  color: #d97706;
  flex-shrink: 0;
  margin-top: 1px;
}

.warning-box span {
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary {
  background: white;
  border: 1.5px solid #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
}

.btn-secondary svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
