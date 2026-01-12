<template>
  <footer class="exam-footer">
    <div class="footer-tabs">
      <button
        v-for="(partOrder, index) in partOrders"
        :key="partOrder"
        @click="emit('changePage', partOrder)"
        class="footer-tab"
        :class="{ active: currentPage === partOrder }"
      >
        Part {{ index + 1 }}
      </button>
    </div>

    <div class="footer-info">0 of {{ partOrders.length }}</div>

    <div class="nav-buttons">
      <button
        v-if="getPreviousPartOrder !== null"
        @click="emit('changePage', getPreviousPartOrder!)"
        class="nav-btn back"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        v-if="!isLastPart && getNextPartOrder !== null"
        @click="emit('changePage', getNextPartOrder!)"
        class="nav-btn"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button v-else-if="isLastPart" @click="emit('submit')" class="nav-btn">
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
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages?: number
  partOrders?: number[]
}

interface Emits {
  (e: 'changePage', page: number): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  totalPages: 2,
  partOrders: () => [],
})

const emit = defineEmits<Emits>()

// If partOrders is provided, use it; otherwise generate sequential numbers
const partOrders = computed(() => {
  if (props.partOrders.length > 0) {
    return props.partOrders
  }
  return Array.from({ length: props.totalPages }, (_, i) => i + 1)
})

// Get the index of current page in the partOrders array
const getCurrentIndex = computed(() => {
  return partOrders.value.indexOf(props.currentPage)
})

// Get previous part order
const getPreviousPartOrder = computed(() => {
  const currentIndex = getCurrentIndex.value
  if (currentIndex > 0) {
    return partOrders.value[currentIndex - 1]
  }
  return null
})

// Get next part order
const getNextPartOrder = computed(() => {
  const currentIndex = getCurrentIndex.value
  if (currentIndex >= 0 && currentIndex < partOrders.value.length - 1) {
    return partOrders.value[currentIndex + 1]
  }
  return null
})

// Check if current page is the last part
const isLastPart = computed(() => {
  return getCurrentIndex.value === partOrders.value.length - 1
})
</script>

<style scoped>
/* Same styles as before */
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
