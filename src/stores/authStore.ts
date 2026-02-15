import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import axios from 'axios'
import type { ExamTestRaw } from '@/types/test'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'

interface LoginResponse {
  data: {
    access_token: string
    number: string
    exam_datetime?: string
    speaking_datetime?: string
  }
  message?: string
  error?: string
  details?: string
}

interface TestDataResponse {
  data: ExamTestRaw
}

interface ExamResults {
  listening_count: number
  reading_count: number
  listening_score: number
  reading_score: number
  overall: number
}

interface SubmitResponse {
  message: string
  results: ExamResults
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const route = useRoute()
  const { post, get } = useApi()

  const token = ref(localStorage.getItem('token') || '')
  const takerNumber = ref(localStorage.getItem('takerNumber') || '')
  const examDatetime = ref(localStorage.getItem('examDatetime') || '')
  const speakingDatetime = ref(localStorage.getItem('speakingDatetime') || '')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const errorDetails = ref('')
  const isPaymentError = ref(false)
  const isLoadingTest = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  // Show speaking info only if speaking_datetime is after exam_datetime
  const showSpeakingInfo = computed(() => {
    if (!speakingDatetime.value || !examDatetime.value) {
      return false
    }
    const examDate = new Date(examDatetime.value)
    const speakingDate = new Date(speakingDatetime.value)
    return speakingDate > examDate
  })

  // Get first available section based on test data
  const getFirstAvailableSection = (): string => {
    const listeningStore = useListeningStore()
    const readingStore = useReadingStore()
    const writingStore = useWritingStore()

    if (listeningStore.test?.parts?.length) {
      return '/listening'
    }
    if (readingStore.test?.parts?.length) {
      return '/reading'
    }
    if (writingStore.test?.parts?.length) {
      return '/writing'
    }

    return '/submission'
  }

  // Fetch test data from API
  const fetchTestData = async () => {
    isLoadingTest.value = true
    try {
      const response = await get<TestDataResponse>('/api/exam/test')

      if (response?.data) {
        const testData = response.data

        // Save data to respective stores
        if (testData.listening) {
          useListeningStore().setTest(testData)
        }

        if (testData.reading) {
          useReadingStore().setTest(testData)
        }

        if (testData.writing) {
          useWritingStore().setTest(testData)
        }

        return { success: true }
      } else {
        throw new Error('Test data not found')
      }
    } catch (error: unknown) {
      let message = 'Error loading test data'
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message
      } else if (error instanceof Error) {
        message = error.message
      }
      console.error('Test data fetch error:', message)
      return { success: false, message }
    } finally {
      isLoadingTest.value = false
    }
  }

  const login = async (number: string, password: string) => {
    errorMessage.value = ''
    errorDetails.value = ''
    isPaymentError.value = false
    isLoading.value = true

    try {
      const response = await post<LoginResponse>('/api/exam/login', {
        number,
        key: password,
      })

      if (response?.data?.access_token) {
        token.value = response.data.access_token
        takerNumber.value = response.data.number
        examDatetime.value = response.data.exam_datetime || ''
        speakingDatetime.value = response.data.speaking_datetime || ''
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('takerNumber', response.data.number)
        localStorage.setItem('examDatetime', response.data.exam_datetime || '')
        localStorage.setItem('speakingDatetime', response.data.speaking_datetime || '')

        // Fetch test data after successful login
        await fetchTestData()

        // Get redirect path from query or first available section
        let redirectPath = route.query.redirect as string
        if (!redirectPath) {
          redirectPath = getFirstAvailableSection()
        }
        await router.push(redirectPath)

        return { success: true }
      } else {
        errorMessage.value = response?.message || "Invalid number or password"
        return { success: false, message: errorMessage.value }
      }
    } catch (error: unknown) {
      let message = 'Server connection error'
      let details = ''
      let isPayment = false

      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data
        message = responseData?.message || error.message

        // Check if this is a payment required error
        if (responseData?.error === 'payment_required') {
          isPayment = true
          details = responseData?.details || ''
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      errorMessage.value = message
      errorDetails.value = details
      isPaymentError.value = isPayment
      return { success: false, message, isPaymentError: isPayment }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (redirectPath: string = '/login') => {
    // Clear all store data
    useListeningStore().clearListening()
    useReadingStore().clearReading()
    useWritingStore().clearWriting()

    // Clear token
    token.value = ''

    // Clear all localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear all IndexedDB databases
    try {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    } catch (e) {
      // indexedDB.databases() may not be supported in all browsers
      console.warn('Could not clear IndexedDB:', e)
    }

    // Clear caches if available
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      } catch (e) {
        console.warn('Could not clear caches:', e)
      }
    }

    // Navigate to redirect path
    try {
      await router.push(redirectPath)
    } catch (e) {
      // Handle navigation failure (e.g., same route)
      console.warn('Navigation error:', e)
      // Force navigation using window.location if router.push fails
      window.location.href = redirectPath
    }
  }

  const submitExam = async () => {
    isLoading.value = true
    try {
      const listeningStore = useListeningStore()
      const readingStore = useReadingStore()
      const writingStore = useWritingStore()

      const payload = {
        listening_answers: listeningStore.answers,
        reading_answers: readingStore.answers,
        writing_answers: writingStore.answers,
      }

      const response = await post<SubmitResponse>('/api/exam/submit', payload)

      if (response) {
        return { success: true, results: response.results }
      } else {
        return { success: false, message: "Error submitting the exam" }
      }
    } catch (error: unknown) {
      let message = 'Server connection error'
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message
      }
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    errorMessage.value = ''
    errorDetails.value = ''
    isPaymentError.value = false
  }

  // Token validligini tekshirish
  const checkAuth = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      return true
    }
    return false
  }

  return {
    token,
    takerNumber,
    examDatetime,
    speakingDatetime,
    showSpeakingInfo,
    isLoading,
    isLoadingTest,
    errorMessage,
    errorDetails,
    isPaymentError,
    isAuthenticated,
    login,
    logout,
    submitExam,
    clearError,
    checkAuth,
    fetchTestData,
    getFirstAvailableSection,
  }
})
