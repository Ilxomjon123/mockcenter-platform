<template>
  <div class="completed-view">
    <div class="content-card">
      <!-- Success Icon -->
      <div class="icon-container">
        <div class="success-bg">
          <svg class="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h1 class="title">Test Successfully Submitted</h1>

      <div class="message-section">
        <div class="results-container">
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
        </div>

        <p class="writing-notice">
          Writing results will be announced shortly after review.
        </p>

        <div class="info-box">
          <h2 class="info-title">Speaking Exam Information:</h2>
          <p>Your Speaking exam will be conducted either <strong>offline</strong> at our center or via <strong>Zoom</strong>.</p>
          <p>Please check your dashboard or wait for an administrator to contact you regarding your speaking slot details.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const results = computed(() => ({
  listening_count: route.query.l_c || '0',
  reading_count: route.query.r_c || '0',
  listening_score: route.query.l_s || '0',
  reading_score: route.query.r_s || '0',
  overall: route.query.o || '0',
}))
</script>

<style scoped>
.completed-view {
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
  max-width: 600px;
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
  margin: 0 0 16px 0;
}

.message-section {
  margin-bottom: 0;
}

.results-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.info-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 24px;
  text-align: left;
}

.info-title {
  font-size: 18px;
  font-weight: 700;
  color: #0369a1;
  margin: 0 0 12px 0;
}

.info-box p {
  color: #334155;
  margin: 8px 0;
  line-height: 1.5;
}

.icon {
  width: 20px;
  height: 20px;
}
</style>
