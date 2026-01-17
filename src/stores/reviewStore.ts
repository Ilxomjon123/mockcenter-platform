import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import type { ProcessedQuestion } from '@/types/test'
import type { BandScore } from '@/types/user'

export interface AnswerReview {
  question_id: number
  question_number: number
  user_answer: string | string[] | null
  correct_answer: string | string[]
  is_correct: boolean
  explanation?: string
  keywords?: string[]
  section: 'listening' | 'reading' | 'writing' | 'speaking'
}

export interface WritingReview {
  question_id: number
  user_answer: string
  word_count: number
  band_score: number
  task_response_band: number
  coherence_band: number
  lexical_resource_band: number
  grammatical_band: number
  ai_feedback: string
  examiner_comments?: string
  corrections?: Array<{
    original: string
    corrected: string
    type: 'grammar' | 'vocabulary' | 'spelling'
  }>
}

export interface ExamReview {
  exam_id: number
  exam_title: string
  exam_type: 'exam' | 'practice'
  completed_at: string
  listening_reviews: AnswerReview[]
  reading_reviews: AnswerReview[]
  writing_reviews: WritingReview[]
  speaking_reviews?: AnswerReview[]
  overall_band: number
  section_bands: {
    listening?: number
    reading?: number
    writing?: number
    speaking?: number
  }
}

export const useReviewStore = defineStore('review', () => {
  const { get } = useApi()

  // State
  const currentReview = ref<ExamReview | null>(null)
  const selectedSection = ref<'all' | 'listening' | 'reading' | 'writing' | 'speaking'>('all')
  const isLoading = ref(false)
  const errorMessage = ref('')

  // Computed
  const allReviews = computed(() => {
    if (!currentReview.value) return []

    const reviews: AnswerReview[] = []

    if (selectedSection.value === 'all' || selectedSection.value === 'listening') {
      reviews.push(...currentReview.value.listening_reviews)
    }

    if (selectedSection.value === 'all' || selectedSection.value === 'reading') {
      reviews.push(...currentReview.value.reading_reviews)
    }

    if (selectedSection.value === 'all' || selectedSection.value === 'speaking') {
      reviews.push(...(currentReview.value.speaking_reviews || []))
    }

    return reviews.sort((a, b) => a.question_number - b.question_number)
  })

  const writingReviews = computed(() => {
    return currentReview.value?.writing_reviews || []
  })

  const correctCount = computed(() => {
    return allReviews.value.filter((r) => r.is_correct).length
  })

  const incorrectCount = computed(() => {
    return allReviews.value.filter((r) => !r.is_correct).length
  })

  const correctPercentage = computed(() => {
    const total = allReviews.value.length
    if (total === 0) return 0
    return Math.round((correctCount.value / total) * 100)
  })

  const sectionStats = computed(() => {
    if (!currentReview.value) return null

    return {
      listening: {
        correct: currentReview.value.listening_reviews.filter((r) => r.is_correct).length,
        total: currentReview.value.listening_reviews.length,
        band: currentReview.value.section_bands.listening || 0,
      },
      reading: {
        correct: currentReview.value.reading_reviews.filter((r) => r.is_correct).length,
        total: currentReview.value.reading_reviews.length,
        band: currentReview.value.section_bands.reading || 0,
      },
      writing: {
        band: currentReview.value.section_bands.writing || 0,
      },
      speaking: {
        band: currentReview.value.section_bands.speaking || 0,
      },
    }
  })

  // Actions
  const fetchExamReview = async (examId: number) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await get<{ data: ExamReview }>(`/api/review/exam/${examId}`)

      if (response?.data) {
        currentReview.value = response.data
        return { success: true }
      } else {
        throw new Error('Review not found')
      }
    } catch (error: unknown) {
      errorMessage.value = 'Failed to load exam review'
      return { success: false, message: errorMessage.value }
    } finally {
      isLoading.value = false
    }
  }

  const setSelectedSection = (section: 'all' | 'listening' | 'reading' | 'writing' | 'speaking') => {
    selectedSection.value = section
  }

  const clearReview = () => {
    currentReview.value = null
    selectedSection.value = 'all'
    errorMessage.value = ''
  }

  return {
    // State
    currentReview,
    selectedSection,
    isLoading,
    errorMessage,

    // Computed
    allReviews,
    writingReviews,
    correctCount,
    incorrectCount,
    correctPercentage,
    sectionStats,

    // Actions
    fetchExamReview,
    setSelectedSection,
    clearReview,
  }
})
