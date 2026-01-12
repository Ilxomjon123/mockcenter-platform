import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

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

  // Agar authenticated bo'lib, exam sahifalariga kirayotgan bo'lsa, test ma'lumotlarini tekshirish
  if (requiresAuth && isAuthenticated && !authStore.isLoadingTest) {
    const { useListeningStore } = await import('@/stores/listeningStore')
    const listeningStore = useListeningStore()

    // Agar test ma'lumotlari yuklanmagan bo'lsa, yuklash
    if (!listeningStore.test) {
      await authStore.fetchTestData()
    }
  }

  next()
})

export default router
