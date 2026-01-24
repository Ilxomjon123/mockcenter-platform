import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/listening',
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
    redirect: '/listening',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

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

  // If user is already logged in and trying to access login page
  if (to.name === 'login' && isAuthenticated) {
    next({ name: 'listening' })
    return
  }

  // Block access to listening page if listening is completed
  if (to.name === 'listening' && isAuthenticated) {
    const listeningStore = useListeningStore()
    if (listeningStore.isCompleted) {
      next({ name: 'reading' })
      return
    }
  }

  // Block access to reading page if reading is completed and more than 60 minutes passed
  if (to.name === 'reading' && isAuthenticated) {
    const readingStore = useReadingStore()
    const SIXTY_MINUTES = 60 * 60 * 1000
    const now = Date.now()
    const elapsed = now - (readingStore.startTime || now)

    if (
      readingStore.isFinalized ||
      (readingStore.isCompleted && (elapsed >= SIXTY_MINUTES || !readingStore.isManualSubmit))
    ) {
      next({ name: 'writing' })
      return
    }
  }

  // Fetch test data when authenticated and accessing exam pages
  if (requiresAuth && isAuthenticated && !authStore.isLoadingTest) {
    // Refresh test data from API on each page refresh
    await authStore.fetchTestData()
  }

  next()
})

export default router
