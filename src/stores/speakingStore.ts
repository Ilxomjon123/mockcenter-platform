import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import type { SpeakingQuestion, SpeakingRecording, SpeakingFeedback } from '@/types/speaking'
import { SpeakingPart, RecordingState } from '@/types/speaking'
import type { ExamTestRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useSpeakingStore = defineStore('speaking', () => {
  const { post } = useApi()

  // State
  const questions = useLocalStorage<SpeakingQuestion[]>('speaking_questions', [])
  const currentPart = ref<SpeakingPart>(SpeakingPart.PART_1)
  const currentQuestionIndex = ref(0)
  const recordings = useLocalStorage<Map<number, string>>('speaking_recordings', new Map())
  const feedback = useLocalStorage<Map<number, SpeakingFeedback>>('speaking_feedback', new Map())

  // Recording state
  const recordingState = ref<RecordingState>(RecordingState.IDLE)
  const isRecording = ref(false)
  const recordingStartTime = ref<number | null>(null)
  const elapsedSeconds = ref(0)
  const preparationElapsedSeconds = ref(0)
  const audioBlob = ref<Blob | null>(null)
  const audioUrl = ref<string | null>(null)

  // Timer intervals
  let recordingTimer: number | null = null
  let preparationTimer: number | null = null

  // Computed
  const currentQuestion = computed(() => {
    const partQuestions = questions.value.filter((q) => q.speaking_part === currentPart.value)
    return partQuestions[currentQuestionIndex.value]
  })

  const partQuestions = computed(() => {
    return questions.value.filter((q) => q.speaking_part === currentPart.value)
  })

  const totalQuestions = computed(() => questions.value.length)

  const currentQuestionNumber = computed(() => {
    const previousPartsCount = questions.value.filter(
      (q) =>
        (q.speaking_part === SpeakingPart.PART_1 && currentPart.value === SpeakingPart.PART_2) ||
        (q.speaking_part !== currentPart.value),
    ).length
    return previousPartsCount + currentQuestionIndex.value + 1
  })

  const isPartCompleted = computed(() => {
    return currentQuestionIndex.value >= partQuestions.value.length
  })

  const isExamCompleted = computed(() => {
    return (
      recordings.value.size === questions.value.length ||
      (currentPart.value === SpeakingPart.PART_3 && isPartCompleted.value)
    )
  })

  const hasRecording = computed(() => {
    return recordings.value.has(currentQuestion.value?.id || -1)
  })

  const currentFeedback = computed(() => {
    return feedback.value.get(currentQuestion.value?.id || -1)
  })

  // Actions
  const setTest = (testData: ExamTestRaw) => {
    if (testData.speaking) {
      questions.value = testData.speaking.parts.flatMap((part) =>
        part.questions.map((q) => ({
          ...q,
          speaking_part: mapPartTypeToSpeakingPart(part.order),
        })),
      ) as SpeakingQuestion[]
    }
  }

  const mapPartTypeToSpeakingPart = (partOrder: number): SpeakingPart => {
    if (partOrder === 1) return SpeakingPart.PART_1
    if (partOrder === 2) return SpeakingPart.PART_2
    return SpeakingPart.PART_3
  }

  const setPart = (part: SpeakingPart) => {
    currentPart.value = part
    currentQuestionIndex.value = 0
    resetRecordingState()
  }

  const nextQuestion = () => {
    if (currentQuestionIndex.value < partQuestions.value.length - 1) {
      currentQuestionIndex.value++
      resetRecordingState()
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
      resetRecordingState()
      // Load existing recording if any
      const questionId = currentQuestion.value?.id
      if (questionId && recordings.value.has(questionId)) {
        audioUrl.value = recordings.value.get(questionId)!
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        audioBlob.value = blob
        audioUrl.value = URL.createObjectURL(blob)

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      recordingState.value = RecordingState.RECORDING
      isRecording.value = true
      recordingStartTime.value = Date.now()
      elapsedSeconds.value = 0

      // Start timer
      recordingTimer = window.setInterval(() => {
        elapsedSeconds.value++

        const timeLimit = currentQuestion.value?.time_limit_seconds || 60
        if (elapsedSeconds.value >= timeLimit) {
          stopRecording()
        }
      }, 1000)

      return { success: true, mediaRecorder }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      return { success: false, message: 'Could not access microphone' }
    }
  }

  const stopRecording = (mediaRecorder?: MediaRecorder) => {
    if (mediaRecorder) {
      mediaRecorder.stop()
    }

    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }

    isRecording.value = false
    recordingStartTime.value = null
    recordingState.value = RecordingState.REVIEWING
  }

  const saveRecording = () => {
    const questionId = currentQuestion.value?.id
    if (questionId && audioUrl.value) {
      recordings.value.set(questionId, audioUrl.value)
      recordingState.value = RecordingState.COMPLETED
      return { success: true }
    }
    return { success: false }
  }

  const deleteRecording = () => {
    const questionId = currentQuestion.value?.id
    if (questionId) {
      recordings.value.delete(questionId)
      feedback.value.delete(questionId)
    }
    resetRecordingState()
  }

  const startPreparationTimer = () => {
    if (currentPart.value !== SpeakingPart.PART_2) return

    recordingState.value = RecordingState.PREPARING
    preparationElapsedSeconds.value = 0

    const preparationTime = currentQuestion.value?.preparation_time_seconds || 60

    preparationTimer = window.setInterval(() => {
      preparationElapsedSeconds.value++

      if (preparationElapsedSeconds.value >= preparationTime) {
        stopPreparationTimer()
      }
    }, 1000)
  }

  const stopPreparationTimer = () => {
    if (preparationTimer) {
      clearInterval(preparationTimer)
      preparationTimer = null
    }
    recordingState.value = RecordingState.IDLE
  }

  const resetRecordingState = () => {
    recordingState.value = RecordingState.IDLE
    isRecording.value = false
    recordingStartTime.value = null
    elapsedSeconds.value = 0
    preparationElapsedSeconds.value = 0
    audioBlob.value = null
    audioUrl.value = null

    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }

    if (preparationTimer) {
      clearInterval(preparationTimer)
      preparationTimer = null
    }
  }

  const uploadRecording = async (questionId: number) => {
    const audioData = audioBlob.value
    if (!audioData) {
      return { success: false, message: 'No recording to upload' }
    }

    const formData = new FormData()
    formData.append('audio', audioData)
    formData.append('question_id', questionId.toString())
    formData.append('speaking_part', currentPart.value)

    try {
      recordingState.value = RecordingState.UPLOADING

      const response = await post<{ data: SpeakingRecording }>(
        '/api/speaking/upload-recording',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      if (response?.data) {
        return { success: true, recording: response.data }
      } else {
        return { success: false, message: 'Failed to upload recording' }
      }
    } catch (error) {
      console.error('Error uploading recording:', error)
      return { success: false, message: 'Failed to upload recording' }
    }
  }

  const uploadAllRecordings = async () => {
    const results = []

    for (const [questionId, audioData] of recordings.value.entries()) {
      // Convert URL back to blob for upload
      const response = await fetch(audioData)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('audio', blob)
      formData.append('question_id', questionId.toString())

      try {
        const result = await post<{ data: SpeakingRecording }>(
          '/api/speaking/upload-recording',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        )

        results.push({ questionId, success: !!result?.data })
      } catch (error) {
        results.push({ questionId, success: false })
      }
    }

    return results
  }

  const setFeedback = (questionId: number, feedbackData: SpeakingFeedback) => {
    feedback.value.set(questionId, feedbackData)
  }

  const clearSpeaking = () => {
    questions.value = []
    currentPart.value = SpeakingPart.PART_1
    currentQuestionIndex.value = 0
    recordings.value.clear()
    feedback.value.clear()
    resetRecordingState()
  }

  return {
    // State
    questions,
    currentPart,
    currentQuestionIndex,
    recordings,
    feedback,
    recordingState,
    isRecording,
    elapsedSeconds,
    preparationElapsedSeconds,
    audioBlob,
    audioUrl,

    // Computed
    currentQuestion,
    partQuestions,
    totalQuestions,
    currentQuestionNumber,
    isPartCompleted,
    isExamCompleted,
    hasRecording,
    currentFeedback,

    // Actions
    setTest,
    setPart,
    nextQuestion,
    previousQuestion,
    startRecording,
    stopRecording,
    saveRecording,
    deleteRecording,
    startPreparationTimer,
    stopPreparationTimer,
    resetRecordingState,
    uploadRecording,
    uploadAllRecordings,
    setFeedback,
    clearSpeaking,
  }
})
