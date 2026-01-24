<template>
  <Teleport to="body">
    <div v-if="isOpen" class="options-overlay" @click.self="close">
      <div class="options-modal">
        <!-- Header -->
        <div class="modal-header">
          <button v-if="currentView !== 'main'" class="back-btn" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Options</span>
          </button>
          <h2 class="modal-title">{{ viewTitle }}</h2>
          <button class="close-btn" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Main Options View -->
        <div v-if="currentView === 'main'" class="options-content">
          <button class="submission-btn" @click="goToSubmission">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Go to submission page</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div class="options-list">
            <button class="option-item" @click="currentView = 'contrast'">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"
                />
              </svg>
              <span>Contrast</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button class="option-item" @click="currentView = 'textSize'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"
                />
              </svg>
              <span>Text size</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contrast Options View -->
        <div v-else-if="currentView === 'contrast'" class="options-content">
          <div class="options-list">
            <button
              v-for="option in contrastOptions"
              :key="option.value"
              class="option-item selectable"
              :class="{ selected: settingsStore.contrast === option.value }"
              @click="selectContrast(option.value)"
            >
              <svg
                v-if="settingsStore.contrast === option.value"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              <span :class="{ 'with-icon': settingsStore.contrast === option.value }">{{
                option.label
              }}</span>
            </button>
          </div>
        </div>

        <!-- Text Size Options View -->
        <div v-else-if="currentView === 'textSize'" class="options-content">
          <div class="options-list">
            <button
              v-for="option in textSizeOptions"
              :key="option.value"
              class="option-item selectable"
              :class="{ selected: settingsStore.textSize === option.value }"
              @click="selectTextSize(option.value)"
            >
              <svg
                v-if="settingsStore.textSize === option.value"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              <span :class="{ 'with-icon': settingsStore.textSize === option.value }">{{
                option.label
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore, type ContrastMode, type TextSize } from '@/stores/settingsStore'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const settingsStore = useSettingsStore()

type ViewType = 'main' | 'contrast' | 'textSize'
const currentView = ref<ViewType>('main')

const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'contrast':
      return 'Contrast'
    case 'textSize':
      return 'Text size'
    default:
      return 'Options'
  }
})

const contrastOptions = [
  { value: 'black-on-white' as ContrastMode, label: 'Black on white' },
  { value: 'white-on-black' as ContrastMode, label: 'White on black' },
  { value: 'yellow-on-black' as ContrastMode, label: 'Yellow on black' },
]

const textSizeOptions = [
  { value: 'regular' as TextSize, label: 'Regular' },
  { value: 'large' as TextSize, label: 'Large' },
  { value: 'extra-large' as TextSize, label: 'Extra Large' },
]

const close = () => {
  currentView.value = 'main'
  emit('close')
}

const goBack = () => {
  currentView.value = 'main'
}

const goToSubmission = () => {
  close()
  router.push('/submission')
}

const selectContrast = (value: ContrastMode) => {
  settingsStore.setContrast(value)
}

const selectTextSize = (value: TextSize) => {
  settingsStore.setTextSize(value)
}
</script>

<style scoped>
.options-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.options-modal {
  background: white;
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
  position: relative;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.back-btn {
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn:hover {
  background: #eff6ff;
}

.back-btn:active {
  transform: scale(0.97);
}

.close-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn svg {
  width: 22px;
  height: 22px;
  color: #64748b;
}

.close-btn:hover {
  background: #f1f5f9;
}

.close-btn:hover svg {
  color: #334155;
}

.close-btn:active {
  transform: scale(0.95);
}

.options-content {
  padding: 20px;
}

.submission-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
}

.submission-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
}

.submission-btn:active {
  transform: translateY(0);
}

.submission-btn svg {
  width: 20px;
  height: 20px;
}

.submission-btn .arrow-icon {
  margin-left: auto;
  opacity: 0.8;
}

.options-list {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.option-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: white;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  text-align: left;
  transition: all 0.15s ease;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:hover {
  background: #f8fafc;
}

.option-item:active {
  background: #f1f5f9;
}

.option-item svg {
  width: 20px;
  height: 20px;
  color: #64748b;
  flex-shrink: 0;
}

.option-item .arrow-icon {
  margin-left: auto;
  color: #cbd5e1;
  transition: transform 0.2s ease;
}

.option-item:hover .arrow-icon {
  transform: translateX(2px);
  color: #94a3b8;
}

.option-item.selectable svg {
  color: #10b981;
}

.option-item.selectable span.with-icon {
  margin-left: 0;
}

.option-item.selectable span:not(.with-icon) {
  margin-left: 34px;
}

.option-item.selected {
  background: #f0fdf4;
}

.option-item.selected:hover {
  background: #ecfdf5;
}
</style>
