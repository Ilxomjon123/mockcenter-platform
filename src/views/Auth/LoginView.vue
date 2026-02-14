<template>
  <div class="container">
    <!-- Tauri Desktop Close Button -->
    <button
      v-if="isTauri()"
      class="close-app-btn"
      @click="closeWindow"
      aria-label="Close application"
      title="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <div class="box">
      <h2>Login</h2>

      <transition name="fade">
        <div v-if="authStore.isPaymentError" class="alert payment-error">
          <div class="payment-error-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="payment-icon"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <div class="payment-error-text">
              <strong>{{ authStore.errorMessage }}</strong>
              <p v-if="authStore.errorDetails">{{ authStore.errorDetails }}</p>
            </div>
          </div>
          <button
            type="button"
            class="close-btn"
            @click="authStore.clearError"
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="authStore.errorMessage && !authStore.isPaymentError" class="alert error">
          <span>{{ authStore.errorMessage }}</span>
          <button
            type="button"
            class="close-btn"
            @click="authStore.clearError"
            aria-label="Close message"
          >
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
          <label for="number">Number</label>
          <input
            id="number"
            v-model.trim="number"
            type="text"
            placeholder="ABC123XYZ456"
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
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
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
          :disabled="authStore.isLoading || authStore.isLoadingTest || !isFormValid"
          :class="{ loading: authStore.isLoading || authStore.isLoadingTest }"
        >
          <span v-if="authStore.isLoading">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="authStore.isLoadingTest">
            <span class="spinner"></span>
            Loading test...
          </span>
          <span v-else>Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { invoke } from '@tauri-apps/api/core'
import { useTauri } from '@/composables/useTauri'

const number = ref('')
const password = ref('')
const successMessage = ref('')
const showPassword = ref(false)

const authStore = useAuthStore()
const { isTauri } = useTauri()

const isFormValid = computed(() => {
  return number.value.length > 0 && password.value.length > 0
})

const closeWindow = async () => {
  try {
    // Call the exit_app command from Rust
    await invoke('exit_app')
  } catch (error) {
    console.error('Failed to close window:', error)
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  successMessage.value = ''

  const result = await authStore.login(number.value, password.value)

  if (result.success) {
    successMessage.value = 'Successfully logged in!'
    // Router will automatically redirect
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
  position: relative;
}

/* Tauri Desktop Close Button */
.close-app-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1000;
  color: #6b7280;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-app-btn:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
  transform: scale(1.05);
}

.close-app-btn:active {
  transform: scale(0.95);
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

h2 {
  color: #dc2626;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
  background: #1f2937;
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
  background: #374151;
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

.alert {
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
}

.alert.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert.payment-error {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #f59e0b;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.payment-error-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.payment-icon {
  flex-shrink: 0;
  color: #d97706;
}

.payment-error-text {
  flex: 1;
}

.payment-error-text strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.payment-error-text p {
  margin: 0;
  font-size: 13px;
  color: #a16207;
  line-height: 1.4;
}

.alert.payment-error .close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
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

  .close-app-btn {
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
  }
}

/* =====================================================
   WHITE ON BLACK CONTRAST MODE
   ===================================================== */
:root.contrast-white-on-black .container {
  background: #000000;
}

:root.contrast-white-on-black .close-app-btn {
  background: #111111;
  border-color: #444444;
  color: #ffffff;
}

:root.contrast-white-on-black .close-app-btn:hover {
  background: #330000;
  border-color: #660000;
  color: #ff6666;
}

:root.contrast-white-on-black .box {
  background: #000000;
  border-color: #444444;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.05);
}

:root.contrast-white-on-black h2 {
  color: #ff6666;
}

:root.contrast-white-on-black label {
  color: #ffffff;
}

:root.contrast-white-on-black input {
  background: #111111;
  border-color: #444444;
  color: #ffffff;
}

:root.contrast-white-on-black input::placeholder {
  color: #888888;
}

:root.contrast-white-on-black input:focus {
  border-color: #ff6666;
  box-shadow: 0 0 0 3px rgba(255, 102, 102, 0.2);
}

:root.contrast-white-on-black input:disabled {
  background-color: #1a1a1a;
  opacity: 0.5;
}

:root.contrast-white-on-black .toggle-password {
  color: #888888;
}

:root.contrast-white-on-black .toggle-password:hover:not(:disabled) {
  color: #ffffff;
  background: #222222;
}

:root.contrast-white-on-black button[type='submit'] {
  background: #ffffff;
  color: #000000;
}

:root.contrast-white-on-black button[type='submit']:hover:not(:disabled) {
  background: #e5e5e5;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

:root.contrast-white-on-black button[type='submit']:disabled {
  background: #444444;
  color: #888888;
}

:root.contrast-white-on-black button[type='submit'].loading {
  background: #666666;
  color: #ffffff;
}

:root.contrast-white-on-black .alert.error {
  background: #330000;
  color: #ff9999;
  border-color: #660000;
}

:root.contrast-white-on-black .alert.payment-error {
  background: linear-gradient(135deg, #332200 0%, #443300 100%);
  color: #ffcc66;
  border-color: #996600;
}

:root.contrast-white-on-black .payment-icon {
  color: #ffaa00;
}

:root.contrast-white-on-black .payment-error-text p {
  color: #cc9933;
}

:root.contrast-white-on-black .alert.success {
  background: #003300;
  color: #99ff99;
  border-color: #006600;
}

:root.contrast-white-on-black .close-btn {
  color: inherit;
}

/* =====================================================
   YELLOW ON BLACK CONTRAST MODE
   ===================================================== */
:root.contrast-yellow-on-black .container {
  background: #000000;
}

:root.contrast-yellow-on-black .close-app-btn {
  background: #111100;
  border-color: #444400;
  color: #ffff00;
}

:root.contrast-yellow-on-black .close-app-btn:hover {
  background: #330000;
  border-color: #660000;
  color: #ff6666;
}

:root.contrast-yellow-on-black .box {
  background: #000000;
  border-color: #444400;
  box-shadow: 0 4px 20px rgba(255, 255, 0, 0.03);
}

:root.contrast-yellow-on-black h2 {
  color: #ff6666;
}

:root.contrast-yellow-on-black label {
  color: #ffff00;
}

:root.contrast-yellow-on-black input {
  background: #111100;
  border-color: #444400;
  color: #ffff00;
}

:root.contrast-yellow-on-black input::placeholder {
  color: #888800;
}

:root.contrast-yellow-on-black input:focus {
  border-color: #ffff00;
  box-shadow: 0 0 0 3px rgba(255, 255, 0, 0.15);
}

:root.contrast-yellow-on-black input:disabled {
  background-color: #0a0a00;
  opacity: 0.5;
}

:root.contrast-yellow-on-black .toggle-password {
  color: #888800;
}

:root.contrast-yellow-on-black .toggle-password:hover:not(:disabled) {
  color: #ffff00;
  background: #222200;
}

:root.contrast-yellow-on-black button[type='submit'] {
  background: #ffff00;
  color: #000000;
}

:root.contrast-yellow-on-black button[type='submit']:hover:not(:disabled) {
  background: #cccc00;
  box-shadow: 0 4px 12px rgba(255, 255, 0, 0.3);
}

:root.contrast-yellow-on-black button[type='submit']:disabled {
  background: #444400;
  color: #888800;
}

:root.contrast-yellow-on-black button[type='submit'].loading {
  background: #666600;
  color: #ffff00;
}

:root.contrast-yellow-on-black .alert.error {
  background: #330000;
  color: #ff9999;
  border-color: #660000;
}

:root.contrast-yellow-on-black .alert.payment-error {
  background: linear-gradient(135deg, #332200 0%, #443300 100%);
  color: #ffcc00;
  border-color: #996600;
}

:root.contrast-yellow-on-black .payment-icon {
  color: #ffaa00;
}

:root.contrast-yellow-on-black .payment-error-text p {
  color: #cc9900;
}

:root.contrast-yellow-on-black .alert.success {
  background: #003300;
  color: #99ff99;
  border-color: #006600;
}

:root.contrast-yellow-on-black .close-btn {
  color: inherit;
}
</style>
