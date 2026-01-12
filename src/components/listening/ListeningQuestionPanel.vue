<template>
  <div class="question-panel">
    <div class="questions-header">
      <div class="header-left">
        <h3 class="questions-title">
          Questions {{ questionsRange }}
        </h3>
        <div class="questions-instruction" v-html="sanitizeHtml(instruction)"></div>
      </div>
      <div class="header-right">
        <label class="file-label">
          <input type="file" accept="audio/*" @change="onFileChange" />
          Load audio
        </label>
      </div>
    </div>

    <!-- Hidden audio element, auto-playing when source is available -->
    <audio ref="audioRef" :src="audioSrc" autoplay style="display: none"></audio>

    <div class="question-content">
      <div class="question-text" v-html="replaceGapsWithInputs(listeningStore.text)"></div>
    </div>

    <!-- Display all questions in current section -->
    <div
      v-for="question in currentQuestions"
      :key="question.id"
      class="question-content question-item"
    >
      <p class="question-text">
        <strong>{{ question.id }}.</strong> {{ question.text }}
      </p>

      <div v-if="question.type === 'multiple-choice'" class="options-group">
        <label v-for="option in question.options" :key="option" class="option-label">
          <input
            type="radio"
            :name="`question-${question.id}`"
            :value="option"
            :checked="listeningStore.answers[question.id] === option"
            @change="updateAnswer(question.id, option)"
          />
          <span>{{ option }}</span>
        </label>
      </div>

      <div v-else-if="question.type === 'true-false-not-given'" class="options-group">
        <label v-for="option in question.options" :key="option" class="option-label">
          <input
            type="radio"
            :name="`question-${question.id}`"
            :value="option"
            :checked="listeningStore.answers[question.id] === option"
            @change="updateAnswer(question.id, option)"
          />
          <span>{{ option }}</span>
        </label>
      </div>

      <div v-else-if="question.type === 'fill-blank'" class="fill-blank">
        <input
          type="text"
          class="blank-input"
          :value="listeningStore.answers[question.id] || ''"
          @input="updateAnswer(question.id, ($event.target as HTMLInputElement).value)"
          placeholder="Type ONE WORD AND/OR A NUMBER"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { createSafeGapHtml, sanitizeHtml } from '@/utils/sanitize'

const listeningStore = useListeningStore()

// Get current section data from store
const currentSectionData = computed(() => listeningStore.currentSectionData)

// Get all questions in current section
const currentQuestions = computed(() => currentSectionData.value?.questions || [])

// Get instruction from current section
const instruction = computed(() => currentSectionData.value?.instructions || '')

// Get questions range (e.g., "1-10")
const questionsRange = computed(() => {
  const questions = currentQuestions.value
  if (questions.length === 0) return ''
  const firstQ = questions[0]?.id
  const lastQ = questions[questions.length - 1]?.id
  return firstQ === lastQ ? `${firstQ}` : `${firstQ}-${lastQ}`
})

// Update answer directly to store
const updateAnswer = (questionId: number, answer: string | number) => {
  listeningStore.updateAnswer(questionId, answer)
}

// Hidden audio autoplay handling
const audioRef = ref<HTMLAudioElement | null>(null)
const audioSrc = ref<string>('')

// Load audio file
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  audioSrc.value = url
  // try play (autoplay attribute set as well)
  setTimeout(() => {
    audioRef.value?.play().catch(() => {})
  }, 0)
}

// Watch for section changes to restart audio
watch(
  () => listeningStore.currentSection,
  () => {
    // restart audio from beginning on section change
    if (audioRef.value) {
      audioRef.value.currentTime = 0
      audioRef.value.play().catch(() => {})
    }
    // Also set audio from section data if available
    const audioUrl = currentSectionData.value?.audioUrl
    if (audioUrl) {
      audioSrc.value = audioUrl
    }
  },
  { immediate: true },
)

const replaceGapsWithInputs = (htmlText: string): string => {
  // Use sanitized HTML to prevent XSS attacks
  return createSafeGapHtml(htmlText, 'gap-input')
}
</script>

<style scoped>
.question-panel {
  flex: 1;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.questions-header {
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.questions-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.questions-instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.file-label {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}

.file-label input[type='file'] {
  display: none;
}

.question-content {
  padding: 24px 32px;
  overflow-y: auto;
}

.question-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.option-label input[type='radio'] {
  cursor: pointer;
}

.fill-blank {
  margin-top: 8px;
}

.blank-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.blank-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.question-item {
  border-top: 1px solid #e5e5e5;
}

.question-item:first-child {
  border-top: none;
}
</style>
