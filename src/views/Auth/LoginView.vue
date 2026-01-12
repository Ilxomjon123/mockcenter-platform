<template>
  <div class="container">
    <div class="box">
      <h2>Kirish</h2>

      <transition name="fade">
        <div v-if="authStore.errorMessage" class="alert error">
          <span>{{ authStore.errorMessage }}</span>
          <button
            type="button"
            class="close-btn"
            @click="authStore.clearError"
            aria-label="Xabarni yopish"
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
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            placeholder="email@example.com"
            required
            :disabled="authStore.isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Parol</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="authStore.isLoading"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading || !isFormValid"
          :class="{ loading: authStore.isLoading }"
        >
          <span v-if="authStore.isLoading">
            <span class="spinner"></span>
            Yuklanmoqda...
          </span>
          <span v-else>Kirish</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const email = ref('')
const password = ref('')
const successMessage = ref('')

const authStore = useAuthStore()

const isFormValid = computed(() => {
  return email.value.length > 0 && password.value.length > 0
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  successMessage.value = ''

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    successMessage.value = 'Muvaffaqiyatli kirdingiz!'
    // Router avtomatik redirect qiladi
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
