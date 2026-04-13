<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCscaStore } from '@/stores/cscaStore'
import { useAuthStore } from '@/stores/authStore'
import { CSCA_SUBJECT_LABELS } from '@/types/csca'

const router = useRouter()
const cscaStore = useCscaStore()
const authStore = useAuthStore()

onMounted(() => {
  cscaStore.restore()
  if (!cscaStore.allCompleted) {
    router.replace({ name: 'csca-subjects' })
  }
})

const results = computed(() =>
  cscaStore.subjects.map((s) => ({
    sessionId: s.session_id,
    subject: CSCA_SUBJECT_LABELS[s.subject] || s.subject,
    result: cscaStore.results[s.session_id],
  })),
)

const totalCorrect = computed(() =>
  results.value.reduce((sum, r) => sum + (r.result?.correct_count || 0), 0),
)

const totalQuestions = computed(() =>
  results.value.reduce((sum, r) => sum + (r.result?.total_questions || 0), 0),
)

// CSCA: each subject scored 0-100. Total = sum of subject scores. Average = sum / subjects.
const subjectsCount = computed(() => results.value.length)

const totalScore = computed(() =>
  results.value.reduce((sum, r) => sum + Math.round(r.result?.score || 0), 0),
)

const maxTotalScore = computed(() => subjectsCount.value * 100)

const averageScore = computed(() => {
  if (subjectsCount.value === 0) return 0
  return Math.round(totalScore.value / subjectsCount.value)
})

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="csca-results">
    <div class="csca-results__container">
      <div class="csca-results__icon">✓</div>
      <h1 class="csca-results__title">Exam Completed</h1>
      <p class="csca-results__subtitle">All subjects have been submitted successfully</p>

      <div class="csca-results__overall">
        <div class="csca-results__overall-label">Average Score</div>
        <div class="csca-results__overall-score">{{ averageScore }} <span>/ 100</span></div>
        <div class="csca-results__overall-meta">
          Total: {{ totalScore }} / {{ maxTotalScore }} · {{ totalCorrect }}/{{ totalQuestions }}
          correct
        </div>
      </div>

      <div class="csca-results__list">
        <h2 class="csca-results__list-title">By Subject</h2>
        <div v-for="item in results" :key="item.sessionId" class="csca-results__row">
          <div class="csca-results__row-subject">{{ item.subject }}</div>
          <div class="csca-results__row-score">
            <span class="csca-results__row-percent">
              {{ Math.round(item.result?.score || 0) }} <small>/ 100</small>
            </span>
            <span class="csca-results__row-count">
              {{ item.result?.correct_count || 0 }}/{{ item.result?.total_questions || 0 }} correct
            </span>
          </div>
        </div>
      </div>

      <button class="csca-results__logout" @click="handleLogout">Log out</button>
    </div>
  </div>
</template>

<style scoped>
.csca-results {
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
  padding: 2.5rem 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.csca-results__container {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1rem;
  padding: 2.5rem;
  max-width: 640px;
  width: 100%;
  text-align: center;
}

.csca-results__icon {
  width: 72px;
  height: 72px;
  background: #16a34a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1.25rem;
}

.csca-results__title {
  font-size: 1.875rem;
  margin: 0 0 0.5rem;
}

.csca-results__subtitle {
  color: #94a3b8;
  margin: 0 0 2rem;
}

.csca-results__overall {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.csca-results__overall-label {
  color: #94a3b8;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.csca-results__overall-score {
  font-size: 3rem;
  font-weight: 700;
  color: #22c55e;
}

.csca-results__overall-score span {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 500;
}

.csca-results__overall-meta {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.csca-results__list {
  text-align: left;
  margin-bottom: 2rem;
}

.csca-results__list-title {
  font-size: 1rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem;
}

.csca-results__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.csca-results__row-subject {
  font-weight: 600;
}

.csca-results__row-score {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
}

.csca-results__row-percent {
  font-size: 1.125rem;
  font-weight: 700;
  color: #22c55e;
}

.csca-results__row-percent small {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.csca-results__row-count {
  color: #94a3b8;
  font-size: 0.875rem;
}

.csca-results__logout {
  background: #334155;
  color: #f1f5f9;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9375rem;
}

.csca-results__logout:hover {
  background: #475569;
}
</style>
