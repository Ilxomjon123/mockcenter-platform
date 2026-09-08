import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

const STORAGE_KEY = 'mc_exam_locale'

export const getSavedLocale = (): 'uz' | 'en' | 'ru' => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'uz' || saved === 'ru') {
    return saved
  }
  return 'uz'
}

export const setSavedLocale = (locale: 'uz' | 'en' | 'ru') => {
  localStorage.setItem(STORAGE_KEY, locale)
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'uz',
  messages: {
    uz,
    en,
    ru,
  },
})

export default i18n
