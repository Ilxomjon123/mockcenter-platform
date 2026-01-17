import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useModeStore } from '@/stores/modeStore'

const routes: RouteRecordRaw[] = [
  // Exam routes (existing)
  {
    path: '/',
    redirect: '/exam',
    meta: { requiresAuth: false },
  },
  {
    path: '/exam',
    redirect: '/exam/listening',
    meta: { requiresAuth: false },
  },
  {
    path: '/exam/login',
    name: 'exam-login',
    component: () => import('@/views/Auth/ExamLoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/exam/listening',
    name: 'exam-listening',
    component: () => import('@/views/ListeningExamView.vue'),
    meta: { requiresAuth: true, mode: 'exam' },
  },
  {
    path: '/exam/reading',
    name: 'exam-reading',
    component: () => import('@/views/ReadingExamView.vue'),
    meta: { requiresAuth: true, mode: 'exam' },
  },
  {
    path: '/exam/writing',
    name: 'exam-writing',
    component: () => import('@/views/WritingExamView.vue'),
    meta: { requiresAuth: true, mode: 'exam' },
  },
  {
    path: '/exam/completed',
    name: 'exam-completed',
    component: () => import('@/views/CompletedView.vue'),
    meta: { requiresAuth: false, mode: 'exam' },
  },

  // Practice routes (new)
  {
    path: '/practice',
    redirect: '/practice/dashboard',
    meta: { requiresAuth: false },
  },
  {
    path: '/practice/login',
    name: 'practice-login',
    component: () => import('@/views/Auth/PracticeLoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/practice/dashboard',
    name: 'practice-dashboard',
    component: () => import('@/views/practice/DashboardView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/listening',
    name: 'practice-listening',
    component: () => import('@/views/ListeningExamView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/reading',
    name: 'practice-reading',
    component: () => import('@/views/ReadingExamView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/writing',
    name: 'practice-writing',
    component: () => import('@/views/WritingExamView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/speaking',
    name: 'practice-speaking',
    component: () => import('@/views/SpeakingExamView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/review/:examId',
    name: 'practice-review',
    component: () => import('@/views/practice/ReviewView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },
  {
    path: '/practice/completed',
    name: 'practice-completed',
    component: () => import('@/views/practice/PracticeCompletedView.vue'),
    meta: { requiresAuth: true, mode: 'practice' },
  },

  // Subscription routes
  {
    path: '/subscription',
    name: 'subscription',
    component: () => import('@/views/SubscriptionView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/subscription/plans',
    name: 'subscription-plans',
    component: () => import('@/views/SubscriptionPlansView.vue'),
    meta: { requiresAuth: false },
  },

  // Legacy routes (redirect to exam routes)
  {
    path: '/login',
    redirect: '/exam/login',
    meta: { requiresAuth: false },
  },
  {
    path: '/listening',
    redirect: '/exam/listening',
    meta: { requiresAuth: true },
  },
  {
    path: '/reading',
    redirect: '/exam/reading',
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    redirect: '/exam/writing',
    meta: { requiresAuth: true },
  },
  {
    path: '/completed',
    redirect: '/exam/completed',
    meta: { requiresAuth: false },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard - check on each route transition
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const modeStore = useModeStore()
  const requiresAuth = to.meta.requiresAuth !== false // Default: true
  const routeMode = to.meta.mode as 'exam' | 'practice' | undefined
  const isAuthenticated = authStore.isAuthenticated

  // Set mode based on route
  if (routeMode === 'exam') {
    modeStore.setExamMode()
  } else if (routeMode === 'practice') {
    modeStore.setPracticeMode()
  }

  // If route requires auth and user is not logged in
  if (requiresAuth && !isAuthenticated) {
    const loginRoute = routeMode === 'practice' ? 'practice-login' : 'exam-login'
    next({
      name: loginRoute,
      query: { redirect: to.fullPath },
    })
    return
  }

  // If user is already logged in and trying to access login page
  if ((to.name === 'practice-login' || to.name === 'exam-login') && isAuthenticated) {
    const redirectRoute = routeMode === 'practice' ? 'practice-dashboard' : 'exam-listening'
    next({ name: redirectRoute })
    return
  }

  // Mode-specific route protection
  if (routeMode && isAuthenticated) {
    const currentModeMatchesRoute =
      (routeMode === 'exam' && modeStore.isExamMode) ||
      (routeMode === 'practice' && modeStore.isPracticeMode)

    if (!currentModeMatchesRoute) {
      // Redirect to appropriate login
      const loginRoute = routeMode === 'practice' ? 'practice-login' : 'exam-login'
      next({ name: loginRoute })
      return
    }
  }

  // Exam mode navigation guards
  if (modeStore.isExamMode) {
    // Block access to listening page if listening is completed
    if (to.name === 'exam-listening' && isAuthenticated) {
      const listeningStore = useListeningStore()
      if (listeningStore.isCompleted) {
        next({ name: 'exam-reading' })
        return
      }
    }

    // Block access to reading page if reading is completed and more than 60 minutes passed
    if (to.name === 'exam-reading' && isAuthenticated) {
      const readingStore = useReadingStore()
      const SIXTY_MINUTES = 60 * 60 * 1000
      const now = Date.now()
      const elapsed = now - (readingStore.startTime || now)

      if (
        readingStore.isFinalized ||
        (readingStore.isCompleted && (elapsed >= SIXTY_MINUTES || !readingStore.isManualSubmit))
      ) {
        next({ name: 'exam-writing' })
        return
      }
    }
  }

  // Fetch test data when authenticated and accessing exam pages
  if (requiresAuth && isAuthenticated && !authStore.isLoadingTest && modeStore.isExamMode) {
    // Refresh test data from API on each page refresh
    await authStore.fetchTestData()
  }

  next()
})

export default router
