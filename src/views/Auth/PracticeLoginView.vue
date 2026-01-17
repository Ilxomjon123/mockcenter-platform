<template>
  <div class="container">
    <div class="box">
      <div class="mode-selector">
        <button :class="{ active: mode === 'exam' }" @click="selectMode('exam')">Exam Mode</button>
        <button :class="{ active: mode === 'practice' }" @click="selectMode('practice')">
          Practice Mode
        </button>
      </div>

      <h2>Practice Login</h2>

      <transition name="fade">
        <div v-if="authStore.errorMessage" class="alert error">
          <span>{{ authStore.errorMessage }}</span>
          <button type="button" class="close-btn" @click="authStore.clearError" aria-label="Close">
            ×
          </button>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="successMessage" class="alert success">
          <span>{{ successMessage }}</span>
        </div>
      </transition>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            placeholder="your@email.com"
            required
            :disabled="authStore.isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              :disabled="authStore.isLoading"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :disabled="authStore.isLoading"
              aria-label="Toggle password visibility"
            >
              <svg
                v-if="!showPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                ></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading || !isFormValid"
          :class="{ loading: authStore.isLoading }"
        >
          <span v-if="authStore.isLoading">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="form-footer">
        <p>Don't have an account?</p>
        <router-link to="/subscription">Sign up</router-link>
      </div>

      <div class="practice-info">
        <p>✨ Practice Mode Features:</p>
        <ul>
          <li>Access your dashboard</li>
          <li>Review past answers</li>
          <li>Track your progress</li>
          <li>AI-powered feedback</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useModeStore } from '@/stores/modeStore'

const router = useRouter()
const authStore = useAuthStore()
const modeStore = useModeStore()

const email = ref('')
const password = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const mode = ref<'exam' | 'practice'>('practice')

const isFormValid = computed(() => {
  return email.value.length > 0 && password.value.length > 0
})

const selectMode = (selectedMode: 'exam' | 'practice') => {
  mode.value = selectedMode
  if (selectedMode === 'exam') {
    modeStore.setExamMode()
    router.push('/exam/login')
  } else {
    modeStore.setPracticeMode()
    router.push('/practice/login')
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  successMessage.value = ''

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    successMessage.value = 'Successfully logged in!'
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 48px;
  width: 600px;
  max-width: 90%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: #f3f4f6;
  padding: 6px;
  border-radius: 8px;
}

.mode-selector button {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.mode-selector button.active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #059669;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 48px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  border-radius: 4px;
}

.toggle-password:hover:not(:disabled) {
  color: #374151;
  background: #f3f4f6;
}

.toggle-password:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.toggle-password svg {
  display: block;
}

button[type='submit'] {
  width: 100%;
  padding: 12px 24px;
  margin-top: 24px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button[type='submit']:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

button[type='submit']:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

button[type='submit'].loading {
  background: #6b7280;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

.form-footer a {
  color: #059669;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.form-footer a:hover {
  text-decoration: underline;
}

.alert {
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alert.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.practice-info {
  margin-top: 24px;
  padding: 16px;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
}

.practice-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #047857;
}

.practice-info ul {
  margin: 0;
  padding-left: 20px;
}

.practice-info li {
  font-size: 13px;
  color: #059669;
  margin-bottom: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 640px) {
  .box {
    padding: 32px 24px;
  }

  h2 {
    font-size: 24px;
  }
}
</style>
