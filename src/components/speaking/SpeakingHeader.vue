<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

defineProps<{
  partLabels: string[]
  activePartIndex: number
}>()

const authStore = useAuthStore()
const isLogoutModalOpen = ref(false)

const handleLogout = () => {
  isLogoutModalOpen.value = true
}

const confirmLogout = () => {
  isLogoutModalOpen.value = false
  authStore.logout()
}
</script>

<template>
  <header class="speaking-header">
    <div class="speaking-header__logo">
      <img src="@/assets/logo.png" alt="MockCenter" class="speaking-header__logo-img" />
      <span class="speaking-header__logo-text">MockCenter</span>
    </div>

    <nav class="speaking-header__tabs">
      <div
        v-for="(label, index) in partLabels"
        :key="label"
        class="speaking-header__tab"
        :class="{
          'speaking-header__tab--active': index === activePartIndex,
          'speaking-header__tab--done': index < activePartIndex,
          'speaking-header__tab--upcoming': index > activePartIndex,
        }"
      >
        <!-- Checkmark for completed parts -->
        <svg v-if="index < activePartIndex" class="speaking-header__check" width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
        </svg>
        <span v-else>{{ label }}</span>
      </div>
    </nav>

    <div class="speaking-header__right">
      <div class="speaking-header__brand">
        <span class="speaking-header__brand-multi">MULTI</span>
        <span class="speaking-header__brand-level">LEVEL</span>
      </div>
      <button class="speaking-header__logout" @click="handleLogout" title="Logout">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>

    <ConfirmModal
      :is-open="isLogoutModalOpen"
      title="Logout"
      message="Are you sure you want to logout?"
      confirm-text="Yes, logout"
      cancel-text="Cancel"
      type="danger"
      @confirm="confirmLogout"
      @cancel="isLogoutModalOpen = false"
    />
  </header>
</template>

<style scoped>
.speaking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.speaking-header__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}

.speaking-header__logo-img {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: contain;
}

.speaking-header__logo-text {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #333;
}

.speaking-header__tabs {
  display: flex;
  gap: 8px;
}

.speaking-header__tab {
  min-width: 84px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  border-radius: 12px;
  background: #F5E642;
  color: #1a1a1a;
  padding: 0 22px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.speaking-header__tab--active {
  background: #4CAF50;
  color: #fff;
  border-color: #3d9141;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.speaking-header__tab--done {
  background: #4CAF50;
  color: #fff;
  border-color: #3d9141;
}

.speaking-header__tab--upcoming {
  background: #F5E642;
  color: #1a1a1a;
}

.speaking-header__check {
  display: block;
}

.speaking-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 180px;
  justify-content: flex-end;
}

.speaking-header__brand {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 30px;
  font-weight: 800;
}

.speaking-header__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.speaking-header__logout:hover {
  background: #fef2f2;
  color: #dc2626;
}

.speaking-header__logout:active {
  transform: scale(0.95);
  background: #fee2e2;
}

.speaking-header__brand-multi {
  color: #1a1a1a;
}

.speaking-header__brand-level {
  background: #4CAF50;
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 24px;
}

@media (max-width: 768px) {
  .speaking-header {
    padding: 12px 16px;
  }

  .speaking-header__logo {
    min-width: auto;
  }

  .speaking-header__logo-img {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  .speaking-header__logo-text {
    font-size: 18px;
  }

  .speaking-header__tab {
    min-width: 48px;
    height: 44px;
    font-size: 22px;
    padding: 0 12px;
    border-radius: 8px;
  }

  .speaking-header__check {
    width: 22px;
    height: 22px;
  }

  .speaking-header__right {
    min-width: auto;
    gap: 8px;
  }

  .speaking-header__brand {
    font-size: 18px;
  }

  .speaking-header__brand-level {
    font-size: 14px;
    padding: 4px 8px;
  }

  .speaking-header__logout {
    width: 36px;
    height: 36px;
  }

  .speaking-header__logout svg {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .speaking-header {
    padding: 8px 12px;
    gap: 6px;
  }

  .speaking-header__logo-img {
    width: 24px;
    height: 24px;
  }

  .speaking-header__logo-text {
    font-size: 14px;
  }

  .speaking-header__tabs {
    gap: 4px;
  }

  .speaking-header__tab {
    min-width: 36px;
    height: 34px;
    font-size: 16px;
    padding: 0 8px;
    border-radius: 6px;
  }

  .speaking-header__check {
    width: 16px;
    height: 16px;
  }

  .speaking-header__brand {
    display: none;
  }

  .speaking-header__logout {
    width: 32px;
    height: 32px;
  }

  .speaking-header__logout svg {
    width: 18px;
    height: 18px;
  }
}
</style>
