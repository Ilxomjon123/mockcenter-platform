import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useApi } from '@/composables/useApi'
import type { User, BandScore, ExamHistory, DashboardStats, SubscriptionPlan } from '@/types/user'
import { SubscriptionStatus } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const { get, post } = useApi()

  // User profile data
  const user = useLocalStorage<User | null>('user_profile', null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  // Dashboard data
  const bandScores = ref<BandScore[]>([])
  const examHistory = ref<ExamHistory[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)

  const subscriptionStatus = computed(() => user.value?.subscription_status ?? SubscriptionStatus.TRIAL)

  const subscriptionPlan = computed(() => user.value?.subscription_plan)

  const isSubscribed = computed(() =>
    [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL].includes(subscriptionStatus.value),
  )

  const hasFeature = computed(() => {
    return (feature: string): boolean => {
      if (!subscriptionPlan.value) return false

      const featureAccess: Record<SubscriptionPlan, string[]> = {
        free: ['practice_mode', 'basic_analytics'],
        basic: ['practice_mode', 'basic_analytics', 'answer_review', 'speaking_part1'],
        pro: [
          'practice_mode',
          'basic_analytics',
          'answer_review',
          'speaking_part1',
          'speaking_part2',
          'ai_feedback',
        ],
        premium: [
          'practice_mode',
          'basic_analytics',
          'answer_review',
          'speaking_full',
          'ai_feedback',
          'examiner_review',
          'certificate',
        ],
      }

      return featureAccess[subscriptionPlan.value].includes(feature)
    }
  })

  const averageBand = computed(() => {
    if (bandScores.value.length === 0) return 0
    const sum = bandScores.value.reduce((acc, score) => acc + score.band, 0)
    return Number((sum / bandScores.value.length).toFixed(1))
  })

  const bestBand = computed(() => {
    if (bandScores.value.length === 0) return 0
    return Math.max(...bandScores.value.map((score) => score.band))
  })

  // Actions
  const fetchProfile = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await get<{ data: User }>('/api/user/profile')

      if (response?.data) {
        user.value = response.data
        return { success: true }
      } else {
        throw new Error('Profile not found')
      }
    } catch (error: unknown) {
      errorMessage.value = 'Failed to load profile'
      return { success: false, message: errorMessage.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchDashboardStats = async () => {
    isLoading.value = true

    try {
      const response = await get<{ data: DashboardStats }>('/api/user/dashboard-stats')

      if (response?.data) {
        dashboardStats.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchBandScores = async () => {
    try {
      const response = await get<{ data: BandScore[] }>('/api/user/band-scores')

      if (response?.data) {
        bandScores.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch band scores:', error)
    }
  }

  const fetchExamHistory = async () => {
    try {
      const response = await get<{ data: ExamHistory[] }>('/api/user/exam-history')

      if (response?.data) {
        examHistory.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch exam history:', error)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await post<{ data: User }>('/api/user/profile', data)

      if (response?.data) {
        user.value = { ...user.value, ...response.data }
        return { success: true }
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error: unknown) {
      errorMessage.value = 'Failed to update profile'
      return { success: false, message: errorMessage.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearUser = () => {
    user.value = null
    bandScores.value = []
    examHistory.value = []
    dashboardStats.value = null
    errorMessage.value = ''
  }

  return {
    user,
    isLoading,
    errorMessage,
    bandScores,
    examHistory,
    dashboardStats,
    isAuthenticated,
    subscriptionStatus,
    subscriptionPlan,
    isSubscribed,
    hasFeature,
    averageBand,
    bestBand,
    fetchProfile,
    fetchDashboardStats,
    fetchBandScores,
    fetchExamHistory,
    updateProfile,
    clearUser,
  }
})
