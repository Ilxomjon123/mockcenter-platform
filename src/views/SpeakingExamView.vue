<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSpeakingFlow } from '@/composables/useSpeakingFlow'
import { useSpeakingStore } from '@/stores/speakingStore'
import { useAuthStore } from '@/stores/authStore'
import SpeakingHeader from '@/components/speaking/SpeakingHeader.vue'
import SpeakingPartBadge from '@/components/speaking/SpeakingPartBadge.vue'
import SpeakingQuestionBadge from '@/components/speaking/SpeakingQuestionBadge.vue'
import SpeakingCountdown from '@/components/speaking/SpeakingCountdown.vue'
import SpeakingMicButton from '@/components/speaking/SpeakingMicButton.vue'
import SpeakingRecordingTimer from '@/components/speaking/SpeakingRecordingTimer.vue'
import SpeakingIntroCard from '@/components/speaking/SpeakingIntroCard.vue'

const store = useSpeakingStore()
const authStore = useAuthStore()
const flow = useSpeakingFlow()

// Mobile browsers require a user gesture (click/touch) to unlock
// SpeechSynthesis, AudioContext, and MediaRecorder.
// Show a start button instead of auto-starting.
const examStarted = ref(false)

async function startExam() {
  examStarted.value = true
  flow.start()
}

async function finishExam() {
  await authStore.logout('/login')
}

const questionTitle = computed(() => {
  const q = flow.currentQuestion.value
  if (!q?.title) return ''
  return q.title.replace(/<[^>]*>/g, '').trim()
})

const questionIndex = computed(() => store.currentQuestionIndex + 1)

const isPartTwo = computed(() => flow.currentPartLabel.value === '2')
const isPartThree = computed(() => flow.currentPartLabel.value === '3')
const partContent = computed(() => flow.currentPart.value?.content ?? '')

// All questions for current part (used for Part 2 display)
const allQuestions = computed(() => store.currentQuestions)

// Show pictures persistently across Part 1.2 question phases (not tied to showContent)
const showPartPictures = computed(() => {
  if (flow.currentPartLabel.value !== '1.2' || !partContent.value) return false
  const phases: string[] = ['part-pictures', 'question-label', 'question-display', 'preparation', 'recording']
  return phases.includes(flow.phase.value)
})

// Show Part 2 content (picture + questions) persistently across phases
const showPartTwoContent = computed(() => {
  if (!isPartTwo.value || !partContent.value) return false
  const phases: string[] = ['question-display', 'preparation', 'recording']
  return phases.includes(flow.phase.value)
})

// Show Part 3 content (statement table) persistently across phases
const showPartThreeContent = computed(() => {
  if (!isPartThree.value || !partContent.value) return false
  const phases: string[] = ['question-display', 'preparation', 'recording']
  return phases.includes(flow.phase.value)
})

// Phase groups: persistent badge, only inner content transitions
const inPartInstructionGroup = computed(() => {
  const phases = ['part-intro', 'part-instruction', 'part-instruction-2', 'part-instruction-3', 'part-answer-time', 'part-speak-after-sound']
  return phases.includes(flow.phase.value)
})

const inQuestionGroup = computed(() => {
  if (isPartTwo.value || isPartThree.value) return false
  const phases = ['question-label', 'question-display', 'preparation', 'recording']
  return phases.includes(flow.phase.value)
})

// Static part config
const PART_INSTRUCTIONS: Record<string, string> = {
  '1.1': 'In this part, I will ask you a few questions about yourself.',
  '1.2': 'You will now see two pictures.',
  '2': 'In this part, you will be given a picture followed by 3 questions.',
  '3': 'You will now be given a statement to discuss.',
}

const PART_INSTRUCTIONS_2: Record<string, string> = {
  '1.2': 'You will need to answer some questions based on these pictures.',
  '2': 'You do NOT need to describe the picture, but focus on the questions provided.',
  '3': 'You will need to speak about both sides of the argument.',
}

const PART_INSTRUCTIONS_3: Record<string, string> = {
  '2': 'You will have 1 minute to prepare for the questions and 2 minutes to answer them.',
  '3': 'You will have 1 minute to prepare for the task and 2 minutes to speak.',
}

const PART_ANSWER_TIMES: Record<string, number> = {
  '1.1': 30, '1.2': 30, '2': 120, '3': 120,
}

const partInstruction = computed(() => PART_INSTRUCTIONS[flow.currentPartLabel.value] ?? '')
const partInstruction2 = computed(() => PART_INSTRUCTIONS_2[flow.currentPartLabel.value] ?? '')
const partInstruction3 = computed(() => PART_INSTRUCTIONS_3[flow.currentPartLabel.value] ?? '')
const partAnswerTimeText = computed(() => {
  const seconds = PART_ANSWER_TIMES[flow.currentPartLabel.value] ?? 30
  if (seconds >= 120) {
    const mins = Math.floor(seconds / 60)
    return `You will have ${mins} minutes to answer.`
  }
  return `For each question, you will have ${seconds} seconds to answer.`
})

// Prevent page refresh/close during active exam
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  const activePhases = [
    'countdown', 'part-intro', 'part-instruction', 'part-instruction-2', 'part-instruction-3',
    'part-answer-time', 'part-speak-after-sound', 'part-pictures',
    'question-label', 'question-display', 'preparation', 'recording', 'part-transition',
  ]
  if (activePhases.includes(flow.phase.value)) {
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})
</script>

<template>
  <div class="speaking-exam">
    <SpeakingHeader
      :part-labels="flow.partLabels.value"
      :active-part-index="flow.phase.value === 'exam-end' ? flow.partLabels.value.length : flow.currentPartIndex.value"
    />

    <!-- Start Screen — user must tap to unlock TTS/Audio on mobile -->
    <main v-if="!examStarted" class="speaking-exam__content">
      <div class="speaking-exam__center">
        <div class="speaking-exam__start-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" fill="#4285f4" />
            <path d="M32 24v32l24-16z" fill="white" />
          </svg>
        </div>
        <h1 class="speaking-exam__start-title">Speaking Test</h1>
        <p class="speaking-exam__start-hint">Tap the button below to start the exam.<br />Please allow microphone access when prompted.</p>
        <button class="speaking-exam__start-btn" @click="startExam">
          Start Exam
        </button>
      </div>
    </main>

    <!-- Exam Content -->
    <template v-else>
    <!-- Permission Error -->
    <div v-if="flow.permissionError.value" class="speaking-exam__error">
      <p>{{ flow.permissionError.value }}</p>
    </div>

    <main class="speaking-exam__content" :class="{ 'speaking-exam__content--pictures': showPartPictures || showPartTwoContent || showPartThreeContent }">
      <!-- Part 1.2 Pictures (persistent across question phases) -->
      <Transition name="fade">
        <div v-if="showPartPictures" key="part-pics" class="speaking-exam__part-pictures">
          <div v-html="partContent" class="speaking-exam__part-pictures-grid" />
        </div>
      </Transition>

      <!-- Part 2: Picture + Questions (persistent across question/prep/recording) -->
      <Transition name="fade">
        <div v-if="showPartTwoContent" key="part2-card" class="speaking-exam__part2-card">
          <div class="speaking-exam__part2-top">
            <div v-html="partContent" class="speaking-exam__part2-image" />
            <div class="speaking-exam__part2-side-wrap" :class="{ 'speaking-exam__part2-side-wrap--active': flow.phase.value === 'preparation' || flow.phase.value === 'recording' }">
              <Transition name="fade" mode="out-in">
                <div v-if="flow.phase.value === 'preparation'" key="p2-prep" class="speaking-exam__part2-side">
                  <SpeakingCountdown
                    :value="flow.countdown.value"
                    :total="flow.prepTotal.value || 60"
                    size="small"
                  />
                </div>
                <div v-else-if="flow.phase.value === 'recording'" key="p2-rec" class="speaking-exam__part2-side">
                  <div class="speaking-exam__stoppable" @click="flow.forceStopRecording()">
                    <SpeakingMicButton :active="flow.isRecording.value" />
                  </div>
                  <SpeakingRecordingTimer :seconds="flow.recordingTime.value" />
                </div>
              </Transition>
            </div>
          </div>
          <div class="speaking-exam__part2-questions">
            <p v-for="(q, i) in allQuestions" :key="q.id" class="speaking-exam__part2-question-item">
              {{ i + 1 }}. {{ q.title?.replace(/<[^>]*>/g, '').trim() }}
            </p>
          </div>
        </div>
      </Transition>

      <!-- Part 3: Statement/Content (persistent across content/prep/recording) -->
      <Transition name="fade">
        <div v-if="showPartThreeContent" key="part3-content" class="speaking-exam__part3-wrap">
          <!-- Preparation: countdown above content (smooth expand) -->
          <div class="speaking-exam__part3-top-wrap" :class="{ 'speaking-exam__part3-top-wrap--active': flow.phase.value === 'preparation' }">
            <SpeakingCountdown
              v-if="flow.phase.value === 'preparation'"
              :value="flow.countdown.value"
              :total="flow.prepTotal.value || 60"
              size="small"
            />
          </div>
          <div v-html="partContent" class="speaking-exam__part3-content" />
          <!-- Recording: mic + timer below content (smooth expand) -->
          <div class="speaking-exam__part3-bottom-wrap" :class="{ 'speaking-exam__part3-bottom-wrap--active': flow.phase.value === 'recording' }">
            <div v-if="flow.phase.value === 'recording'" class="speaking-exam__part3-recording">
              <div class="speaking-exam__stoppable" @click="flow.forceStopRecording()">
                <SpeakingMicButton :active="flow.isRecording.value" />
              </div>
              <SpeakingRecordingTimer :seconds="flow.recordingTime.value" />
            </div>
          </div>
        </div>
      </Transition>

      <!-- WELCOME -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'welcome' && flow.showContent.value" key="welcome" class="speaking-exam__center">
          <h1 class="speaking-exam__title">Welcome to MockCenter<br />Learning Platform!</h1>
        </div>
      </Transition>

      <!-- INTRO -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'intro' && flow.showContent.value" key="intro" class="speaking-exam__center">
          <SpeakingIntroCard />
        </div>
      </Transition>

      <!-- NAME QUESTION -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="(flow.phase.value === 'name-question' || flow.phase.value === 'name-recording') && flow.showContent.value"
          key="name"
          class="speaking-exam__center"
        >
          <h2 class="speaking-exam__question-text">Can you tell me your full name please?</h2>
          <Transition name="fade">
            <div v-if="flow.phase.value === 'name-recording'" class="speaking-exam__mic-area">
              <SpeakingMicButton :active="flow.isRecording.value" />
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- THANK YOU -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'thank-you' && flow.showContent.value" key="thanks" class="speaking-exam__center">
          <h1 class="speaking-exam__title">Thank you</h1>
        </div>
      </Transition>

      <!-- COUNTDOWN -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'countdown' && flow.showContent.value" key="countdown" class="speaking-exam__center">
          <h2 class="speaking-exam__question-text">Your exam starts in 10 seconds.</h2>
          <SpeakingCountdown :value="flow.countdown.value" :total="10" size="large" />
          <p class="speaking-exam__subtext">Please prepare!</p>
        </div>
      </Transition>

      <!-- PART INSTRUCTION GROUP (badge stays, only instruction text transitions) -->
      <Transition name="fade">
        <div v-if="inPartInstructionGroup" key="part-group" class="speaking-exam__center">
          <SpeakingPartBadge :label="flow.currentPartLabel.value" />
          <Transition name="fade" mode="out-in">
            <p v-if="flow.phase.value === 'part-instruction'" key="pi1" class="speaking-exam__instruction">
              {{ partInstruction }}
            </p>
            <p v-else-if="flow.phase.value === 'part-instruction-2'" key="pi2" class="speaking-exam__instruction">
              {{ partInstruction2 }}
            </p>
            <p v-else-if="flow.phase.value === 'part-instruction-3'" key="pi3" class="speaking-exam__instruction">
              {{ partInstruction3 }}
            </p>
            <p v-else-if="flow.phase.value === 'part-answer-time'" key="pi4" class="speaking-exam__instruction">
              {{ partAnswerTimeText }}
            </p>
            <p v-else-if="flow.phase.value === 'part-speak-after-sound'" key="pi5" class="speaking-exam__instruction">
              You should speak after this sound!
            </p>
          </Transition>
        </div>
      </Transition>

      <!-- QUESTION GROUP (badge + question text stay, controls transition) -->
      <Transition name="fade">
        <div v-if="inQuestionGroup" key="question-group" class="speaking-exam__center">
          <SpeakingQuestionBadge :number="questionIndex" />
          <h2 v-if="flow.phase.value !== 'question-label'" class="speaking-exam__question-text">{{ questionTitle }}</h2>

          <Transition name="fade" mode="out-in">
            <div v-if="flow.phase.value === 'preparation'" key="qp" class="speaking-exam__prep-timer">
              <SpeakingCountdown
                :value="flow.countdown.value"
                :total="flow.prepTotal.value || 5"
                size="small"
              />
            </div>
            <div v-else-if="flow.phase.value === 'recording'" key="qr">
              <div class="speaking-exam__mic-area">
                <SpeakingMicButton :active="flow.isRecording.value" />
              </div>
              <div class="speaking-exam__recording-timer">
                <SpeakingRecordingTimer :seconds="flow.recordingTime.value" />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- PART TRANSITION -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'part-transition' && flow.showContent.value" key="transition" class="speaking-exam__center">
          <SpeakingPartBadge :label="store.partLabels[store.currentPartIndex] || ''" />
        </div>
      </Transition>

      <!-- EXAM END -->
      <Transition name="fade" mode="out-in">
        <div v-if="flow.phase.value === 'exam-end' && flow.showContent.value" key="end" class="speaking-exam__center">
          <div class="speaking-exam__end-card">
            <div class="speaking-exam__end-icon">
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                <circle cx="48" cy="48" r="46" fill="#4CAF50" />
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
                <path d="M30 50l12 12 24-28" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
            </div>
            <h1 class="speaking-exam__end-title">Speaking Test Complete</h1>
            <p class="speaking-exam__end-subtitle">You have completed all parts of the speaking exam.</p>
            <div class="speaking-exam__end-parts">
              <div v-for="label in flow.partLabels.value" :key="label" class="speaking-exam__end-part-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50" />
                </svg>
                Part {{ label }}
              </div>
            </div>
            <div v-if="flow.isUploading.value" class="speaking-exam__uploading">
              <div class="speaking-exam__uploading-spinner" />
              Uploading recordings...
            </div>
            <div v-else class="speaking-exam__end-done">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50" />
              </svg>
              Recordings uploaded successfully
            </div>
            <button class="speaking-exam__end-btn" @click="finishExam">
              Finish &amp; Exit
            </button>
          </div>
        </div>
      </Transition>
    </main>
    </template>
  </div>
</template>

<style scoped>
.speaking-exam {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.speaking-exam__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 32px 80px;
  position: relative;
}

.speaking-exam__content--pictures {
  justify-content: flex-start;
  padding-top: 16px;
}

.speaking-exam__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
  max-width: 1200px;
  width: 100%;
  margin-top: -40px;
}

.speaking-exam__content--pictures .speaking-exam__center {
  margin-top: 0;
  gap: 16px;
}

/* Part 1.2 Pictures */
.speaking-exam__part-pictures {
  width: 100%;
  max-width: 1200px;
  margin-bottom: 16px;
}

.speaking-exam__part-pictures-grid {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.speaking-exam__part-pictures-grid :deep(img) {
  max-width: 700px;
  width: 48%;
  height: auto;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  object-fit: cover;
}

/* Part 2: Picture + Questions */
.speaking-exam__part2-card {
  width: 100%;
  max-width: 1200px;
  padding: 24px 28px;
}

.speaking-exam__part2-top {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.speaking-exam__part2-image {
  flex-shrink: 0;
}

.speaking-exam__part2-image :deep(img) {
  width: 500px;
  height: auto;
  border: 2px solid #333;
  display: block;
}

.speaking-exam__part2-side-wrap {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  padding-left: 0;
  transition: max-width 0.6s ease, opacity 0.4s ease 0.15s, padding-left 0.6s ease;
}

.speaking-exam__part2-side-wrap--active {
  max-width: 550px;
  overflow: visible;
  opacity: 1;
  padding-left: 32px;
}

.speaking-exam__part2-side {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  white-space: nowrap;
}

.speaking-exam__part2-questions {
  text-align: left;
}

.speaking-exam__part2-question-item {
  font-size: 40px;
  line-height: 1.6;
  color: #1a1a1a;
  margin: 10px 0;
  font-weight: 600;
}

/* Part 3: Statement/Content */
.speaking-exam__part3-wrap {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.speaking-exam__part3-top-wrap,
.speaking-exam__part3-bottom-wrap {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  display: flex;
  justify-content: center;
  transition: max-height 0.6s ease, opacity 0.4s ease 0.15s, padding 0.6s ease;
}

.speaking-exam__part3-top-wrap--active {
  max-height: 200px;
  overflow: visible;
  opacity: 1;
  padding-bottom: 24px;
}

.speaking-exam__part3-bottom-wrap--active {
  max-height: 300px;
  overflow: visible;
  opacity: 1;
  padding-top: 24px;
}

.speaking-exam__part3-content {
  width: 100%;
}

.speaking-exam__part3-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #333;
}

.speaking-exam__part3-content :deep(th),
.speaking-exam__part3-content :deep(td) {
  border: 1px solid #333;
  padding: 16px 20px;
  text-align: left;
  vertical-align: top;
  font-size: 32px;
  line-height: 1.5;
}

.speaking-exam__part3-content :deep(th) {
  font-weight: 600;
}

.speaking-exam__part3-content :deep(ul) {
  margin: 4px 0;
  padding-left: 20px;
}

.speaking-exam__part3-content :deep(li) {
  margin: 4px 0;
}

.speaking-exam__part3-recording {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}


.speaking-exam__title {
  font-size: 64px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.5px;
}

.speaking-exam__question-text {
  font-size: 46px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  max-width: 900px;
}

.speaking-exam__instruction {
  font-size: 42px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  max-width: 900px;
}

.speaking-exam__subtext {
  font-size: 32px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.speaking-exam__mic-area {
  margin-top: 16px;
}

.speaking-exam__recording-timer,
.speaking-exam__prep-timer {
  position: fixed;
  bottom: 40px;
  right: 48px;
}

.speaking-exam__error {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 24px;
  text-align: center;
  font-size: 14px;
}

.speaking-exam__error p {
  margin: 0;
}

.speaking-exam__end-card {
  background: #fff;
  border-radius: 24px;
  padding: 56px 64px;
  text-align: center;
  max-width: 560px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.speaking-exam__end-icon {
  margin-bottom: 20px;
}

.speaking-exam__end-title {
  font-size: 42px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.speaking-exam__end-subtitle {
  font-size: 22px;
  color: #666;
  margin: 0 0 28px;
  font-weight: 400;
}

.speaking-exam__end-parts {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.speaking-exam__end-part-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0faf0;
  border: 1px solid #c8e6c9;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 18px;
  font-weight: 600;
  color: #2e7d32;
}

.speaking-exam__end-done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 20px;
  color: #4CAF50;
  font-weight: 500;
}

.speaking-exam__end-btn {
  margin-top: 8px;
  padding: 14px 48px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: #4CAF50;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.speaking-exam__end-btn:hover {
  background: #43a047;
}

.speaking-exam__stoppable {
  cursor: pointer;
  transition: transform 0.2s;
}

.speaking-exam__stoppable:hover {
  transform: scale(1.05);
}

.speaking-exam__stoppable:active {
  transform: scale(0.95);
}

.speaking-exam__uploading {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  color: #666;
  margin-top: 16px;
}

.speaking-exam__uploading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Start screen */
.speaking-exam__start-icon {
  margin-bottom: 8px;
}

.speaking-exam__start-title {
  font-size: 42px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}

.speaking-exam__start-hint {
  font-size: 18px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.speaking-exam__start-btn {
  padding: 16px 64px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  background: #4285f4;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  margin-top: 8px;
}

.speaking-exam__start-btn:hover {
  background: #3367d6;
}

.speaking-exam__start-btn:active {
  transform: scale(0.97);
}

/* Responsive — Tablet */
@media (max-width: 768px) {
  .speaking-exam__content {
    padding: 16px 16px 60px;
  }

  .speaking-exam__center {
    gap: 18px;
    margin-top: -20px;
  }

  .speaking-exam__start-title {
    font-size: 28px;
  }

  .speaking-exam__start-hint {
    font-size: 15px;
  }

  .speaking-exam__start-btn {
    padding: 14px 48px;
    font-size: 18px;
  }

  .speaking-exam__title {
    font-size: 32px;
  }

  .speaking-exam__question-text {
    font-size: 28px;
    max-width: 100%;
  }

  .speaking-exam__instruction {
    font-size: 26px;
    max-width: 100%;
  }

  .speaking-exam__subtext {
    font-size: 20px;
  }

  /* Part 1.2 Pictures */
  .speaking-exam__part-pictures-grid {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .speaking-exam__part-pictures-grid :deep(img) {
    width: 100%;
    max-width: 100%;
  }

  /* Part 2 */
  .speaking-exam__part2-card {
    padding: 16px;
  }

  .speaking-exam__part2-top {
    flex-direction: column;
    gap: 0;
  }

  .speaking-exam__part2-image :deep(img) {
    width: 100%;
  }

  .speaking-exam__part2-side-wrap {
    max-width: none !important;
    padding-left: 0 !important;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.6s ease, opacity 0.4s ease 0.15s, padding-top 0.6s ease;
  }

  .speaking-exam__part2-side-wrap--active {
    max-height: 300px;
    overflow: visible;
    opacity: 1;
    padding-top: 20px;
  }

  .speaking-exam__part2-question-item {
    font-size: 18px;
    margin: 6px 0;
  }

  /* Part 3 */
  .speaking-exam__part3-content :deep(th),
  .speaking-exam__part3-content :deep(td) {
    font-size: 16px;
    padding: 10px 12px;
  }

  .speaking-exam__part3-content :deep(ul) {
    padding-left: 16px;
  }

  /* Recording/prep timer position */
  .speaking-exam__recording-timer,
  .speaking-exam__prep-timer {
    bottom: 16px;
    right: 16px;
  }

  /* End card */
  .speaking-exam__end-card {
    padding: 32px 24px;
    max-width: 100%;
  }

  .speaking-exam__end-icon svg {
    width: 72px;
    height: 72px;
  }

  .speaking-exam__end-title {
    font-size: 28px;
  }

  .speaking-exam__end-subtitle {
    font-size: 16px;
  }

  .speaking-exam__end-part-chip {
    font-size: 14px;
    padding: 6px 12px;
  }

  .speaking-exam__end-done {
    font-size: 16px;
  }

  .speaking-exam__end-btn {
    font-size: 18px;
    padding: 12px 36px;
  }

  .speaking-exam__uploading {
    font-size: 18px;
  }
}

/* Responsive — Mobile */
@media (max-width: 480px) {
  .speaking-exam__content {
    padding: 12px 12px 48px;
  }

  .speaking-exam__content--pictures {
    padding-top: 8px;
  }

  .speaking-exam__center {
    gap: 14px;
    margin-top: -10px;
  }

  .speaking-exam__title {
    font-size: 24px;
  }

  .speaking-exam__question-text {
    font-size: 20px;
  }

  .speaking-exam__instruction {
    font-size: 18px;
  }

  .speaking-exam__subtext {
    font-size: 16px;
  }

  .speaking-exam__mic-area {
    margin-top: 8px;
  }

  /* Part 2 */
  .speaking-exam__part2-card {
    padding: 10px;
  }

  .speaking-exam__part2-question-item {
    font-size: 14px;
    margin: 4px 0;
    line-height: 1.5;
  }

  /* Part 3 */
  .speaking-exam__part3-content :deep(th),
  .speaking-exam__part3-content :deep(td) {
    font-size: 12px;
    padding: 6px 8px;
  }

  .speaking-exam__part3-top-wrap--active {
    padding-bottom: 16px;
  }

  .speaking-exam__part3-bottom-wrap--active {
    padding-top: 16px;
  }

  /* Recording/prep timer */
  .speaking-exam__recording-timer,
  .speaking-exam__prep-timer {
    position: static;
    margin-top: 12px;
    display: flex;
    justify-content: center;
  }

  /* End card */
  .speaking-exam__end-card {
    padding: 24px 16px;
    border-radius: 16px;
  }

  .speaking-exam__end-icon svg {
    width: 56px;
    height: 56px;
  }

  .speaking-exam__end-title {
    font-size: 22px;
  }

  .speaking-exam__end-subtitle {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .speaking-exam__end-parts {
    gap: 8px;
    margin-bottom: 20px;
  }

  .speaking-exam__end-part-chip {
    font-size: 12px;
    padding: 4px 10px;
  }

  .speaking-exam__end-done {
    font-size: 14px;
  }

  .speaking-exam__end-btn {
    font-size: 16px;
    padding: 10px 28px;
    width: 100%;
  }

  .speaking-exam__uploading {
    font-size: 16px;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
