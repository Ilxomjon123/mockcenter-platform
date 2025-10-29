<template>
  <footer class="exam-footer">
    <div class="footer-tabs">
      <button
        @click="emit('changePage', 1)"
        class="footer-tab"
        :class="{ active: currentPage === 1 }"
      >
        Part 1
      </button>
      <button
        @click="emit('changePage', 2)"
        class="footer-tab"
        :class="{ active: currentPage === 2 }"
      >
        Part 2
      </button>
    </div>

    <div class="footer-info">0 of 1</div>

    <div class="nav-buttons">
      <button v-if="currentPage === 2" @click="emit('changePage', 1)" class="nav-btn back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button v-if="currentPage === 1" @click="emit('changePage', 2)" class="nav-btn">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button v-else @click="emit('submit')" class="nav-btn">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
}

interface Emits {
  (e: 'changePage', page: number): void
  (e: 'submit'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.exam-footer {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.footer-tabs {
  display: flex;
  gap: 4px;
}

.footer-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.footer-tab:hover {
  background: #f3f4f6;
}

.footer-tab.active {
  color: #374151;
  background: #e5e7eb;
  font-weight: 500;
}

.footer-info {
  font-size: 14px;
  color: #9ca3af;
}

.nav-buttons {
  position: absolute;
  right: 24px;
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: #1f2937;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #111827;
}

.nav-btn.back {
  background: #4b5563;
}

.nav-btn.back:hover {
  background: #374151;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}
</style>
