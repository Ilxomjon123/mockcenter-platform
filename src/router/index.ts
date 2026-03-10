import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'
import { useSpeakingStore } from '@/stores/speakingStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/section-select',
    name: 'section-select',
    component: () => import('@/views/SectionSelectView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reading',
    name: 'reading',
    component: () => import('@/views/ReadingExamView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    name: 'writing',
    component: () => import('@/views/WritingExamView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/listening',
    name: 'listening',
    component: () => import('@/views/ListeningExamView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/speaking',
    name: 'speaking',
    component: () => import('@/views/SpeakingExamView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/submission',
    name: 'submission',
    component: () => import('@/views/SubmissionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/completed',
    name: 'completed',
    component: () => import('@/views/CompletedView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/preview/:type',
    name: 'preview',
    component: () => import('@/views/PreviewExamView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Helper to get next available section
const getNextAvailableSection = (
  currentSection: 'listening' | 'reading' | 'writing' | 'speaking',
  listeningStore: ReturnType<typeof useListeningStore>,
  readingStore: ReturnType<typeof useReadingStore>,
  writingStore: ReturnType<typeof useWritingStore>,
  speakingStore: ReturnType<typeof useSpeakingStore>,
): string => {
  const sections = ['listening', 'reading', 'writing', 'speaking'] as const
  const currentIndex = sections.indexOf(currentSection)

  for (let i = currentIndex + 1; i < sections.length; i++) {
    const section = sections[i]
    if (section === 'listening' && listeningStore.test?.parts?.length) {
      return 'listening'
    }
    if (section === 'reading' && readingStore.test?.parts?.length) {
      return 'reading'
    }
    if (section === 'writing' && writingStore.test?.parts?.length) {
      return 'writing'
    }
    if (section === 'speaking' && speakingStore.test?.parts?.length) {
      return 'speaking'
    }
  }

  return 'submission'
}

// Helper to get first available section
const getFirstAvailableSection = (
  listeningStore: ReturnType<typeof useListeningStore>,
  readingStore: ReturnType<typeof useReadingStore>,
  writingStore: ReturnType<typeof useWritingStore>,
  speakingStore: ReturnType<typeof useSpeakingStore>,
  examType?: string,
): string => {
  // CEFR exams go to section-select page
  if (examType === 'cerf') {
    return 'section-select'
  }

  if (listeningStore.test?.parts?.length) return 'listening'
  if (readingStore.test?.parts?.length) return 'reading'
  if (writingStore.test?.parts?.length) return 'writing'
  if (speakingStore.test?.parts?.length) return 'speaking'
  return 'submission'
}

// Navigation guard - check on each route transition
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false // Default: true
  const isAuthenticated = authStore.isAuthenticated

  // If route requires auth and user is not logged in
  if (requiresAuth && !isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }, // Redirect back after login
    })
    return
  }

  // Fetch test data when authenticated and not yet loaded (e.g. page refresh)
  if (requiresAuth && isAuthenticated && !authStore.testDataLoaded && !authStore.isLoadingTest) {
    await authStore.fetchTestData()
  }

  const listeningStore = useListeningStore()
  const readingStore = useReadingStore()
  const writingStore = useWritingStore()
  const speakingStore = useSpeakingStore()

  // If user is already logged in and trying to access login page or root
  // Allow login page access when token query param is present (preview/re-login flow)
  if ((to.name === 'login' || to.path === '/') && isAuthenticated) {
    if (to.name === 'login' && to.query.token) {
      next()
      return
    }
    const examType = authStore.examType
    const firstSection = getFirstAvailableSection(listeningStore, readingStore, writingStore, speakingStore, examType)
    next({ name: firstSection })
    return
  }

  // Allow going back from submission page to review
  const isComingFromSubmission = from.name === 'submission'

  // Check if listening section is available
  if (to.name === 'listening' && isAuthenticated) {
    // If listening is not available, skip to next section
    if (!listeningStore.test?.parts?.length) {
      const nextSection = getNextAvailableSection('listening', listeningStore, readingStore, writingStore, speakingStore)
      next({ name: nextSection })
      return
    }
    // If listening is completed and NOT coming from submission, go to next section
    if (listeningStore.isCompleted && !isComingFromSubmission) {
      const nextSection = getNextAvailableSection('listening', listeningStore, readingStore, writingStore, speakingStore)
      next({ name: nextSection })
      return
    }
  }

  // Check if reading section is available
  if (to.name === 'reading' && isAuthenticated) {
    // If reading is not available, skip to next section
    if (!readingStore.test?.parts?.length) {
      const nextSection = getNextAvailableSection('reading', listeningStore, readingStore, writingStore, speakingStore)
      next({ name: nextSection })
      return
    }
    // Block access if reading is completed and time exceeded (unless coming from submission)
    if (!isComingFromSubmission) {
      const SIXTY_MINUTES = 60 * 60 * 1000
      const now = Date.now()
      const elapsed = now - (readingStore.startTime || now)

      if (
        readingStore.isFinalized ||
        (readingStore.isCompleted && (elapsed >= SIXTY_MINUTES || !readingStore.isManualSubmit))
      ) {
        const nextSection = getNextAvailableSection('reading', listeningStore, readingStore, writingStore, speakingStore)
        next({ name: nextSection })
        return
      }
    }
  }

  // Check if writing section is available
  if (to.name === 'writing' && isAuthenticated) {
    // If writing is not available, skip to next section
    if (!writingStore.test?.parts?.length) {
      const nextSection = getNextAvailableSection('writing', listeningStore, readingStore, writingStore, speakingStore)
      next({ name: nextSection })
      return
    }
  }

  // Check if speaking section is available
  if (to.name === 'speaking' && isAuthenticated) {
    if (!speakingStore.test?.parts?.length) {
      next({ name: 'submission' })
      return
    }
    if (speakingStore.isCompleted && !isComingFromSubmission) {
      next({ name: 'submission' })
      return
    }
  }

  next()
})

export default router
