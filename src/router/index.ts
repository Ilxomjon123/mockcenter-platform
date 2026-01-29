import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'

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
  currentSection: 'listening' | 'reading' | 'writing',
  listeningStore: ReturnType<typeof useListeningStore>,
  readingStore: ReturnType<typeof useReadingStore>,
  writingStore: ReturnType<typeof useWritingStore>
): string => {
  const sections = ['listening', 'reading', 'writing'] as const
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
  }

  return 'submission'
}

// Helper to get first available section
const getFirstAvailableSection = (
  listeningStore: ReturnType<typeof useListeningStore>,
  readingStore: ReturnType<typeof useReadingStore>,
  writingStore: ReturnType<typeof useWritingStore>
): string => {
  if (listeningStore.test?.parts?.length) return 'listening'
  if (readingStore.test?.parts?.length) return 'reading'
  if (writingStore.test?.parts?.length) return 'writing'
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

  // Fetch test data when authenticated and accessing exam pages
  if (requiresAuth && isAuthenticated && !authStore.isLoadingTest) {
    await authStore.fetchTestData()
  }

  const listeningStore = useListeningStore()
  const readingStore = useReadingStore()
  const writingStore = useWritingStore()

  // If user is already logged in and trying to access login page or root
  if ((to.name === 'login' || to.path === '/') && isAuthenticated) {
    const firstSection = getFirstAvailableSection(listeningStore, readingStore, writingStore)
    next({ name: firstSection })
    return
  }

  // Check if listening section is available
  if (to.name === 'listening' && isAuthenticated) {
    // If listening is not available, skip to next section
    if (!listeningStore.test?.parts?.length) {
      const nextSection = getNextAvailableSection('listening', listeningStore, readingStore, writingStore)
      next({ name: nextSection })
      return
    }
    // If listening is completed, go to next section
    if (listeningStore.isCompleted) {
      const nextSection = getNextAvailableSection('listening', listeningStore, readingStore, writingStore)
      next({ name: nextSection })
      return
    }
  }

  // Check if reading section is available
  if (to.name === 'reading' && isAuthenticated) {
    // If reading is not available, skip to next section
    if (!readingStore.test?.parts?.length) {
      const nextSection = getNextAvailableSection('reading', listeningStore, readingStore, writingStore)
      next({ name: nextSection })
      return
    }
    // Block access if reading is completed and time exceeded
    const SIXTY_MINUTES = 60 * 60 * 1000
    const now = Date.now()
    const elapsed = now - (readingStore.startTime || now)

    if (
      readingStore.isFinalized ||
      (readingStore.isCompleted && (elapsed >= SIXTY_MINUTES || !readingStore.isManualSubmit))
    ) {
      const nextSection = getNextAvailableSection('reading', listeningStore, readingStore, writingStore)
      next({ name: nextSection })
      return
    }
  }

  // Check if writing section is available
  if (to.name === 'writing' && isAuthenticated) {
    // If writing is not available, go to submission
    if (!writingStore.test?.parts?.length) {
      next({ name: 'submission' })
      return
    }
  }

  next()
})

export default router
