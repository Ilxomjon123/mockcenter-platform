<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useCscaStore } from '@/stores/cscaStore'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/composables/useApi'
import { CSCA_SUBJECT_LABELS } from '@/types/csca'
import type { CscaSubmitSessionResponse } from '@/types/csca'
import { renderMathInHtml } from '@/utils/mathRenderer'

const router = useRouter()
const cscaStore = useCscaStore()
const authStore = useAuthStore()
const { post } = useApi()

const isSubmitting = ref(false)
const showConfirmSubmit = ref(false)
const submitError = ref('')

const session = computed(() => cscaStore.activeSession)
const questions = computed(() => session.value?.questions || [])
const currentIndex = computed(() => cscaStore.currentQuestionIndex)
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const subjectLabel = computed(() =>
  session.value ? CSCA_SUBJECT_LABELS[session.value.subject] || session.value.subject : '',
)
const answers = computed(() => cscaStore.activeAnswers)
const answeredCount = computed(() => Object.keys(answers.value).length)

const renderedTitle = computed(() =>
  currentQuestion.value ? renderMathInHtml(currentQuestion.value.title) : '',
)
const renderedOptions = computed<Array<{ key: string; html: string }>>(() => {
  if (!currentQuestion.value) return []
  return Object.entries(currentQuestion.value.options).map(([key, text]) => ({
    key,
    html: renderMathInHtml(String(text)),
  }))
})

// Live-ticking timer
const secondsLeft = ref(0)
let timerId: number | undefined

// Retry auto-submit on failure instead of fabricating a zero score
const AUTO_SUBMIT_RETRY_DELAY_MS = 5000
let autoSubmitRetryId: number | undefined

function clearAutoSubmitRetry() {
  if (autoSubmitRetryId) {
    window.clearTimeout(autoSubmitRetryId)
    autoSubmitRetryId = undefined
  }
}

function scheduleAutoSubmitRetry() {
  clearAutoSubmitRetry()
  autoSubmitRetryId = window.setTimeout(() => {
    autoSubmitRetryId = undefined
    submitSession(true)
  }, AUTO_SUBMIT_RETRY_DELAY_MS)
}

function recalcTime() {
  secondsLeft.value = cscaStore.getTimeLeftSeconds() ?? 0
}

const timeDisplay = computed(() => {
  const s = secondsLeft.value
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
})

const isLowTime = computed(() => secondsLeft.value <= 5 * 60)

// Mark for review (local only)
const reviewSet = ref<Set<number>>(new Set())
function toggleReview() {
  if (!currentQuestion.value) return
  const id = currentQuestion.value.id
  if (reviewSet.value.has(id)) reviewSet.value.delete(id)
  else reviewSet.value.add(id)
  // trigger reactivity
  reviewSet.value = new Set(reviewSet.value)
}
const isCurrentMarked = computed(
  () => !!currentQuestion.value && reviewSet.value.has(currentQuestion.value.id),
)

function selectOption(option: string) {
  if (!currentQuestion.value) return
  cscaStore.setAnswer(currentQuestion.value.id, option)
}

function isSelected(questionId: number, option: string) {
  return answers.value[questionId] === option
}

function isQuestionAnswered(questionId: number) {
  return answers.value[questionId] !== undefined
}

async function submitSession(isAutoSubmit = false) {
  if (!session.value) return
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''
  showConfirmSubmit.value = false

  try {
    const sessionId = session.value.session_id
    const response = await post<CscaSubmitSessionResponse>(
      `/api/exam/subject/sessions/${sessionId}/submit`,
      { answers: answers.value },
    )

    if (response?.result) {
      clearAutoSubmitRetry()
      cscaStore.markSubmitted(sessionId, response.result)
      isExamActive.value = false

      if (response.all_submitted) {
        router.push({ name: 'csca-results' })
      } else {
        router.push({ name: 'csca-subjects' })
      }
    } else {
      submitError.value = 'Failed to submit. Please try again.'
    }
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Submission failed'
    if (isAutoSubmit && session.value) {
      // The backend never received the answers — do not mark the session as
      // submitted with a fabricated score. Keep it active and keep retrying
      // until the submit actually succeeds.
      isExamActive.value = true
      scheduleAutoSubmitRetry()
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleSubmitClick() {
  showConfirmSubmit.value = true
}
function confirmSubmit() {
  submitSession(false)
}
function cancelSubmit() {
  showConfirmSubmit.value = false
}

// Prevent leaving (browser tab close / refresh)
const isExamActive = ref(false)

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isExamActive.value) {
    e.preventDefault()
  }
}

// Prevent vue-router navigation away during active exam
onBeforeRouteLeave((_to, _from, next) => {
  if (isExamActive.value && !isSubmitting.value) {
    const leave = window.confirm(
      'Exam is in progress! If you leave, your time will keep ticking. Are you sure?'
    )
    next(leave)
  } else {
    next()
  }
})

onMounted(() => {
  cscaStore.restore()

  if (!session.value) {
    router.replace({ name: 'csca-subjects' })
    return
  }

  isExamActive.value = true
  window.addEventListener('beforeunload', handleBeforeUnload)

  recalcTime()
  timerId = window.setInterval(() => {
    recalcTime()
    if (secondsLeft.value <= 0) {
      window.clearInterval(timerId)
      isExamActive.value = false
      submitSession(true)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerId) window.clearInterval(timerId)
  clearAutoSubmitRetry()
  isExamActive.value = false
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleKeydown(e: KeyboardEvent) {
  if (showConfirmSubmit.value) return
  if (e.key === 'F4') {
    e.preventDefault()
    cscaStore.prevQuestion()
  }
  if (e.key === 'F5') {
    e.preventDefault()
    cscaStore.nextQuestion()
  }
  if (e.key === 'ArrowLeft') cscaStore.prevQuestion()
  if (e.key === 'ArrowRight') cscaStore.nextQuestion()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

watch(
  () => cscaStore.activeSessionId,
  (val) => {
    if (!val) router.replace({ name: 'csca-subjects' })
  },
)

const canGoBack = computed(() => currentIndex.value > 0)
const canGoNext = computed(() => currentIndex.value < questions.value.length - 1)
</script>

<template>
  <div class="csca-exam" v-if="session && currentQuestion">
    <div class="csca-exam__card">
      <!-- Header -->
      <header class="csca-header">
        <div class="csca-header__taker">
          <div class="csca-header__info">
            <div><span>Name:</span> {{ authStore.takerName }}</div>
            <div><span>ID:</span> {{ authStore.takerNumber }}</div>
          </div>
        </div>

        <div class="csca-header__center">
          <h1 class="csca-header__title">Question {{ currentIndex + 1 }}</h1>
          <button class="csca-header__review" @click="toggleReview">
            <span class="csca-header__star" :class="{ 'csca-header__star--on': isCurrentMarked }">
              ★
            </span>
            Mark for review
          </button>
        </div>

        <div class="csca-header__right">
          <button class="csca-header__submit" @click="handleSubmitClick" :disabled="isSubmitting">
            Submit
          </button>
          <div class="csca-header__nav">
            <div class="csca-nav-btn-wrap">
              <button
                class="csca-nav-btn"
                :disabled="!canGoBack"
                @click="cscaStore.prevQuestion()"
              >
                Back
              </button>
              <span class="csca-nav-btn__key">F4</span>
            </div>
            <div class="csca-nav-btn-wrap">
              <button
                class="csca-nav-btn csca-nav-btn--primary"
                :disabled="!canGoNext"
                @click="cscaStore.nextQuestion()"
              >
                Next
              </button>
              <span class="csca-nav-btn__key">F5</span>
            </div>
          </div>
          <div class="csca-header__timer" :class="{ 'csca-header__timer--low': isLowTime }">
            {{ timeDisplay }}
          </div>
        </div>
      </header>

      <div class="csca-body">
        <!-- Question grid sidebar -->
        <aside class="csca-sidebar">
          <div class="csca-grid">
            <button
              v-for="(q, i) in questions"
              :key="q.id"
              class="csca-grid__cell"
              :class="{
                'csca-grid__cell--active': i === currentIndex,
                'csca-grid__cell--answered': isQuestionAnswered(q.id),
                'csca-grid__cell--review': reviewSet.has(q.id),
              }"
              @click="cscaStore.goToQuestion(i)"
            >
              {{ i + 1 }}
            </button>
          </div>
        </aside>

        <!-- Main content -->
        <main class="csca-main">
          <div class="csca-subject-tag">{{ subjectLabel }}</div>
          <div class="csca-hint">
            Each question has four options among which only one of them is correct.
          </div>

          <div class="csca-question" v-html="renderedTitle"></div>

          <div class="csca-options">
            <button
              v-for="opt in renderedOptions"
              :key="opt.key"
              class="csca-option"
              :class="{ 'csca-option--selected': isSelected(currentQuestion.id, opt.key) }"
              @click="selectOption(opt.key)"
            >
              <span class="csca-option__radio">
                <span
                  v-if="isSelected(currentQuestion.id, opt.key)"
                  class="csca-option__radio-inner"
                />
              </span>
              <span class="csca-option__text">
                <span class="csca-option__label">({{ opt.key }})</span>
                <span v-html="opt.html"></span>
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- Confirm submit modal -->
    <div v-if="showConfirmSubmit" class="csca-modal-backdrop" @click="cancelSubmit">
      <div class="csca-modal" @click.stop>
        <h3 class="csca-modal__title">Submit {{ subjectLabel }}?</h3>
        <p class="csca-modal__text">
          Answered {{ answeredCount }} of {{ questions.length }}. You cannot change answers after
          submission.
        </p>
        <div class="csca-modal__actions">
          <button class="csca-modal__btn" @click="cancelSubmit">Cancel</button>
          <button class="csca-modal__btn csca-modal__btn--primary" @click="confirmSubmit">
            Yes, submit
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitError" class="csca-toast">{{ submitError }}</div>
  </div>
</template>

<style scoped>
/* Fluid design tokens — scale smoothly from 360px to 2560px viewports */
.csca-exam {
  --fs-xs: clamp(0.7rem, 0.6rem + 0.18vw, 0.875rem);
  --fs-sm: clamp(0.8rem, 0.7rem + 0.22vw, 1rem);
  --fs-base: clamp(0.9rem, 0.78rem + 0.32vw, 1.2rem);
  --fs-md: clamp(1rem, 0.84rem + 0.42vw, 1.35rem);
  --fs-lg: clamp(1.15rem, 0.95rem + 0.55vw, 1.6rem);
  --fs-xl: clamp(1.4rem, 1.1rem + 0.8vw, 2rem);
  --fs-2xl: clamp(1.6rem, 1.2rem + 1.1vw, 2.5rem);

  --gap-xs: clamp(0.25rem, 0.2rem + 0.15vw, 0.5rem);
  --gap-sm: clamp(0.4rem, 0.3rem + 0.25vw, 0.75rem);
  --gap-md: clamp(0.75rem, 0.6rem + 0.4vw, 1.25rem);
  --gap-lg: clamp(1rem, 0.7rem + 0.8vw, 2rem);
  --gap-xl: clamp(1.5rem, 1rem + 1.2vw, 3rem);

  --radius: clamp(8px, 0.4rem + 0.3vw, 16px);
  --radius-sm: clamp(6px, 0.3rem + 0.2vw, 12px);

  min-height: 100vh;
  background: #0b1220;
  padding: var(--gap-lg) var(--gap-md);
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
  font-size: var(--fs-base);
  display: flex;
  flex-direction: column;
}

.csca-exam__card {
  width: 100%;
  max-width: min(1800px, 100%);
  margin: 0 auto;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: var(--radius);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* -------- Header -------- */
.csca-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--gap-lg);
  align-items: center;
  padding: var(--gap-md) var(--gap-lg);
  border-bottom: 1px solid #1f2937;
}

.csca-header__taker {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
}

.csca-header__photo {
  width: clamp(52px, 2.5rem + 1.5vw, 80px);
  height: clamp(52px, 2.5rem + 1.5vw, 80px);
  border: 1px solid #374151;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--fs-xs);
  color: #9ca3af;
  line-height: 1.15;
  flex-shrink: 0;
}

.csca-header__info {
  font-size: var(--fs-xs);
  color: #9ca3af;
  line-height: 1.6;
}

.csca-header__info span {
  color: #6b7280;
}

.csca-header__center {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 0;
}

.csca-header__title {
  font-size: var(--fs-xl);
  font-weight: 700;
  margin: 0;
  color: #f9fafb;
  line-height: 1.1;
}

.csca-header__review {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: var(--fs-sm);
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  width: fit-content;
  font-family: inherit;
}

.csca-header__review:hover {
  color: #d1d5db;
}

.csca-header__star {
  font-size: 1.1em;
  color: #6b7280;
}

.csca-header__star--on {
  color: #facc15;
}

.csca-header__right {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.csca-header__submit {
  background: #22c55e;
  color: white;
  border: none;
  padding: 0.6em 1.3em;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--fs-sm);
  cursor: pointer;
  font-family: inherit;
}

.csca-header__submit:hover:not(:disabled) {
  background: #16a34a;
}

.csca-header__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.csca-header__nav {
  display: flex;
  gap: var(--gap-sm);
}

.csca-nav-btn-wrap {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.csca-nav-btn {
  background: #374151;
  color: #e5e7eb;
  border: none;
  padding: 0.6em 1em;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: var(--fs-sm);
  cursor: pointer;
  font-family: inherit;
}

.csca-nav-btn:hover:not(:disabled) {
  background: #4b5563;
}

.csca-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.csca-nav-btn--primary {
  background: #3b82f6;
}

.csca-nav-btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.csca-nav-btn__key {
  font-size: var(--fs-xs);
  color: #6b7280;
  font-weight: 500;
}

.csca-header__timer {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: var(--fs-md);
  font-weight: 600;
  color: #e5e7eb;
  padding: 0 var(--gap-sm);
  min-width: 5ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.csca-header__timer--low {
  color: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

/* -------- Body -------- */
.csca-body {
  display: grid;
  grid-template-columns: clamp(220px, 18vw, 340px) 1fr;
  gap: 0;
  min-height: 0;
  flex: 1;
}

.csca-sidebar {
  padding: var(--gap-md);
  border-right: 1px solid #1f2937;
  overflow-y: auto;
}

.csca-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--gap-sm);
}

.csca-grid__cell {
  aspect-ratio: 1;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: var(--radius-sm);
  color: #d1d5db;
  font-weight: 600;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.1s;
  font-family: inherit;
}

.csca-grid__cell:hover {
  background: #374151;
}

.csca-grid__cell--answered {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #dbeafe;
}

.csca-grid__cell--active {
  background: #1f2937;
  border-color: #22c55e;
  outline: 2px solid #22c55e;
  outline-offset: -2px;
  color: #f9fafb;
}

.csca-grid__cell--review {
  position: relative;
}

.csca-grid__cell--review::after {
  content: '★';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.7em;
  color: #facc15;
}

/* -------- Main -------- */
.csca-main {
  padding: var(--gap-lg) var(--gap-xl) var(--gap-xl);
  min-width: 0;
  overflow-y: auto;
}

.csca-subject-tag {
  font-size: var(--fs-xs);
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: right;
  margin-bottom: var(--gap-sm);
}

.csca-hint {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: var(--radius-sm);
  padding: 0.75em 1em;
  font-size: var(--fs-sm);
  color: #9ca3af;
  margin-bottom: var(--gap-lg);
}

.csca-question {
  font-size: var(--fs-base);
  line-height: 1.7;
  color: #e5e7eb;
  margin-bottom: var(--gap-xl);
}

.csca-question :deep(img) {
  max-width: 100%;
  height: auto;
}

.csca-question :deep(p) {
  margin: 0 0 0.5em;
}

.csca-question :deep(.katex) {
  font-size: 1.1em;
}

.csca-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-md) var(--gap-xl);
}

.csca-option {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-sm);
  padding: 0.5em 0.7em;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: #e5e7eb;
  text-align: left;
  font-size: var(--fs-base);
  transition: background 0.1s;
  font-family: inherit;
}

.csca-option:hover {
  background: #1f2937;
}

.csca-option--selected .csca-option__radio {
  border-color: #3b82f6;
}

.csca-option__radio {
  width: 1.1em;
  height: 1.1em;
  border: 1.5px solid #6b7280;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.35em;
}

.csca-option__radio-inner {
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  background: #3b82f6;
}

.csca-option__text {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  flex-wrap: wrap;
}

.csca-option__label {
  font-weight: 500;
  color: #9ca3af;
  flex-shrink: 0;
}

.csca-option--selected .csca-option__label {
  color: #e5e7eb;
}

.csca-option__text :deep(img) {
  max-width: 100%;
  height: auto;
}

.csca-option__text :deep(.katex) {
  font-size: 1.05em;
}

/* -------- Modal -------- */
.csca-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--gap-md);
}

.csca-modal {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: var(--radius);
  padding: var(--gap-xl);
  max-width: 480px;
  width: 100%;
}

.csca-modal__title {
  font-size: var(--fs-lg);
  font-weight: 700;
  margin: 0 0 var(--gap-md);
  color: #f9fafb;
}

.csca-modal__text {
  color: #9ca3af;
  margin: 0 0 var(--gap-lg);
  line-height: 1.55;
  font-size: var(--fs-sm);
}

.csca-modal__actions {
  display: flex;
  gap: var(--gap-sm);
  justify-content: flex-end;
}

.csca-modal__btn {
  padding: 0.65em 1.3em;
  border-radius: var(--radius-sm);
  border: 1px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  font-weight: 600;
  cursor: pointer;
  font-size: var(--fs-sm);
  font-family: inherit;
}

.csca-modal__btn--primary {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

.csca-modal__btn--primary:hover {
  background: #16a34a;
}

.csca-toast {
  position: fixed;
  bottom: var(--gap-md);
  right: var(--gap-md);
  background: #ef4444;
  color: white;
  padding: 0.75em 1em;
  border-radius: var(--radius-sm);
  max-width: 360px;
  font-size: var(--fs-sm);
}

/* -------- Responsive: tablet -------- */
@media (max-width: 1024px) {
  .csca-body {
    grid-template-columns: 200px 1fr;
  }
  .csca-main {
    padding: var(--gap-md) var(--gap-lg) var(--gap-lg);
  }
}

/* -------- Responsive: mobile -------- */
@media (max-width: 768px) {
  .csca-exam {
    padding: var(--gap-sm);
  }
  .csca-header {
    grid-template-columns: 1fr;
    gap: var(--gap-sm);
    padding: var(--gap-sm) var(--gap-md);
  }
  .csca-header__taker {
    gap: var(--gap-sm);
  }
  .csca-header__right {
    gap: var(--gap-sm);
  }
  .csca-header__nav {
    flex: 1;
  }
  .csca-nav-btn {
    flex: 1;
  }
  .csca-nav-btn__key {
    display: none;
  }
  .csca-body {
    grid-template-columns: 1fr;
  }
  .csca-sidebar {
    border-right: none;
    border-bottom: 1px solid #1f2937;
    padding: var(--gap-sm);
  }
  .csca-grid {
    grid-template-columns: repeat(8, 1fr);
  }
  .csca-main {
    padding: var(--gap-md);
  }
  .csca-options {
    grid-template-columns: 1fr;
    gap: var(--gap-sm);
  }
}

/* -------- Responsive: very large screens -------- */
@media (min-width: 1920px) {
  .csca-exam {
    padding: var(--gap-xl) var(--gap-lg);
  }
  .csca-main {
    padding: var(--gap-xl) calc(var(--gap-xl) * 1.5) var(--gap-xl);
  }
}
</style>
