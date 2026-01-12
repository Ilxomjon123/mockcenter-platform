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

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const route = useRoute()
  const { post, get } = useApi()

  const token = ref(localStorage.getItem('token') || '')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const isLoadingTest = ref(false)

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

        // Query parametrdan redirect manzilni olish
        const redirectPath = (route.query.redirect as string) || '/listening'
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

  const logout = async () => {
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
    localStorage.removeItem('token')

    router.push('/login')
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
    clearError,
    checkAuth,
    fetchTestData,
  }
})
