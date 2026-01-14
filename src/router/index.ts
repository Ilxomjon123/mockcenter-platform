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
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/listening',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard - har bir route o'tishda tekshirish
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false // Default: true
  const isAuthenticated = authStore.isAuthenticated

  // Agar route auth talab qilsa va user login qilmagan bo'lsa
  if (requiresAuth && !isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }, // Login qilgandan keyin qaytish uchun
    })
    return
  }

  // Agar user allaqachon login qilgan bo'lsa va login sahifasiga kirmoqchi bo'lsa
  if (to.name === 'login' && isAuthenticated) {
    next({ name: 'listening' })
    return
  }

  // Agar listening tugagan bo'lsa, listening sahifasiga kirishni bloklash
  if (to.name === 'listening' && isAuthenticated) {
    const listeningStore = useListeningStore()
    if (listeningStore.isCompleted) {
      next({ name: 'reading' })
      return
    }
  }

  // Agar reading tugagan bo'lsa va 60 daqiqadan ko'p o'tgan bo'lsa, reading sahifasiga kirishni bloklash
  if (to.name === 'reading' && isAuthenticated) {
    const readingStore = useReadingStore()
    const SIXTY_MINUTES = 60 * 60 * 1000
    const now = Date.now()
    const elapsed = now - (readingStore.startTime || now)

    if (readingStore.isCompleted && (elapsed >= SIXTY_MINUTES || !readingStore.isManualSubmit)) {
      next({ name: 'writing' })
      return
    }
  }

  // Agar authenticated bo'lib, exam sahifalariga kirayotgan bo'lsa, test ma'lumotlarini har safar yangilab olish
  if (requiresAuth && isAuthenticated && !authStore.isLoadingTest) {
    // Har safar page refresh qilinganda test ma'lumotlarini API dan yangilab olish
    await authStore.fetchTestData()
  }

  next()
})

export default router
