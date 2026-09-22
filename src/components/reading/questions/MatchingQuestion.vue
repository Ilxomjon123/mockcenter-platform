<template>
  <!-- Single-answer question (CEFR "Text 7" / legacy "Paragraph I"): letter pills,
       plus a dropdown when the options carry descriptions. Stores the option key. -->
  <div v-if="isPicker" class="mq-modern" :data-question-number="qNum">
    <!-- List of Headings Reference Card (shown on first matching question in part) -->
    <div v-if="isFirstPickerWithDescriptions" class="mq-headings-reference">
      <div class="mq-headings-ref-header">
        <div class="mq-headings-ref-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span>{{ referenceTitle }}</span>
        </div>
      </div>
      <div class="mq-headings-ref-list">
        <div v-for="opt in options" :key="opt.key" class="mq-headings-ref-item">
          <span class="mq-ref-pill">{{ opt.letter }}</span>
          <span class="mq-ref-text">{{ opt.text || opt.letter }}</span>
        </div>
      </div>
    </div>

    <!-- Question order number and prompt (e.g. "1. Paragraph B") -->
    <div class="mq-prompt-header">
      <span class="question-number">{{ displayNumber }}.</span>
      <span v-if="promptTitle" class="mq-prompt-text" v-html="promptTitle"></span>
      <span v-if="promptContent" class="mq-prompt-text" v-html="promptContent"></span>
    </div>

    <div v-if="hasDescriptions" class="mq-dropdown-wrapper">
      <select class="mq-select" :value="currentAnswer" @change="onDropdownSelect">
        <option value="">-- Select --</option>
        <option v-for="opt in options" :key="opt.key" :value="opt.key">
          {{ opt.letter }}. {{ opt.text || opt.letter }}
        </option>
      </select>
    </div>

    <div class="mq-pills-row">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="mq-pill-btn"
        :class="{ active: isSelected(opt.key) }"
        :title="opt.text ? `${opt.letter}. ${opt.text}` : `Option ${opt.letter}`"
        @click="handleSelect(opt.key)"
      >
        {{ opt.letter }}
      </button>
    </div>

    <div v-if="hasDescriptions && selectedOption" class="selected-heading-badge">
      <span class="selected-pill">{{ selectedOption.letter }}</span>
      <span class="selected-text">{{ selectedOption.text }}</span>
    </div>
  </div>

  <!-- Statement-style matching (IELTS): draggable option cards + statements whose
       [match] dropzones live in the question content. -->
  <div v-else class="mq">
    <div v-if="options.length" class="mq-options">
      <div class="mq-cards">
        <span
          v-for="opt in options"
          :key="opt.key"
          class="draggable-option mq-card"
          :data-option-key="opt.key"
          :data-option-value="opt.text || opt.letter"
          data-kind="match"
        >
          <span class="mq-card-letter">{{ opt.letter }}</span>
          <span v-if="opt.text" class="mq-card-text">{{ opt.text }}</span>
        </span>
      </div>
    </div>

    <div
      v-if="question.processedContent"
      class="question-content mq-content"
      v-html="question.processedContent"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'
import { useReadingStore } from '@/stores/readingStore'
import { normalizeMatchOptions } from '@/utils/questionUtils'
import { sanitizeHtml } from '@/utils/sanitize'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const readingStore = useReadingStore()

const options = computed(() => normalizeMatchOptions(props.question.options))
const hasDescriptions = computed(() => options.value.some((o) => !!o.text))

// Picker mode only for a numbered question whose content has no answer
// element of its own (dropzone / gap input / dropdown).
const isPicker = computed(() => {
  if (!props.question.questionNumber) return false
  const html = props.question.processedContent || ''
  return !/match-dropzone|gap-input|dropdown-select/.test(html)
})

const qNum = computed(() => props.question.questionNumber as number)
const displayNumber = computed(() => props.question.displayNumber || props.question.questionNumber || qNum.value)

// QuestionItem hides its title for picker questions, so the prompt shows the title
// (without a repeated number / "Question N" placeholder) plus content that adds to it.
const plainText = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

const promptTitle = computed(() => {
  let t = (props.question.title || '').trim()
  const num = displayNumber.value
  if (num !== undefined && num !== null && num !== '') {
    const pattern = new RegExp(`^(?:(?:Question|Statement)\\s+${num}[.):\\-\\s\\u00a0]+|${num}[.):][\\s\\u00a0]+)`, 'i')
    while (pattern.test(t)) t = t.replace(pattern, '').trim()
  }
  if (!t || /^(?:Question|Statement)\s+\d+[.:]?$/i.test(t)) return ''
  return sanitizeHtml(t)
})

const promptContent = computed(() => {
  const c = (props.question.content || '').trim()
  if (!c) return ''
  const content = plainText(c)
  const title = plainText(promptTitle.value)
  if (!content || (title && title.includes(content))) return ''
  return sanitizeHtml(c)
})

// Options that are just paragraph names ("Paragraph A") need no reference list.
const isParagraphList = computed(() =>
  options.value.every((o) => !o.text || /^(?:paragraph|section)\s+[a-z]{1,2}$/i.test(o.text)),
)

const referenceTitle = computed(() =>
  options.value.every((o) => /^[ivxlcdm]+$/i.test(o.letter)) ? 'List of Headings' : 'List of Options',
)

// Show the reference list once per option set: on the first question (by order) of
// the current part that has the same options.
const isFirstPickerWithDescriptions = computed(() => {
  if (!hasDescriptions.value || isParagraphList.value) return false
  const part = readingStore.test?.parts?.find((p) => p.order === readingStore.currentPart)
  if (!part?.questions) return true
  const sameOptions = JSON.stringify(props.question.options)
  const first = [...part.questions]
    .sort((a, b) => a.order - b.order)
    .flatMap((q) => [q, ...[...(q.children ?? [])].sort((a, b) => a.order - b.order)])
    .find((q) => JSON.stringify(q.options) === sameOptions)
  return !first || first.id === props.question.id
})

const currentAnswer = computed(() => {
  const value = readingStore.answers[qNum.value]
  return value === undefined || value === null ? '' : String(value)
})

const isSelected = (key: string): boolean =>
  currentAnswer.value !== '' && currentAnswer.value.toUpperCase() === key.toUpperCase()

const selectedOption = computed(() => options.value.find((o) => isSelected(o.key)) ?? null)

const setAnswer = (key: string) => {
  if (key) {
    readingStore.updateAnswer(qNum.value, key)
  } else {
    delete readingStore.answers[qNum.value]
    readingStore.saveToStorage()
  }
}

const handleSelect = (key: string) => {
  setAnswer(isSelected(key) ? '' : key)
}

const onDropdownSelect = (e: Event) => {
  setAnswer((e.target as HTMLSelectElement).value)
}
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.mq {
  display: flex;
  flex-direction: column;
}

/* Options block */
.mq-options-title {
  font-size: 14px;
  font-family: Arial, sans-serif;
  font-weight: 700;
  color: #374151;
  margin-bottom: 10px;
}

.mq-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

/* Full-width boxed cards (overrides the inline default from shared.css) */
.mq-cards :deep(.mq-card) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  margin: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
}

.mq-card-letter {
  font-weight: 700;
  color: #1f2937;
  min-width: 14px;
}

.mq-card-text {
  color: #374151;
}

/* Statements + dropzones */
.mq-content :deep(p) {
  margin: 0 0 6px 0;
}

/* Each dropzone breaks onto its own full-width row */
.mq-content :deep(.match-dropzone) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 28px;
  height: auto;
  margin: 2px 0 4px;
  padding: 3px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

/* Hide the internal gap number; show a placeholder while empty */
.mq-content :deep(.match-dropzone .match-number) {
  display: none;
}

.mq-content :deep(.match-dropzone .match-value:empty)::before {
  content: 'Drop a card here';
  color: #9ca3af;
}

.mq-content :deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #3b82f6;
}

/* ---- Picker mode ---- */
.mq-modern {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.selected-heading-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 13.5px;
  color: #1e40af;
  margin-top: 2px;
}

.selected-pill {
  font-weight: 700;
  background: #2563eb;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.selected-text {
  font-weight: 500;
}

.mq-dropdown-wrapper {
  width: 100%;
  margin-bottom: 4px;
}

.mq-select {
  width: 100%;
  padding: 8px 12px;
  font-size: 14.5px;
  color: #1e293b;
  background-color: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  outline: none;
}

.mq-select:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.mq-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.mq-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  background-color: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.mq-pill-btn:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.mq-pill-btn.active {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

.mq-pill-btn:active {
  transform: translateY(0);
}

/* Headings Reference Card */
.mq-headings-reference {
  margin-bottom: 18px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.mq-headings-ref-header {
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mq-headings-ref-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mq-headings-ref-title svg {
  color: #64748b;
}

.mq-headings-ref-list {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mq-headings-ref-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #334155;
}

.mq-ref-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  font-weight: 700;
  font-size: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.mq-ref-text {
  flex: 1;
}

.mq-prompt-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.mq-prompt-header .question-number {
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  flex-shrink: 0;
}

.mq-prompt-text {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}
</style>
