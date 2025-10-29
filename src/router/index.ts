import { createRouter, createWebHistory } from 'vue-router'
import WritingView from '@/views/WritingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/writing',
    },
    {
      path: '/writing',
      name: 'writing',
      component: WritingView,
    },
  ],
})

export default router
