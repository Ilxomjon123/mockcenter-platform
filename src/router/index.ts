import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/reading',
  },
  {
    path: '/reading',
    name: 'reading',
    component: () => import('@/views/ReadingExamView.vue'),
  },
  {
    path: '/writing',
    name: 'writing',
    component: () => import('@/views/WritingExamView.vue'),
  },
  {
    path: '/listening',
    name: 'listening',
    component: () => import('@/views/ListeningExamView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
