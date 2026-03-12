import { ref, computed, onUnmounted } from 'vue'
import type { SpeakingPhase } from '@/types/speaking'
import { useSpeakingStore } from '@/stores/speakingStore'
import { useSpeakingTTS } from '@/composables/useSpeakingTTS'
import { useSpeakingRecorder } from '@/composables/useSpeakingRecorder'
import { useSpeakingUpload } from '@/composables/useSpeakingUpload'

/**
 * Main state machine for the CEFR Speaking exam flow.
 * Controls phase transitions, timers, TTS, and recording.
 */
export function useSpeakingFlow() {
  const store = useSpeakingStore()
  const tts = useSpeakingTTS()
  const recorder = useSpeakingRecorder()
  const uploader = useSpeakingUpload()

  const phase = ref<SpeakingPhase>('welcome')
  const countdown = ref(0)
  const recordingTime = ref(0)
  const prepTotal = ref(0)
  const isTransitioning = ref(false)
  const showContent = ref(false)

  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let recordingTimer: ReturnType<typeof setInterval> | null = null

  // Current part and question from store
  const currentPart = computed(() => store.currentPart)
  const currentQuestion = computed(() => store.currentQuestion)
  const currentPartLabel = computed(() => store.currentPartLabel)
  const partLabels = computed(() => store.partLabels)
  const currentPartIndex = computed(() => store.currentPartIndex)

  function clearTimers() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }

  /**
   * Fade content in, wait, then fade out and proceed.
   */
  async function fadeShow(durationMs: number = 500): Promise<void> {
    showContent.value = true
    await delay(durationMs)
  }

  async function fadeHide(durationMs: number = 500): Promise<void> {
    showContent.value = false
    await delay(durationMs)
  }

  function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  // Phases that belong to the active exam (past the intro sequence)
  const EXAM_PHASES: SpeakingPhase[] = [
    'part-intro', 'part-instruction', 'part-instruction-2', 'part-instruction-3',
    'part-answer-time', 'part-speak-after-sound', 'part-pictures',
    'question-label', 'question-display', 'preparation', 'recording',
    'part-transition', 'exam-end',
  ]

  // Phases where the student is answering questions
  const QUESTION_PHASES: SpeakingPhase[] = [
    'question-label', 'question-display', 'preparation', 'recording', 'part-pictures',
  ]

  /**
   * Get the safe resume phase from a saved phase.
   * For preparation/recording, resume directly to preserve timer.
   */
  function getResumePhase(savedPhase: SpeakingPhase): SpeakingPhase {
    if (savedPhase === 'exam-end') return 'exam-end'
    if (savedPhase === 'recording') return 'recording'
    if (savedPhase === 'preparation') return 'preparation'
    if (savedPhase === 'part-transition') return 'part-intro'
    if (QUESTION_PHASES.includes(savedPhase)) return 'question-display'
    if (EXAM_PHASES.includes(savedPhase)) return 'part-intro'
    return 'welcome'
  }

  /**
   * Resume preparation phase with saved countdown.
   */
  async function resumePreparation() {
    showContent.value = true
    phase.value = 'preparation'

    const savedCountdown = store.savedCountdown
    const savedPrepTotal = store.savedPrepTotal
    countdown.value = savedCountdown > 0 ? savedCountdown : getPartConfig().preparationTime
    prepTotal.value = savedPrepTotal > 0 ? savedPrepTotal : countdown.value

    return new Promise<void>((resolve) => {
      countdownTimer = setInterval(async () => {
        countdown.value--
        store.savedCountdown = countdown.value
        store.phase = 'preparation'
        store.saveState()
        if (countdown.value <= 0) {
          clearTimers()
          await delay(1000)
          phase.value = 'recording'
          store.phase = 'recording'
          await tts.playStartSound()
          recorder.resumeRecording()
          const answerTime = getPartConfig().answerTime
          recordingTime.value = answerTime
          store.savedRecordingTime = answerTime
          store.saveState()

          recordingTimer = setInterval(async () => {
            recordingTime.value--
            store.savedRecordingTime = recordingTime.value
            store.phase = 'recording'
            store.saveState()
            if (recordingTime.value <= 0) {
              clearTimers()
              await tts.playStopSound()
              recorder.pauseRecording()
              await fadeHide()
              await handleNextQuestionOrPart()
            }
          }, 1000)
          resolve()
        }
      }, 1000)
    })
  }

  /**
   * Resume recording phase with saved timer.
   */
  async function resumeRecording() {
    showContent.value = true
    phase.value = 'recording'

    const savedTime = store.savedRecordingTime
    recordingTime.value = savedTime > 0 ? savedTime : getPartConfig().answerTime

    // Also set prepTotal for UI (countdown ring won't show, but just in case)
    prepTotal.value = store.savedPrepTotal > 0 ? store.savedPrepTotal : getPartConfig().preparationTime

    await tts.playStartSound()
    recorder.resumeRecording()

    recordingTimer = setInterval(async () => {
      recordingTime.value--
      store.savedRecordingTime = recordingTime.value
      store.phase = 'recording'
      store.saveState()
      if (recordingTime.value <= 0) {
        clearTimers()
        await tts.playStopSound()
        recorder.pauseRecording()
        await fadeHide()
        await handleNextQuestionOrPart()
      }
    }, 1000)
  }

  /**
   * Request a Wake Lock to prevent the screen from sleeping during the exam.
   * Critical on mobile devices where the screen may turn off mid-exam.
   */
  let wakeLock: WakeLockSentinel | null = null

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
        // Re-acquire if released (e.g., tab switch on mobile)
        wakeLock.addEventListener('release', () => {
          wakeLock = null
        })
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible' && !wakeLock) {
            try {
              wakeLock = await navigator.wakeLock.request('screen')
            } catch {
              // ignore
            }
          }
        })
      }
    } catch {
      // Wake Lock not supported or denied — non-critical
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release()
      wakeLock = null
    }
  }

  /**
   * Start the speaking exam flow.
   * Resumes from saved state if the exam was in progress.
   */
  async function start() {
    // Warm up AudioContext and SpeechSynthesis on user-initiated start.
    // Both require a user gesture (click/touch) to unlock on mobile browsers.
    tts.warmUpAudio()
    await tts.warmUpTTS()
    await tts.ensureVoicesLoaded()
    await recorder.requestPermission()
    await requestWakeLock()

    // Check for resumable state
    const savedPhase = store.phase as SpeakingPhase | undefined
    if (savedPhase && store.currentPartIndex >= 0 && !store.isCompleted && store.test?.parts?.length) {
      const resumePhase = getResumePhase(savedPhase)

      if (resumePhase !== 'welcome') {
        // Initialize recording pipeline (start + pause) so it's ready
        const started = await recorder.startRecording()
        if (started) {
          recorder.pauseRecording()
        }

        // Direct resume for timer-based phases
        if (resumePhase === 'preparation') {
          await resumePreparation()
          return
        }
        if (resumePhase === 'recording') {
          await resumeRecording()
          return
        }

        await runPhase(resumePhase)
        return
      }
    }

    await runPhase('welcome')
  }

  /**
   * Run a specific phase.
   */
  // Phase groups: transitions within same group keep content visible (no full fade)
  const INSTRUCTION_GROUP: SpeakingPhase[] = ['part-intro', 'part-instruction', 'part-instruction-2', 'part-instruction-3', 'part-answer-time', 'part-speak-after-sound']
  const QUESTION_GROUP_PHASES: SpeakingPhase[] = ['question-label', 'question-display', 'preparation', 'recording']

  function inSameGroup(a: SpeakingPhase, b: SpeakingPhase): boolean {
    return (INSTRUCTION_GROUP.includes(a) && INSTRUCTION_GROUP.includes(b))
      || (QUESTION_GROUP_PHASES.includes(a) && QUESTION_GROUP_PHASES.includes(b))
  }

  async function runPhase(newPhase: SpeakingPhase) {
    clearTimers()
    const sameGroup = inSameGroup(phase.value, newPhase)
    isTransitioning.value = true
    if (!sameGroup) {
      showContent.value = false
    }
    await delay(sameGroup ? 50 : 300)

    phase.value = newPhase
    isTransitioning.value = false

    // Persist state for exam phases (past intro sequence)
    if (EXAM_PHASES.includes(newPhase)) {
      store.phase = newPhase
      store.saveState()
    }

    switch (newPhase) {
      case 'welcome':
        await handleWelcome()
        break
      case 'intro':
        await handleIntro()
        break
      case 'name-question':
        await handleNameQuestion()
        break
      case 'name-recording':
        await handleNameRecording()
        break
      case 'thank-you':
        await handleThankYou()
        break
      case 'countdown':
        await handleCountdown()
        break
      case 'part-intro':
        await handlePartIntro()
        break
      case 'part-instruction':
        await handlePartInstruction()
        break
      case 'part-instruction-2':
        await handlePartInstruction2()
        break
      case 'part-instruction-3':
        await handlePartInstruction3()
        break
      case 'part-answer-time':
        await handlePartAnswerTime()
        break
      case 'part-speak-after-sound':
        await handlePartSpeakAfterSound()
        break
      case 'part-pictures':
        await handlePartPictures()
        break
      case 'question-label':
        await handleQuestionLabel()
        break
      case 'question-display':
        await handleQuestionDisplay()
        break
      case 'preparation':
        await handlePreparation()
        break
      case 'recording':
        await handleRecording()
        break
      case 'part-transition':
        await handlePartTransition()
        break
      case 'exam-end':
        await handleExamEnd()
        break
    }
  }

  async function handleWelcome() {
    await fadeShow()
    await tts.speak('Welcome to MockCenter Learning Platform!')
    await delay(2000)
    await fadeHide()
    await runPhase('intro')
  }

  async function handleIntro() {
    await fadeShow()
    await tts.speak('Multilevel Exam. New Speaking Test.')
    await delay(3000)
    await fadeHide()
    await runPhase('name-question')
  }

  async function handleNameQuestion() {
    await fadeShow()
    await tts.speak('Can you tell me your full name please?')
    await delay(500)

    // Start continuous recording AFTER TTS - only capture student answers
    const started = await recorder.startRecording()
    if (!started) {
      await delay(2000)
      await runPhase('thank-you')
      return
    }

    // Switch to name-recording WITHOUT fade - mic appears
    phase.value = 'name-recording'
    await tts.playStartSound()

    // Auto-pause after 5 seconds
    recordingTime.value = 5
    recordingTimer = setInterval(async () => {
      recordingTime.value--
      if (recordingTime.value <= 0) {
        clearTimers()
        await tts.playStopSound()
        recorder.pauseRecording()
        await fadeHide()
        await runPhase('thank-you')
      }
    }, 1000)
  }

  async function handleNameRecording() {
    // Handled inline in handleNameQuestion to avoid fade flicker
  }

  async function handleThankYou() {
    await fadeShow()
    await tts.speak('Thank you.')
    await delay(1500)
    await fadeHide()
    await runPhase('countdown')
  }

  async function handleCountdown() {
    await fadeShow()
    await tts.speak('Your exam starts in 10 seconds. Please prepare!')
    countdown.value = 10

    return new Promise<void>((resolve) => {
      countdownTimer = setInterval(async () => {
        countdown.value--
        if (countdown.value <= 0) {
          clearTimers()
          // Wait for circle animation to complete (1s transition)
          await delay(1000)
          await fadeHide()
          store.currentPartIndex = 0
          store.currentQuestionIndex = 0
          await runPhase('part-intro')
          resolve()
        }
      }, 1000)
    })
  }

  async function handlePartIntro() {
    await fadeShow()
    await tts.speak(`Part ${currentPartLabel.value}`)
    await delay(1000)
    await runPhase('part-instruction')
  }

  // Static timings per part label (in seconds)
  const PART_CONFIG: Record<string, { preparationTime: number; answerTime: number; instruction: string; instruction2?: string; instruction3?: string }> = {
    '1.1': {
      preparationTime: 5,
      answerTime: 30,
      instruction: 'In this part, I will ask you a few questions about yourself.',
    },
    '1.2': {
      preparationTime: 5,
      answerTime: 30,
      instruction: 'You will now see two pictures.',
      instruction2: 'You will need to answer some questions based on these pictures.',
    },
    '2': {
      preparationTime: 60,
      answerTime: 120,
      instruction: 'In this part, you will be given a picture followed by 3 questions.',
      instruction2: 'You do NOT need to describe the picture, but focus on the questions provided.',
      instruction3: 'You will have 1 minute to prepare for the questions and 2 minutes to answer them.',
    },
    '3': {
      preparationTime: 60,
      answerTime: 120,
      instruction: 'You will now be given a statement to discuss.',
      instruction2: 'You will need to speak about both sides of the argument.',
      instruction3: 'You will have 1 minute to prepare for the task and 2 minutes to speak.',
    },
  }

  function getPartConfig() {
    return PART_CONFIG[currentPartLabel.value] ?? { preparationTime: 5, answerTime: 30, instruction: 'In this part, I will ask you some questions.' }
  }

  async function handlePartInstruction() {
    if (!currentPart.value) {
      await runPhase('exam-end')
      return
    }

    await fadeShow()

    const config = getPartConfig()
    await tts.speak(config.instruction)
    await delay(1000)

    if (config.instruction2) {
      await runPhase('part-instruction-2')
    } else {
      await runPhase('part-answer-time')
    }
  }

  async function handlePartInstruction2() {
    showContent.value = true
    const config = getPartConfig()
    if (config.instruction2) {
      await tts.speak(config.instruction2)
    }
    await delay(1000)

    if (config.instruction3) {
      await runPhase('part-instruction-3')
    } else {
      await runPhase('part-answer-time')
    }
  }

  async function handlePartInstruction3() {
    showContent.value = true
    const config = getPartConfig()
    if (config.instruction3) {
      await tts.speak(config.instruction3)
    }
    await delay(1000)
    await runPhase('part-speak-after-sound')
  }

  function getAnswerTimeText() {
    const config = getPartConfig()
    const seconds = config.answerTime
    if (seconds >= 120) {
      const mins = Math.floor(seconds / 60)
      return `You will have ${mins} minutes to answer.`
    }
    return `For each question, you will have ${seconds} seconds to answer.`
  }

  async function handlePartAnswerTime() {
    showContent.value = true
    await tts.speak(getAnswerTimeText())
    await delay(1500)
    await runPhase('part-speak-after-sound')
  }

  async function handlePartSpeakAfterSound() {
    await fadeShow()
    await tts.speak('You should speak after this sound!')
    await delay(500)
    await tts.playStartSound()
    await delay(1500)
    await fadeHide()

    // Start first question
    store.currentQuestionIndex = 0

    // Part 1.2: show pictures before questions
    if (currentPartLabel.value === '1.2') {
      await runPhase('part-pictures')
    } else if (currentPartLabel.value === '2' || currentPartLabel.value === '3') {
      // Part 2/3: show content, then single prep/recording
      await runPhase('question-display')
    } else {
      await runPhase('question-label')
    }
  }

  async function handlePartPictures() {
    // Pictures are visible via persistent layer (computed from phase)
    showContent.value = true
    await delay(3000)
    await runPhase('question-label')
  }

  async function handleQuestionLabel() {
    showContent.value = true
    await delay(1500)
    await runPhase('question-display')
  }

  async function handleQuestionDisplay() {
    // Part 3: no questions, just show content and go to prep
    if (currentPartLabel.value === '3') {
      await fadeShow()
      await delay(2000)
      await runPhase('preparation')
      return
    }

    const question = currentQuestion.value
    if (!question) {
      await handleNextQuestionOrPart()
      return
    }

    await fadeShow()

    // Part 2: read all questions via TTS, then single prep/recording
    if (currentPartLabel.value === '2') {
      const questions = store.currentQuestions
      for (const q of questions) {
        const text = q.title ? q.title.replace(/<[^>]*>/g, '').trim() : ''
        if (text) {
          await tts.speak(text)
          await delay(300)
        }
      }
      await delay(500)
      await runPhase('preparation')
      return
    }

    const questionText = question.title
      ? question.title.replace(/<[^>]*>/g, '').trim()
      : ''

    if (questionText) {
      await tts.speak(questionText)
    }

    await delay(500)
    await runPhase('preparation')
  }

  async function handlePreparation() {
    showContent.value = true
    let prepTime = getPartConfig().preparationTime
    // First question of Part 1.2 gets extra prep time (10s)
    if (currentPartLabel.value === '1.2' && store.currentQuestionIndex === 0) {
      prepTime = 10
    }
    countdown.value = prepTime
    prepTotal.value = prepTime
    store.savedPrepTotal = prepTime

    return new Promise<void>((resolve) => {
      countdownTimer = setInterval(async () => {
        countdown.value--
        // Persist timer for resume
        store.savedCountdown = countdown.value
        store.phase = 'preparation'
        store.saveState()

        if (countdown.value <= 0) {
          clearTimers()
          await delay(1000)
          // Switch to recording - resume recording AFTER start sound (only capture student answers)
          phase.value = 'recording'
          await tts.playStartSound()
          recorder.resumeRecording()
          const answerTime = getPartConfig().answerTime
          recordingTime.value = answerTime
          store.savedRecordingTime = answerTime
          store.phase = 'recording'
          store.saveState()

          recordingTimer = setInterval(async () => {
            recordingTime.value--
            // Persist timer for resume
            store.savedRecordingTime = recordingTime.value
            store.phase = 'recording'
            store.saveState()

            if (recordingTime.value <= 0) {
              clearTimers()
              await tts.playStopSound()
              recorder.pauseRecording()
              await fadeHide()
              await handleNextQuestionOrPart()
            }
          }, 1000)
          resolve()
        }
      }, 1000)
    })
  }

  async function handleRecording() {
    // Handled inline in handlePreparation to avoid fade flicker
  }

  async function handleNextQuestionOrPart() {
    // Part 2/3: single recording, go to next part
    if (currentPartLabel.value === '2' || currentPartLabel.value === '3') {
      await runPhase('part-transition')
      return
    }

    const questions = store.currentQuestions
    const nextQuestionIndex = store.currentQuestionIndex + 1

    if (nextQuestionIndex < questions.length) {
      // Next question in same part
      store.currentQuestionIndex = nextQuestionIndex
      store.saveState()
      await runPhase('question-label')
    } else {
      // Move to next part
      await runPhase('part-transition')
    }
  }

  async function handlePartTransition() {
    const nextPartIndex = store.currentPartIndex + 1

    if (nextPartIndex < store.totalParts) {
      store.currentPartIndex = nextPartIndex
      store.currentQuestionIndex = 0
      store.saveState()
      await fadeShow()
      await delay(1000)
      await fadeHide()
      await runPhase('part-intro')
    } else {
      // All parts done
      await runPhase('exam-end')
    }
  }

  async function handleExamEnd() {
    await fadeShow()
    await tts.speak('This is the end of the Speaking Test.')
    store.isCompleted = true
    store.saveState()

    // Stop continuous recording and upload the combined audio
    const blob = await recorder.stopRecording()
    if (blob.size > 0) {
      await uploader.uploadAndSubmit(blob)
    }
  }

  /**
   * Force stop current recording (e.g., user presses stop early).
   */
  async function forceStopRecording() {
    if (recorder.isRecording.value && phase.value === 'recording') {
      clearTimers()
      await tts.playStopSound()
      recorder.pauseRecording()
      await fadeHide()
      await handleNextQuestionOrPart()
    } else if (recorder.isRecording.value && phase.value === 'name-recording') {
      clearTimers()
      await tts.playStopSound()
      recorder.pauseRecording()
      await fadeHide()
      await runPhase('thank-you')
    }
  }

  onUnmounted(() => {
    clearTimers()
    tts.stop()
    recorder.releaseStream()
    releaseWakeLock()
  })

  return {
    // State
    phase,
    countdown,
    recordingTime,
    prepTotal,
    isTransitioning,
    showContent,

    // From sub-composables
    isRecording: recorder.isRecording,
    isSpeaking: tts.isSpeaking,
    hasPermission: recorder.hasPermission,
    permissionError: recorder.permissionError,
    isUploading: uploader.isUploading,

    // Computed
    currentPart,
    currentQuestion,
    currentPartLabel,
    partLabels,
    currentPartIndex,

    // Actions
    start,
    forceStopRecording,
  }
}
