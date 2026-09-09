<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setSavedLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'

const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const isEnglishOnly = computed(() => {
  let currentExamType = (
    (route.query.exam_type as string) ||
    (route.params.type as string) ||
    authStore.examType ||
    localStorage.getItem('examType') ||
    ''
  ).toLowerCase()

  if (!currentExamType) {
    const rawToken = (route.query.token as string) || localStorage.getItem('token') || ''
    if (rawToken) {
      try {
        const parts = rawToken.split('.')
        const tokenPart = parts[1]
        if (tokenPart) {
          const payload = JSON.parse(atob(tokenPart.replace(/-/g, '+').replace(/_/g, '/')))
          if (payload?.exam_type) {
            currentExamType = String(payload.exam_type).toLowerCase()
          }
        }
      } catch (e) {
        // ignore decode errors
      }
    }
  }

  const path = (route.path || '').toLowerCase()
  if (
    path.includes('ielts') ||
    path.includes('cefr') ||
    path.includes('cerf') ||
    path.includes('sat')
  ) {
    return true
  }

  return ['ielts', 'cerf', 'cefr', 'sat'].includes(currentExamType)
})

const enforceEnglish = () => {
  if (isEnglishOnly.value && locale.value !== 'en') {
    locale.value = 'en'
    setSavedLocale('en')
  }
}

watch(isEnglishOnly, (isEnglish) => {
  if (isEnglish) {
    enforceEnglish()
  }
}, { immediate: true })

onMounted(() => {
  enforceEnglish()
})

const selectLocale = (target: 'uz' | 'ru' | 'en') => {
  if (isEnglishOnly.value) return
  if (locale.value === target) return
  locale.value = target
  setSavedLocale(target)
}
</script>

<template>
  <div
    v-if="!isEnglishOnly"
    class="lang-pill-group"
    role="group"
    aria-label="Language switcher"
  >
    <button
      type="button"
      class="lang-pill-btn"
      :class="{ 'lang-pill-btn--active': locale === 'uz' }"
      @click="selectLocale('uz')"
      aria-label="O'zbekcha"
    >
      <span class="lang-flag">🇺🇿</span>
      <span>UZ</span>
    </button>
    <button
      type="button"
      class="lang-pill-btn"
      :class="{ 'lang-pill-btn--active': locale === 'ru' }"
      @click="selectLocale('ru')"
      aria-label="Русский"
    >
      <span class="lang-flag">🇷🇺</span>
      <span>RU</span>
    </button>
    <button
      type="button"
      class="lang-pill-btn"
      :class="{ 'lang-pill-btn--active': locale === 'en' }"
      @click="selectLocale('en')"
      aria-label="English"
    >
      <span class="lang-flag">🇬🇧</span>
      <span>EN</span>
    </button>
  </div>
</template>

<style scoped>
.lang-pill-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: rgba(243, 244, 246, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 9999px;
  user-select: none;
  backdrop-filter: blur(8px);
}

.lang-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.lang-pill-btn:hover:not(.lang-pill-btn--active) {
  color: #111827;
  background: rgba(255, 255, 255, 0.5);
}

.lang-pill-btn--active {
  color: #1e40af;
  background: #ffffff;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.lang-flag {
  font-size: 11px;
  line-height: 1;
}

/* Dark or deep background contexts (CSCA, dark themes) */
:global(.csca-exam) .lang-pill-group,
:global(.csca-results) .lang-pill-group,
:global(.nav) .lang-pill-group {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(255, 255, 255, 0.12);
}

:global(.csca-exam) .lang-pill-btn,
:global(.csca-results) .lang-pill-btn,
:global(.nav) .lang-pill-btn {
  color: #94a3b8;
}

:global(.csca-exam) .lang-pill-btn:hover:not(.lang-pill-btn--active),
:global(.csca-results) .lang-pill-btn:hover:not(.lang-pill-btn--active),
:global(.nav) .lang-pill-btn:hover:not(.lang-pill-btn--active) {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.08);
}

:global(.csca-exam) .lang-pill-btn--active,
:global(.csca-results) .lang-pill-btn--active,
:global(.nav) .lang-pill-btn--active {
  color: #ffffff;
  background: #2563eb;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
}
</style>
