<template>
  <div class="practice-completed">
    <div class="content-card">
      <!-- Success Icon -->
      <div class="icon-container">
        <div class="success-bg">
          <svg class="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h1 class="title">Practice Test Completed!</h1>

      <div class="message-section">
        <div v-if="hasResults" class="results-container">
          <div class="result-card">
            <div class="result-header">Listening</div>
            <div class="result-body">
              <div class="score">{{ results.listening_score }}</div>
              <div class="details">{{ results.listening_count }} correct answers</div>
            </div>
          </div>
          <div class="result-card">
            <div class="result-header">Reading</div>
            <div class="result-body">
              <div class="score">{{ results.reading_score }}</div>
              <div class="details">{{ results.reading_count }} correct answers</div>
            </div>
          </div>
          <div class="result-card">
            <div class="result-header">Overall</div>
            <div class="result-body">
              <div class="score">{{ results.overall }}</div>
              <div class="details">Band Score</div>
            </div>
          </div>
        </div>

        <p v-if="speakingPending" class="writing-notice">
          Speaking results will be announced shortly after review.
        </p>

        <p class="writing-notice">
          Writing results will be announced shortly after AI review.
        </p>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <router-link v-if="hasResults" :to="`/practice/review/${examId}`" class="action-btn review">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Review Answers
        </router-link>

        <router-link to="/practice/dashboard" class="action-btn dashboard">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Back to Dashboard
        </router-link>

        <button v-if="userStore.hasFeature('certificate')" class="action-btn certificate" @click="handleDownloadCertificate">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Download Certificate
        </button>

        <button v-else class="action-btn certificate locked">
          <LockFeature feature="Certificate" plan="pro" />
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Download Certificate
        </button>
      </div>

      <!-- Share Result -->
      <div class="share-section">
        <p>Share your results:</p>
        <div class="share-buttons">
          <button class="share-btn" @click="handleShare('twitter')">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
            </svg>
            Twitter
          </button>
          <button class="share-btn" @click="handleShare('facebook')">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
            </svg>
            Facebook
          </button>
          <button class="share-btn" @click="handleShare('linkedin')">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"
              ></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
            LinkedIn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import LockFeature from '@/components/common/LockFeature.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const examId = ref(0)

const results = computed(() => ({
  listening_count: route.query.l_c || '0',
  reading_count: route.query.r_c || '0',
  listening_score: route.query.l_s || '0',
  reading_score: route.query.r_s || '0',
  overall: route.query.o || '0',
}))

const hasResults = computed(() => {
  return results.value.listening_score !== '0' || results.value.reading_score !== '0'
})

const speakingPending = computed(() => {
  return route.query.speaking === 'pending'
})

const handleDownloadCertificate = () => {
  // Implement certificate download
  alert('Certificate download would open here')
}

const handleShare = (platform: string) => {
  const text = `I just completed an IELTS practice test! Overall Band: ${results.value.overall}`
  const url = window.location.href

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  }

  window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400')
}
</script>

<style scoped>
.practice-completed {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 20px;
}

.content-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 700px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.success-bg {
  width: 80px;
  height: 80px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 8px #d1fae5;
}

.success-icon {
  width: 40px;
  height: 40px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 32px 0;
}

.message-section {
  margin-bottom: 0;
}

.results-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.result-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 12px;
  transition: transform 0.2s ease;
}

.result-card:hover {
  transform: translateY(-2px);
}

.result-header {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-body .score {
  font-size: 36px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.result-body .details {
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
}

.writing-notice {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 32px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #9ca3af;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  position: relative;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.action-btn.review {
  background: #059669;
  color: #fff;
}

.action-btn.review:hover {
  background: #047857;
}

.action-btn.dashboard {
  background: #fff;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.action-btn.dashboard:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.action-btn.certificate {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
}

.action-btn.certificate:hover {
  transform: scale(1.02);
}

.action-btn.certificate.locked {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.share-section {
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.share-section p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.share-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn svg {
  width: 18px;
  height: 18px;
}

.share-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

@media (max-width: 640px) {
  .content-card {
    padding: 32px 24px;
  }

  .title {
    font-size: 24px;
  }

  .results-container {
    grid-template-columns: 1fr;
  }
}
</style>
