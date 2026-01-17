<template>
  <div class="recent-exams-card">
    <div class="card-header">
      <h2>Recent Exams</h2>
      <router-link to="/practice/history" class="view-all">View All</router-link>
    </div>
    <div class="exam-list">
      <div v-for="exam in recentExams" :key="exam.id" class="exam-item">
        <div class="exam-info">
          <div class="exam-title">{{ exam.title }}</div>
          <div class="exam-date">{{ formatDate(exam.completed_at) }}</div>
        </div>
        <div class="exam-score">
          <div class="overall-band">{{ exam.scores.overall }}</div>
          <router-link :to="`/practice/review/${exam.id}`" class="review-link">
            Review
          </router-link>
        </div>
      </div>
    </div>
    <div v-if="recentExams.length === 0" class="empty-state">
      <p>No exams yet</p>
      <p class="empty-hint">Take your first practice test to see results here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExamHistory } from '@/types/user'

interface Props {
  exams: ExamHistory[]
}

const props = withDefaults(defineProps<Props>(), {
  exams: () => [],
})

const recentExams = computed(() => {
  return props.exams.slice(0, 5)
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.recent-exams-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.view-all {
  font-size: 14px;
  color: #059669;
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.exam-info {
  flex: 1;
}

.exam-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.exam-date {
  font-size: 12px;
  color: #6b7280;
}

.exam-score {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overall-band {
  font-size: 20px;
  font-weight: 700;
  color: #059669;
  min-width: 32px;
  text-align: center;
}

.review-link {
  padding: 6px 12px;
  background: #059669;
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.review-link:hover {
  background: #047857;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
}
</style>
