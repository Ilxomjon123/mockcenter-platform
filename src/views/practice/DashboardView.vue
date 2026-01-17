<template>
  <div class="dashboard">
    <!-- Dashboard Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="user-info">
          <div class="avatar">
            <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt="Avatar" />
            <div v-else class="avatar-placeholder">{{ userStore.user?.name?.charAt(0) || 'U' }}</div>
          </div>
          <div>
            <h1>Welcome back, {{ userStore.user?.name || 'User' }}!</h1>
            <p class="subscription-badge" :class="subscriptionClass">
              {{ subscriptionText }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/subscription" class="upgrade-btn">Upgrade Plan</router-link>
          <button @click="handleLogout" class="logout-btn">Sign Out</button>
        </div>
      </div>
    </header>

    <!-- Weekly Challenge Banner -->
    <div v-if="showWeeklyChallenge" class="weekly-challenge">
      <div class="challenge-content">
        <span class="fire-icon">🔥</span>
        <div>
          <strong>Weekly Mock Challenge!</strong>
          Complete 3 practice tests this week and earn a certificate
        </div>
        <button class="challenge-btn" @click="startPractice">Start Now</button>
      </div>
    </div>

    <!-- Stats Overview -->
    <section class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ userStore.dashboardStats?.total_exams_taken || 0 }}</div>
          <div class="stat-label">Total Exams</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-value">{{ userStore.averageBand }}</div>
          <div class="stat-label">Avg Band Score</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <div class="stat-value">{{ userStore.bestBand }}</div>
          <div class="stat-label">Best Band</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <div class="stat-value">{{ userStore.dashboardStats?.current_streak || 0 }}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
    </section>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Band Score History Chart -->
      <div class="card chart-card">
        <div class="card-header">
          <h2>Band Score History</h2>
          <select v-model="chartPeriod" class="period-selector">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div class="chart-container">
          <BandScoreChart :scores="userStore.bandScores" :period="chartPeriod" />
        </div>
      </div>

      <!-- Section Progress -->
      <div class="card progress-card">
        <div class="card-header">
          <h2>Section Progress</h2>
        </div>
        <div class="progress-list">
          <div class="progress-item">
            <div class="progress-info">
              <span class="section-name">Listening</span>
              <span class="section-score">6.5</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill listening" :style="{ width: '65%' }"></div>
            </div>
          </div>
          <div class="progress-item">
            <div class="progress-info">
              <span class="section-name">Reading</span>
              <span class="section-score">7.0</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill reading" :style="{ width: '70%' }"></div>
            </div>
          </div>
          <div class="progress-item">
            <div class="progress-info">
              <span class="section-name">Writing</span>
              <span class="section-score">6.0</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill writing" :style="{ width: '60%' }"></div>
            </div>
          </div>
          <div class="progress-item">
            <div class="progress-info">
              <span class="section-name">Speaking</span>
              <span class="section-score">6.5</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill speaking" :style="{ width: '65%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Exam History -->
      <div class="card history-card">
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
      </div>

      <!-- Subscription Status -->
      <div v-if="!userStore.isSubscribed" class="card subscription-card">
        <div class="subscription-content">
          <div class="subscription-icon">🎁</div>
          <h3>Unlock Full Access</h3>
          <p>Upgrade to get AI feedback, detailed reviews, and more practice tests.</p>
          <router-link to="/subscription/plans" class="upgrade-now">View Plans</router-link>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card actions-card">
        <div class="card-header">
          <h2>Quick Actions</h2>
        </div>
        <div class="action-grid">
          <button @click="startPractice('listening')" class="action-btn">
            <span class="action-icon">🎧</span>
            <span>Listening</span>
          </button>
          <button @click="startPractice('reading')" class="action-btn">
            <span class="action-icon">📖</span>
            <span>Reading</span>
          </button>
          <button @click="startPractice('writing')" class="action-btn">
            <span class="action-icon">✍️</span>
            <span>Writing</span>
          </button>
          <button
            @click="startPractice('speaking')"
            class="action-btn"
            :disabled="!userStore.hasFeature('speaking_full')"
          >
            <span class="action-icon">🎤</span>
            <span>Speaking</span>
            <LockFeature v-if="!userStore.hasFeature('speaking_full')" feature="Speaking" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import BandScoreChart from '@/components/dashboard/BandScoreChart.vue'
import LockFeature from '@/components/common/LockFeature.vue'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const chartPeriod = ref<'week' | 'month' | 'all'>('week')
const showWeeklyChallenge = ref(true)

const subscriptionText = computed(() => {
  if (!userStore.subscriptionPlan) return 'Free Trial'
  const planNames = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium',
  }
  return planNames[userStore.subscriptionPlan] || 'Free'
})

const subscriptionClass = computed(() => {
  if (!userStore.subscriptionPlan) return 'trial'
  return userStore.subscriptionPlan
})

const recentExams = computed(() => {
  return userStore.examHistory.slice(0, 5)
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

const handleLogout = async () => {
  await authStore.logout('/practice/login')
}

const startPractice = (section?: string) => {
  const route = section ? `/practice/${section}` : '/practice/listening'
  router.push(route)
}

onMounted(async () => {
  await Promise.all([
    userStore.fetchDashboardStats(),
    userStore.fetchBandScores(),
    userStore.fetchExamHistory(),
  ])
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
}

.dashboard-header {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #059669;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecfdf5;
  color: #059669;
  font-size: 24px;
  font-weight: 600;
}

.user-info h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.subscription-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.subscription-badge.trial {
  background: #fef3c7;
  color: #92400e;
}

.subscription-badge.free {
  background: #f3f4f6;
  color: #374151;
}

.subscription-badge.basic {
  background: #dbeafe;
  color: #1e40af;
}

.subscription-badge.pro {
  background: #e0e7ff;
  color: #4338ca;
}

.subscription-badge.premium {
  background: #fae8ff;
  color: #86198f;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.upgrade-btn {
  padding: 10px 20px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.upgrade-btn:hover {
  background: #047857;
}

.logout-btn {
  padding: 10px 20px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.weekly-challenge {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  padding: 20px 32px;
}

.challenge-content {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.fire-icon {
  font-size: 32px;
}

.challenge-content strong {
  font-size: 18px;
  display: block;
  margin-bottom: 4px;
}

.challenge-content div {
  flex: 1;
  font-size: 14px;
  opacity: 0.95;
}

.challenge-btn {
  padding: 10px 24px;
  background: #fff;
  color: #ea580c;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s;
}

.challenge-btn:hover {
  transform: scale(1.05);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 40px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

.period-selector {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  cursor: pointer;
}

.chart-card {
  grid-column: span 8;
}

.chart-container {
  height: 300px;
}

.progress-card {
  grid-column: span 4;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.section-name {
  font-weight: 500;
  color: #374151;
}

.section-score {
  font-weight: 600;
  color: #059669;
}

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.listening {
  background: #3b82f6;
}

.progress-fill.reading {
  background: #10b981;
}

.progress-fill.writing {
  background: #f59e0b;
}

.progress-fill.speaking {
  background: #ef4444;
}

.history-card {
  grid-column: span 6;
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

.subscription-card {
  grid-column: span 6;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: none;
}

.subscription-content {
  text-align: center;
  padding: 20px;
}

.subscription-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.subscription-content h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #92400e;
}

.subscription-content p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #b45309;
  line-height: 1.5;
}

.upgrade-now {
  display: inline-block;
  padding: 10px 24px;
  background: #92400e;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.upgrade-now:hover {
  background: #78350f;
}

.actions-card {
  grid-column: span 12;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 32px;
}

@media (max-width: 1024px) {
  .chart-card {
    grid-column: span 12;
  }

  .progress-card {
    grid-column: span 12;
  }

  .history-card {
    grid-column: span 12;
  }

  .subscription-card {
    grid-column: span 12;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .upgrade-btn,
  .logout-btn {
    width: 100%;
  }

  .challenge-content {
    flex-direction: column;
    text-align: center;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
