<template>
  <div class="completed-view">
    <div class="content-card">
      <!-- Success Icon -->
      <div class="icon-container" style="background: transparent !important;">
        <div class="success-bg">
          <svg class="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: transparent !important;">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h1 class="title">Test Successfully Submitted</h1>

      <div class="message-section" style="background: transparent !important;">
        <div v-if="authStore.showSpeakingInfo" class="info-box">
          <h3 class="info-title">Speaking Exam Information:</h3>
          <p>Your Speaking exam is scheduled for <strong>{{ formattedSpeakingDate }}</strong>.</p>
          <p>The exam will be conducted either <strong>offline</strong> at our center or via <strong>Zoom</strong>.</p>
          <p>Please check your dashboard or wait for an administrator to contact you regarding your speaking slot details.</p>
        </div>

        <button class="back-to-login-btn" @click="goToLogin">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Back to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const formattedSpeakingDate = computed(() => {
  if (!authStore.speakingDatetime) return ''
  const date = new Date(authStore.speakingDatetime)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const goToLogin = () => {
  authStore.logout()
}
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

.back-to-login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 32px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

.back-to-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.back-to-login-btn:active {
  transform: translateY(0);
}

.back-to-login-btn .btn-icon {
  width: 20px;
  height: 20px;
}
</style>

<style>
/* =====================================================
   CONTRAST MODE STYLES FOR COMPLETED VIEW
   ===================================================== */

/* White on Black */
:root.contrast-white-on-black .completed-view {
  background: #000000 !important;
}

:root.contrast-white-on-black .completed-view .content-card {
  background: #0a0a0a !important;
  border: 2px solid #3b82f6 !important;
}

:root.contrast-white-on-black .completed-view .icon-container,
:root.contrast-white-on-black .completed-view .success-bg,
:root.contrast-white-on-black .completed-view .success-icon,
:root.contrast-white-on-black .completed-view .message-section {
  background: transparent !important;
  background-color: transparent !important;
}

:root.contrast-white-on-black .completed-view .success-bg {
  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2) !important;
}

:root.contrast-white-on-black .completed-view .title {
  color: #ffffff !important;
}

:root.contrast-white-on-black .completed-view .info-box {
  background: #0a1628 !important;
  border-color: #1e4b8f !important;
}

:root.contrast-white-on-black .completed-view .info-title {
  color: #60a5fa !important;
}

:root.contrast-white-on-black .completed-view .info-box p {
  color: #cccccc !important;
}

/* Yellow on Black */
:root.contrast-yellow-on-black .completed-view {
  background: #000000 !important;
}

:root.contrast-yellow-on-black .completed-view .content-card {
  background: #0a0a00 !important;
  border: 2px solid #888800 !important;
}

:root.contrast-yellow-on-black .completed-view .icon-container,
:root.contrast-yellow-on-black .completed-view .success-bg,
:root.contrast-yellow-on-black .completed-view .success-icon,
:root.contrast-yellow-on-black .completed-view .message-section {
  background: transparent !important;
  background-color: transparent !important;
}

:root.contrast-yellow-on-black .completed-view .success-bg {
  background: #669900 !important;
  box-shadow: 0 0 0 8px rgba(102, 153, 0, 0.2) !important;
}

:root.contrast-yellow-on-black .completed-view .title {
  color: #ffff00 !important;
}

:root.contrast-yellow-on-black .completed-view .info-box {
  background: #0a1600 !important;
  border-color: #445500 !important;
}

:root.contrast-yellow-on-black .completed-view .info-title {
  color: #aaff00 !important;
}

:root.contrast-yellow-on-black .completed-view .info-box p {
  color: #cccc00 !important;
}
</style>
