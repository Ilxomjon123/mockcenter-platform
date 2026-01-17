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
  const isFullscreenEnforced = ref(false)

  const isAuthenticated = computed(() => !!token.value)

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

        if (testData.speaking) {
          const { useSpeakingStore } = await import('@/stores/speakingStore')
          const speakingStore = useSpeakingStore()
          speakingStore.setTest(testData)
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
      const { useModeStore } = await import('@/stores/modeStore')
      const modeStore = useModeStore()

      const endpoint = modeStore.isPracticeMode ? '/api/auth/login' : '/api/exam/login'

      const response = await post<LoginResponse>(endpoint, {
        email,
        key: password,
      })

      if (response?.data?.access_token) {
        token.value = response.data.access_token
        localStorage.setItem('token', response.data.access_token)

        // Fetch test data after successful login for exam mode
        if (modeStore.isExamMode) {
          await fetchTestData()

          // Enforce fullscreen in exam mode
          try {
            await document.documentElement.requestFullscreen()
            isFullscreenEnforced.value = true
          } catch (e) {
            console.warn('Could not enter fullscreen:', e)
          }

          // Query parametrdan redirect manzilni olish
          const redirectPath = (route.query.redirect as string) || '/listening'
          await router.push(redirectPath)
        } else {
          // In practice mode, fetch user profile and redirect to dashboard
          const { useUserStore } = await import('@/stores/userStore')
          const userStore = useUserStore()
          await userStore.fetchProfile()

          const redirectPath = (route.query.redirect as string) || '/dashboard'
          await router.push(redirectPath)
        }

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

  const logout = async (redirectPath: string = '/login', autoLogout: boolean = false) => {
    const { useModeStore } = await import('@/stores/modeStore')
    const modeStore = useModeStore()

    // In exam mode, auto logout after submit
    // In practice mode, don't auto logout unless explicitly requested
    if (modeStore.isPracticeMode && !autoLogout) {
      // Don't logout in practice mode, just redirect to dashboard
      router.push('/dashboard')
      return
    }

    // Clear all store data
    const { useListeningStore } = await import('@/stores/listeningStore')
    const { useReadingStore } = await import('@/stores/readingStore')
    const { useWritingStore } = await import('@/stores/writingStore')
    const { useUserStore } = await import('@/stores/userStore')
    const { useSpeakingStore } = await import('@/stores/speakingStore')

    const listeningStore = useListeningStore()
    const readingStore = useReadingStore()
    const writingStore = useWritingStore()
    const userStore = useUserStore()
    const speakingStore = useSpeakingStore()

    listeningStore.clearListening()
    readingStore.clearReading()
    writingStore.clearWriting()
    userStore.clearUser()
    speakingStore.clearSpeaking()

    // Exit fullscreen if enforced
    if (isFullscreenEnforced.value && document.fullscreenElement) {
      await document.exitFullscreen()
    }
    isFullscreenEnforced.value = false

    // Clear token
    token.value = ''

    // Clear all localStorage (except practice mode preferences if in practice mode)
    if (modeStore.isExamMode) {
      localStorage.clear()
    } else {
      localStorage.removeItem('token')
    }

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

    // Reset mode
    modeStore.clearMode()

    router.push(redirectPath)
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
  }
})
