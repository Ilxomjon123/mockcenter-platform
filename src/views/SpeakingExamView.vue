<template>
  <div class="speaking-exam">
    <ExamHeader />

    <div class="exam-content">
      <div class="part-selector">
        <button
          v-for="part in parts"
          :key="part.value"
          :class="{ active: speakingStore.currentPart === part.value }"
          @click="selectPart(part.value)"
        >
          {{ part.label }}
        </button>
      </div>

      <div class="question-container">
        <!-- Part 1: Quick Questions -->
        <div v-if="speakingStore.currentPart === SpeakingPart.PART_1" class="part-content">
          <div class="part-header">
            <h2>Part 1: Introduction & Interview</h2>
            <p>Answer general questions about yourself and familiar topics.</p>
          </div>

          <div v-if="currentQuestion" class="question-card">
            <div class="question-number">
              Question {{ speakingStore.currentQuestionNumber }} of {{ speakingStore.totalQuestions }}
            </div>
            <div class="question-text">{{ currentQuestion.content || currentQuestion.title }}</div>
          </div>
        </div>

        <!-- Part 2: Long Turn -->
        <div v-else-if="speakingStore.currentPart === SpeakingPart.PART_2" class="part-content">
          <div class="part-header">
            <h2>Part 2: Individual Long Turn</h2>
            <p>You have 1 minute to prepare and 2 minutes to speak.</p>
          </div>

          <div v-if="currentQuestion" class="question-card">
            <div class="question-number">
              Question {{ speakingStore.currentQuestionNumber }} of {{ speakingStore.totalQuestions }}
            </div>
            <div class="question-text">{{ currentQuestion.prompt_text || currentQuestion.content }}</div>
          </div>
        </div>

        <!-- Part 3: Discussion -->
        <div v-else class="part-content">
          <div class="part-header">
            <h2>Part 3: Two-way Discussion</h2>
            <p>Discuss abstract issues related to Part 2 topic.</p>
          </div>

          <div v-if="currentQuestion" class="question-card">
            <div class="question-number">
              Question {{ speakingStore.currentQuestionNumber }} of {{ speakingStore.totalQuestions }}
            </div>
            <div class="question-text">{{ currentQuestion.content || currentQuestion.title }}</div>
          </div>
        </div>

        <!-- Timer Section -->
        <div class="timer-section">
          <!-- Part 2: Preparation Timer -->
          <div
            v-if="speakingStore.currentPart === SpeakingPart.PART_2 && speakingStore.recordingState === RecordingState.PREPARING"
            class="timer-card preparing"
          >
            <div class="timer-label">Preparation Time</div>
            <div class="timer-display">{{ formatTime(speakingStore.preparationElapsedSeconds) }}</div>
            <div class="timer-progress">
              <div
                class="progress-bar"
                :style="{ width: `${(speakingStore.preparationElapsedSeconds / (currentQuestion?.preparation_time_seconds || 60)) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Recording Timer -->
          <div v-else-if="speakingStore.isRecording" class="timer-card recording">
            <div class="timer-label">Recording Time</div>
            <div class="timer-display">{{ formatTime(speakingStore.elapsedSeconds) }}</div>
            <div class="timer-progress">
              <div
                class="progress-bar"
                :style="{ width: `${(speakingStore.elapsedSeconds / (currentQuestion?.time_limit_seconds || 120)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Audio Controls -->
        <div class="audio-controls">
          <!-- Start/Stop Recording Button -->
          <button
            v-if="!speakingStore.isRecording && !speakingStore.hasRecording"
            class="record-btn"
            @click="handleRecord"
            :disabled="speakingStore.recordingState === RecordingState.PREPARING"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
            {{ speakingStore.currentPart === SpeakingPart.PART_2 ? 'Start' : 'Start Recording' }}
          </button>

          <button
            v-else-if="speakingStore.isRecording"
            class="record-btn stop"
            @click="handleStopRecording"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop Recording
          </button>

          <!-- Review Recording -->
          <div v-else-if="speakingStore.hasRecording" class="review-controls">
            <audio :src="speakingStore.audioUrl || ''" controls class="audio-player"></audio>

            <div class="review-actions">
              <button class="action-btn" @click="handleDelete">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Delete
              </button>

              <button class="action-btn" @click="handleSave">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Save
              </button>
            </div>
          </div>

          <!-- Start Preparation (Part 2 only) -->
          <button
            v-if="speakingStore.currentPart === SpeakingPart.PART_2 && !speakingStore.hasRecording && speakingStore.recordingState === RecordingState.IDLE"
            class="prepare-btn"
            @click="handleStartPreparation"
          >
            Start 1-Minute Preparation
          </button>
        </div>

        <!-- Navigation -->
        <div class="navigation-controls">
          <button
            class="nav-btn prev"
            @click="handlePrevious"
            :disabled="speakingStore.currentQuestionIndex === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Previous
          </button>

          <button
            class="nav-btn next"
            @click="handleNext"
            :disabled="!hasAnsweredCurrentQuestion || speakingStore.isPartCompleted"
          >
            Next
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- Submit Button -->
        <div v-if="speakingStore.isExamCompleted" class="submit-section">
          <button class="submit-btn" @click="handleSubmit">
            Submit Speaking Exam
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpeakingStore } from '@/stores/speakingStore'
import { useAuthStore } from '@/stores/authStore'
import { SpeakingPart, RecordingState } from '@/types/speaking'
import ExamHeader from '@/components/exam/ExamHeader.vue'

const router = useRouter()
const speakingStore = useSpeakingStore()
const authStore = useAuthStore()

const mediaRecorder = ref<MediaRecorder | null>(null)

const parts = [
  { label: 'Part 1', value: SpeakingPart.PART_1 },
  { label: 'Part 2', value: SpeakingPart.PART_2 },
  { label: 'Part 3', value: SpeakingPart.PART_3 },
]

const currentQuestion = computed(() => speakingStore.currentQuestion)

const hasAnsweredCurrentQuestion = computed(() => speakingStore.hasRecording)

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const selectPart = (part: SpeakingPart) => {
  speakingStore.setPart(part)
}

const handleStartPreparation = () => {
  speakingStore.startPreparationTimer()
}

const handleRecord = async () => {
  const result = await speakingStore.startRecording()
  if (result.success && result.mediaRecorder) {
    mediaRecorder.value = result.mediaRecorder
  } else {
    alert('Could not access microphone. Please ensure you have granted permission.')
  }
}

const handleStopRecording = () => {
  speakingStore.stopRecording(mediaRecorder.value || undefined)
  mediaRecorder.value = null
}

const handleDelete = () => {
  speakingStore.deleteRecording()
}

const handleSave = () => {
  const result = speakingStore.saveRecording()
  if (result.success) {
    // Move to next question automatically
    handleNext()
  }
}

const handlePrevious = () => {
  speakingStore.previousQuestion()
}

const handleNext = () => {
  if (speakingStore.isPartCompleted) {
    // Move to next part
    const partIndex = parts.findIndex((p) => p.value === speakingStore.currentPart)
    if (partIndex < parts.length - 1) {
      speakingStore.setPart(parts[partIndex + 1].value)
    }
  } else {
    speakingStore.nextQuestion()
  }
}

const handleSubmit = async () => {
  const confirmed = confirm('Are you sure you want to submit your speaking exam?')
  if (!confirmed) return

  // Upload all recordings
  await speakingStore.uploadAllRecordings()

  // Submit exam
  const result = await authStore.submitExam()

  if (result.success) {
    router.push({
      name: 'practice-completed',
      query: {
        l_c: '0',
        r_c: '0',
        l_s: '0',
        r_s: '0',
        o: '0',
        speaking: 'pending',
      },
    })
  }
}

onMounted(async () => {
  // Fetch test data if not loaded
  if (!authStore.isLoadingTest) {
    await authStore.fetchTestData()
  }
})

onUnmounted(() => {
  // Cleanup
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
})
</script>

<style scoped>
.speaking-exam {
  min-height: 100vh;
  background: #f9fafb;
}

.exam-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.part-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.part-selector button {
  flex: 1;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.part-selector button.active {
  border-color: #059669;
  background: #ecfdf5;
  color: #059669;
}

.question-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
}

.part-header {
  text-align: center;
  margin-bottom: 32px;
}

.part-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.part-header p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.question-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.question-number {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 16px;
}

.question-text {
  font-size: 24px;
  font-weight: 500;
  color: #111827;
  line-height: 1.6;
}

.timer-section {
  margin-bottom: 32px;
}

.timer-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.timer-card.preparing {
  border-color: #f59e0b;
  background: #fffbeb;
}

.timer-card.recording {
  border-color: #ef4444;
  background: #fef2f2;
  animation: pulse 2s ease-in-out infinite;
}

.timer-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timer-display {
  font-size: 64px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}

.timer-progress {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #059669;
  transition: width 0.1s linear;
}

.timer-card.recording .progress-bar {
  background: #ef4444;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.audio-controls {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 48px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.record-btn:hover:not(:disabled) {
  background: #047857;
  transform: scale(1.05);
}

.record-btn.stop {
  background: #ef4444;
}

.record-btn.stop:hover:not(:disabled) {
  background: #dc2626;
}

.record-btn svg {
  width: 24px;
  height: 24px;
}

.record-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prepare-btn {
  padding: 14px 32px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.prepare-btn:hover {
  background: #d97706;
}

.review-controls {
  width: 100%;
  max-width: 500px;
}

.audio-player {
  width: 100%;
  margin-bottom: 16px;
}

.review-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9fafb;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.navigation-controls {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.submit-section {
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.submit-btn {
  width: 100%;
  padding: 16px 32px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #047857;
}

@media (max-width: 640px) {
  .question-text {
    font-size: 20px;
  }

  .timer-display {
    font-size: 48px;
  }

  .record-btn {
    padding: 14px 32px;
    font-size: 16px;
  }

  .nav-btn {
    padding: 10px 16px;
  }
}
</style>
