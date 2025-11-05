<template>
  <div class="question-panel">
    <div class="questions-header">
      <h3 class="questions-title">Questions {{ questionsRange }}</h3>
      <p class="questions-instruction">{{ instruction }}</p>
    </div>

    <div class="questions-list">
      <div v-for="question in questions" :key="question.id" class="question-item">
        <div class="question-number">{{ question.id }}</div>
        <div class="question-content">
          <p class="question-text">{{ question.text }}</p>

          <!-- True/False/Not Given -->
          <div v-if="question.type === 'true-false-not-given'" class="options-group">
            <label v-for="option in question.options" :key="option" class="option-label">
              <input
                type="radio"
                :name="`question-${question.id}`"
                :value="option"
                :checked="answers[question.id] === option"
                @change="updateAnswer(question.id, option)"
              />
              <span>{{ option }}</span>
            </label>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="question.type === 'multiple-choice'" class="options-group">
            <label v-for="option in question.options" :key="option" class="option-label">
              <input
                type="radio"
                :name="`question-${question.id}`"
                :value="option"
                :checked="answers[question.id] === option"
                @change="updateAnswer(question.id, option)"
              />
              <span>{{ option }}</span>
            </label>
          </div>

          <!-- Fill in the Blank -->
          <div v-else-if="question.type === 'fill-blank'" class="fill-blank">
            <input
              type="text"
              class="blank-input"
              :value="answers[question.id] || ''"
              @input="updateAnswer(question.id, ($event.target as HTMLInputElement).value)"
              placeholder="Type your answer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Question } from '@/types/reading'

interface Props {
  questions: Question[]
  questionsRange: string
  instruction: string
  answers: Record<number, string | number>
}

interface Emits {
  (e: 'update-answer', questionId: number, answer: string | number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const updateAnswer = (questionId: number, answer: string | number) => {
  emit('update-answer', questionId, answer)
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

.questions-list {
  padding: 24px 32px;
  overflow-y: auto;
  flex: 1;
}

.question-item {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
}

.question-number {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
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
</style>
