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
      <!-- Token auto-login loading state -->
      <div v-if="isTokenLogin" class="token-login-loading">
        <span class="spinner"></span>
        <p>Logging in...</p>
      </div>

      <template v-else>
      <h2>Login</h2>

      <!-- QR Code for website scanning -->
      <div v-if="qrCodeDataUrl" class="qr-display">
        <div class="qr-display-image">
          <img :src="qrCodeDataUrl" alt="Login QR Code" />
        </div>
        <p class="qr-display-hint">Scan from your cabinet to login instantly</p>
      </div>
      <div v-else-if="isQrSessionLoading" class="qr-display">
        <div class="qr-display-loading">
          <span class="spinner"></span>
        </div>
      </div>

      <!-- Divider between QR and form -->
      <div v-if="qrCodeDataUrl || isQrSessionLoading" class="qr-divider">
        <span>or enter manually</span>
      </div>

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

      <!-- QR Scanner divider -->
      <div class="qr-divider">
        <span>or</span>
      </div>

      <!-- Scan QR Code button -->
      <button
        type="button"
        class="qr-scan-btn"
        @click="openScanner"
        :disabled="authStore.isLoading"
      >
        <svg
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
          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <rect x="7" y="7" width="10" height="10" rx="1"></rect>
        </svg>
        Scan QR Code
      </button>
      </template>
    </div>

    <!-- QR Scanner Overlay -->
    <transition name="scanner-fade">
      <div v-if="showScanner" class="scanner-overlay">
        <!-- Header -->
        <div class="scanner-header">
          <button class="scanner-close-btn" @click="closeScanner">
            <svg
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h3>Scan QR Code</h3>
          <div style="width: 36px"></div>
        </div>

        <!-- Scanner body -->
        <div class="scanner-body">
          <!-- QR logging state -->
          <div v-if="isQrLogging" class="scanner-logging">
            <span class="spinner spinner-dark"></span>
            <p>Logging in...</p>
          </div>

          <!-- Error state -->
          <div v-else-if="scannerError" class="scanner-error-state">
            <p>{{ scannerError }}</p>
            <button class="scanner-retry-btn" @click="closeScanner(); openScanner()">
              Try Again
            </button>
          </div>

          <!-- Scanner view -->
          <template v-else>
            <div id="qr-reader" class="qr-reader-container"></div>

            <!-- Warning message -->
            <transition name="fade">
              <div v-if="scannerWarning" class="scanner-warning">
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {{ scannerWarning }}
              </div>
            </transition>
          </template>
        </div>

        <!-- Footer instruction -->
        <div class="scanner-footer">
          <p>Point your camera at the QR code from your exam credentials</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/composables/useApi'
import { invoke } from '@tauri-apps/api/core'
import { useTauri } from '@/composables/useTauri'

const number = ref('')
const password = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const isTokenLogin = ref(false)

// QR Scanner state
const showScanner = ref(false)
const scannerInstance = ref<any>(null)
const scannerError = ref('')
const scannerWarning = ref('')
const isQrLogging = ref(false)

// QR Code display state (reverse flow)
const qrSessionId = ref('')
const qrCodeDataUrl = ref('')
const isQrSessionLoading = ref(false)
const qrPollingTimer = ref<ReturnType<typeof setInterval> | null>(null)
const qrRefreshTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const QR_SESSION_TTL = 4.5 * 60 * 1000 // Refresh 30s before 5min backend expiry

const route = useRoute()
const authStore = useAuthStore()
const { isTauri } = useTauri()
const { get, post } = useApi()

onMounted(async () => {
  const tokenParam = route.query.token as string
  const examTypeParam = route.query.exam_type as string
  const nameParam = route.query.name as string
  if (tokenParam) {
    isTokenLogin.value = true
    await authStore.loginWithToken(tokenParam, examTypeParam, nameParam)
    isTokenLogin.value = false
  } else {
    await createQrSession()
  }
})

onUnmounted(() => {
  stopScanner()
  stopQrPolling()
  if (qrRefreshTimer.value) {
    clearTimeout(qrRefreshTimer.value)
    qrRefreshTimer.value = null
  }
})

const isFormValid = computed(() => {
  return number.value.length > 0 && password.value.length > 0
})

const closeWindow = async () => {
  try {
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
  }
}

// QR Scanner functions
const openScanner = async () => {
  showScanner.value = true
  scannerError.value = ''
  scannerWarning.value = ''

  // Wait for DOM to render
  await new Promise((resolve) => setTimeout(resolve, 100))

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    scannerInstance.value = new Html5Qrcode('qr-reader')

    await scannerInstance.value.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDimension = Math.min(viewfinderWidth, viewfinderHeight)
          const size = Math.floor(minDimension * 0.8)
          return { width: size, height: size }
        },
        disableFlip: false,
      },
      onScanSuccess,
      () => {},
    )
  } catch (err: any) {
    console.error('Scanner error:', err)
    if (err?.message?.includes('Permission') || err?.toString?.().includes('Permission')) {
      scannerError.value = 'Camera permission denied. Please allow camera access.'
    } else {
      scannerError.value = 'Failed to start camera: ' + (err?.message || err)
    }
  }
}

const stopScanner = async () => {
  if (scannerInstance.value) {
    try {
      await scannerInstance.value.stop()
      scannerInstance.value.clear()
    } catch {
      // ignore
    }
    scannerInstance.value = null
  }
}

const closeScanner = async () => {
  await stopScanner()
  showScanner.value = false
  scannerWarning.value = ''
  scannerError.value = ''
}

const parseQrCode = (text: string): { number: string; key: string } | null => {
  if (!text.startsWith('mockcenter:')) return null
  const parts = text.split(':')
  if (parts.length !== 3) return null
  const [, num, key] = parts
  if (!num || !key) return null
  return { number: num, key }
}

const onScanSuccess = async (decodedText: string) => {
  if (isQrLogging.value) return

  const credentials = parseQrCode(decodedText)

  if (!credentials) {
    scannerWarning.value = 'Invalid QR code. Please scan a valid exam login QR code.'
    setTimeout(() => {
      scannerWarning.value = ''
    }, 3000)
    return
  }

  // Valid QR - auto login
  isQrLogging.value = true
  scannerWarning.value = ''
  await stopScanner()

  number.value = credentials.number
  password.value = credentials.key

  const result = await authStore.login(credentials.number, credentials.key)

  if (result.success) {
    showScanner.value = false
    successMessage.value = 'Successfully logged in!'
  } else {
    isQrLogging.value = false
    showScanner.value = false
  }
}

// QR Code display functions (reverse flow - exam shows QR, website scans)
const createQrSession = async () => {
  isQrSessionLoading.value = true
  stopQrPolling()
  if (qrRefreshTimer.value) {
    clearTimeout(qrRefreshTimer.value)
    qrRefreshTimer.value = null
  }

  try {
    const response = await post<{ session_id: string }>('/api/exam/qr-session')
    if (response?.session_id) {
      qrSessionId.value = response.session_id
      const qrData = `mockcenter-session:${response.session_id}`
      const QRCode = (await import('qrcode')).default
      qrCodeDataUrl.value = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      startQrPolling()

      // Auto-refresh before expiry
      qrRefreshTimer.value = setTimeout(() => {
        if (!authStore.isAuthenticated) {
          createQrSession()
        }
      }, QR_SESSION_TTL)
    }
  } catch (err) {
    console.error('Failed to create QR session:', err)
  } finally {
    isQrSessionLoading.value = false
  }
}

const startQrPolling = () => {
  stopQrPolling()
  qrPollingTimer.value = setInterval(pollQrSession, 3000)
}

const stopQrPolling = () => {
  if (qrPollingTimer.value) {
    clearInterval(qrPollingTimer.value)
    qrPollingTimer.value = null
  }
}

const pollQrSession = async () => {
  if (!qrSessionId.value || authStore.isLoading) return

  try {
    const response = await get<{ status: string; data?: any }>(
      `/api/exam/qr-session/${qrSessionId.value}`,
    )

    if (response?.status === 'authenticated' && response.data) {
      stopQrPolling()
      // Auto-login with the received token
      await authStore.loginWithToken(response.data.access_token)
    } else if (response?.status === 'expired') {
      stopQrPolling()
      // Session expired, create a new one
      await createQrSession()
    }
  } catch {
    // Session expired (410) or network error - create new session
    stopQrPolling()
    await createQrSession()
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

.token-login-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 16px;
}

.token-login-loading p {
  color: #374151;
  font-size: 16px;
  margin: 0;
}

/* QR Code Display (reverse flow) */
.qr-display {
  text-align: center;
  margin-bottom: 0;
}

.qr-display-image {
  display: inline-block;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.qr-display-image img {
  width: 180px;
  height: 180px;
  display: block;
}

.qr-display-hint {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.qr-display-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

/* QR Scanner Button & Divider */
.qr-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 13px;
}

.qr-divider::before,
.qr-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.qr-scan-btn {
  width: 100%;
  padding: 12px 24px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qr-scan-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.qr-scan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scanner Overlay */
.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.scanner-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.scanner-close-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.scanner-close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.scanner-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #000;
  overflow: hidden;
}

.scanner-logging {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #fff;
}

.scanner-logging p {
  margin: 0;
  font-size: 16px;
}

.spinner-dark {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
}

.scanner-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
}

.scanner-error-state p {
  color: #ef4444;
  font-size: 14px;
  margin: 0;
}

.scanner-retry-btn {
  padding: 10px 24px;
  background: #1f2937;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.scanner-retry-btn:hover {
  background: #374151;
}

.scanner-warning {
  position: absolute;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.scanner-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.scanner-footer p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.scanner-fade-enter-active {
  transition: opacity 0.2s ease;
}

.scanner-fade-leave-active {
  transition: opacity 0.15s ease;
}

.scanner-fade-enter-from,
.scanner-fade-leave-to {
  opacity: 0;
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

:root.contrast-white-on-black .qr-display-image {
  background: #ffffff;
  border-color: #444444;
}

:root.contrast-white-on-black .qr-display-hint {
  color: #cccccc;
}

:root.contrast-white-on-black .qr-display-loading {
  border-color: #444444;
}

:root.contrast-white-on-black .qr-divider {
  color: #888888;
}

:root.contrast-white-on-black .qr-divider::before,
:root.contrast-white-on-black .qr-divider::after {
  background: #444444;
}

:root.contrast-white-on-black .qr-scan-btn {
  background: #111111;
  color: #ffffff;
  border-color: #444444;
}

:root.contrast-white-on-black .qr-scan-btn:hover:not(:disabled) {
  background: #222222;
  border-color: #666666;
}

:root.contrast-white-on-black .scanner-overlay {
  background: #000000;
}

:root.contrast-white-on-black .scanner-header {
  border-color: #444444;
}

:root.contrast-white-on-black .scanner-header h3 {
  color: #ffffff;
}

:root.contrast-white-on-black .scanner-close-btn {
  border-color: #444444;
  color: #ffffff;
}

:root.contrast-white-on-black .scanner-close-btn:hover {
  background: #222222;
}

:root.contrast-white-on-black .scanner-footer {
  border-color: #444444;
}

:root.contrast-white-on-black .scanner-footer p {
  color: #cccccc;
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

:root.contrast-yellow-on-black .qr-display-image {
  background: #ffffff;
  border-color: #444400;
}

:root.contrast-yellow-on-black .qr-display-hint {
  color: #cccc00;
}

:root.contrast-yellow-on-black .qr-display-loading {
  border-color: #444400;
}

:root.contrast-yellow-on-black .qr-divider {
  color: #888800;
}

:root.contrast-yellow-on-black .qr-divider::before,
:root.contrast-yellow-on-black .qr-divider::after {
  background: #444400;
}

:root.contrast-yellow-on-black .qr-scan-btn {
  background: #111100;
  color: #ffff00;
  border-color: #444400;
}

:root.contrast-yellow-on-black .qr-scan-btn:hover:not(:disabled) {
  background: #222200;
  border-color: #666600;
}

:root.contrast-yellow-on-black .scanner-overlay {
  background: #000000;
}

:root.contrast-yellow-on-black .scanner-header {
  border-color: #444400;
}

:root.contrast-yellow-on-black .scanner-header h3 {
  color: #ffff00;
}

:root.contrast-yellow-on-black .scanner-close-btn {
  border-color: #444400;
  color: #ffff00;
}

:root.contrast-yellow-on-black .scanner-close-btn:hover {
  background: #222200;
}

:root.contrast-yellow-on-black .scanner-footer {
  border-color: #444400;
}

:root.contrast-yellow-on-black .scanner-footer p {
  color: #cccc00;
}
</style>

<style>
/* html5-qrcode overrides (must be unscoped) */
.qr-reader-container {
  width: 100% !important;
  height: 100% !important;
}

#qr-reader {
  border: none !important;
  width: 100% !important;
  height: 100% !important;
}

#qr-reader video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

#qr-reader__dashboard {
  display: none !important;
}

#qr-reader__scan_region > br,
#qr-reader__scan_region > img {
  display: none !important;
}
</style>
