<template>
  <header class="exam-header">
    <div class="header-left">
      <div class="logo">IELTS</div>
      <div class="test-id">Test taker ID</div>
    </div>
    <div class="header-right">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <button class="logout-btn" @click="handleLogout" title="Chiqish">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const handleLogout = () => {
  if (confirm('Rostdan ham chiqmoqchimisiz?')) {
    authStore.logout()
  }
}
</script>

<style scoped>
.exam-header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  color: #dc2626;
  font-size: 24px;
  font-weight: bold;
}

.test-id {
  color: #4b5563;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 16px;
}

.icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  cursor: pointer;
}

.icon:hover {
  color: #374151;
}

.logout-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 4px;
  padding: 4px;
}

.logout-btn:hover {
  background: #fee2e2;
}

.logout-btn:hover .icon {
  color: #dc2626;
}

.logout-btn:active {
  transform: scale(0.95);
}
</style>
