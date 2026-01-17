<template>
  <div class="lock-feature" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
    <svg class="lock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15V17M12 9H12.01M5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 10V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V10"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <transition name="fade">
      <div v-if="showTooltip" class="tooltip">
        <div class="tooltip-content">
          <svg class="tooltip-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="#f59e0b"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="tooltip-text">
            <strong>{{ feature }} is locked</strong>
            <p>{{ tooltipText }}</p>
          </div>
        </div>
        <router-link to="/subscription/plans" class="upgrade-btn">
          Upgrade to Unlock
        </router-link>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  feature: string
  plan?: 'basic' | 'pro' | 'premium'
}

const props = withDefaults(defineProps<Props>(), {
  plan: 'pro',
})

const showTooltip = ref(false)

const tooltipText = computed(() => {
  const plans = {
    basic: 'Basic plan required',
    pro: 'Pro plan required',
    premium: 'Premium plan required',
  }
  return plans[props.plan]
})
</script>

<style scoped>
.lock-feature {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  z-index: 10;
}

.lock-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.tooltip {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.tooltip-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.tooltip-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.tooltip-text strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.tooltip-text p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.upgrade-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  transition: background 0.2s;
}

.upgrade-btn:hover {
  background: #047857;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
