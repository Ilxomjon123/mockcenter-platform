import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import axios from 'axios'
import type { ExamTestRaw } from '@/types/test'

interface LoginResponse {
  data: {
    access_token: string
  }
  message?: string
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
  const isLoading = ref(false)
  const errorMessage = ref('')
  const isLoadingTest = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  // Get first available section based on test data
  const getFirstAvailableSection = async (): Promise<string> => {
    const { useListeningStore } = await import('@/stores/listeningStore')
    const { useReadingStore } = await import('@/stores/readingStore')
    const { useWritingStore } = await import('@/stores/writingStore')

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
        // Import stores dynamically to avoid circular dependencies
        const { useListeningStore } = await import('@/stores/listeningStore')
        const { useReadingStore } = await import('@/stores/readingStore')
        const { useWritingStore } = await import('@/stores/writingStore')

        const testData = response.data

        // Save data to respective stores
        if (testData.listening) {
          const listeningStore = useListeningStore()
          listeningStore.setTest(testData)
        }

        if (testData.reading) {
          const readingStore = useReadingStore()
          readingStore.setTest(testData)
        }

        if (testData.writing) {
          const writingStore = useWritingStore()
          writingStore.setTest(testData)
        }

        return { success: true }
      } else {
        throw new Error('Test ma\'lumotlari topilmadi')
      }
    } catch (error: unknown) {
      let message = 'Test ma\'lumotlarini yuklashda xatolik'
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

  const login = async (email: string, password: string) => {
    errorMessage.value = ''
    isLoading.value = true

    try {
      const response = await post<LoginResponse>('/api/exam/login', {
        email,
        key: password,
      })

      if (response?.data?.access_token) {
        token.value = response.data.access_token
        localStorage.setItem('token', response.data.access_token)

        // Fetch test data after successful login
        await fetchTestData()

        // Get redirect path from query or first available section
        let redirectPath = route.query.redirect as string
        if (!redirectPath) {
          redirectPath = await getFirstAvailableSection()
        }
        await router.push(redirectPath)

        return { success: true }
      } else {
        errorMessage.value = response?.message || "Login yoki parol noto'g'ri"
        return { success: false, message: errorMessage.value }
      }
    } catch (error: unknown) {
      let message = 'Serverga ulanishda xatolik'
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message
      } else if (error instanceof Error) {
        message = error.message
      }
      errorMessage.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (redirectPath: string = '/login') => {
    // Clear all store data
    const { useListeningStore } = await import('@/stores/listeningStore')
    const { useReadingStore } = await import('@/stores/readingStore')
    const { useWritingStore } = await import('@/stores/writingStore')

    const listeningStore = useListeningStore()
    const readingStore = useReadingStore()
    const writingStore = useWritingStore()

    listeningStore.clearListening()
    readingStore.clearReading()
    writingStore.clearWriting()

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
      const { useListeningStore } = await import('@/stores/listeningStore')
      const { useReadingStore } = await import('@/stores/readingStore')
      const { useWritingStore } = await import('@/stores/writingStore')

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
        return { success: false, message: "Imtihonni topshirishda xatolik yuz berdi" }
      }
    } catch (error: unknown) {
      let message = 'Serverga ulanishda xatolik'
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
    isLoading,
    isLoadingTest,
    errorMessage,
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
