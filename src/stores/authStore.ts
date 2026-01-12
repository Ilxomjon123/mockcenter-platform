import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'

interface LoginResponse {
  data: {
    access_token: string
  }
  message?: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const route = useRoute()
  const { post } = useApi()

  const token = ref(localStorage.getItem('token') || '')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const isAuthenticated = computed(() => !!token.value)

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

        // Query parametrdan redirect manzilni olish
        const redirectPath = (route.query.redirect as string) || '/listening'
        await router.push(redirectPath)

        return { success: true }
      } else {
        errorMessage.value = response?.message || "Login yoki parol noto'g'ri"
        return { success: false, message: errorMessage.value }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Serverga ulanishda xatolik'
      errorMessage.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
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
    errorMessage,
    isAuthenticated,
    login,
    logout,
    clearError,
    checkAuth,
  }
})
