<template>
  <div class="heading-question-container">
    <!-- Group Task Instruction Card -->
    <div class="group-instruction-card">
      <div class="group-instruction-header">
        <span class="group-instruction-badge">{{ groupBadge }}</span>
      </div>
      <div class="group-instruction-body">
        <p class="instruction-main-text">{{ groupInstruction }}</p>
      </div>
    </div>

    <!-- List of Headings Card -->
    <div class="headings-panel-card">
      <div class="headings-panel-header">
        <div class="headings-panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span>{{ bankTitle }}</span>
        </div>
        <span class="headings-counter">{{ remainingCount }} of {{ parsedOptions.length }} available</span>
      </div>

      <div class="heading-cards-list">
        <div
          v-for="opt in parsedOptions"
          :key="opt.key"
          class="draggable-option heading-option-card"
          :class="{ used: isOptionUsed(opt.key) }"
          :data-option-key="opt.key"
          :data-option-value="opt.text || opt.letter"
          :data-option-display="matchOptionDisplay(opt)"
          :data-kind="kind"
        >
          <span class="heading-letter-pill">{{ opt.letter }}</span>
          <span class="heading-text-content">{{ opt.text }}</span>
          <div class="heading-card-actions">
            <span class="used-check" title="Heading placed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span class="drag-grip" title="Drag to paragraph">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/>
                <circle cx="15" cy="6" r="1.5"/>
                <circle cx="15" cy="12" r="1.5"/>
                <circle cx="15" cy="18" r="1.5"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import { useReadingStore } from '@/stores/readingStore'
import { matchOptionDisplay, normalizeMatchOptions, processQuestionText } from '@/utils/questionUtils'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const readingStore = useReadingStore()

// match_heading options belong to the 'heading' drop family ([heading_match]
// dropzones); classic heading-style matching stays in the 'match' family.
const kind = computed<'heading' | 'match'>(() =>
  props.question.type === QuestionType.MATCH_HEADING ? 'heading' : 'match',
)

// Array options keep the raw value as key (the backend compares values);
// object options use the object key.
const parsedOptions = computed(() => normalizeMatchOptions(props.question.options))

const bankTitle = computed(() => {
  const items = parsedOptions.value
  const label = kind.value === 'heading' ? 'List of Headings' : 'Options'
  if (!items.length) return label
  return `${label} (${items[0]!.letter}–${items[items.length - 1]!.letter})`
})

// Question numbers of this part's passage dropzones of the same kind. Only
// these answers can "use" an option: a letter answered elsewhere (e.g. Part 2
// matching A–J) must not disable a heading with the same letter.
const zoneNumbers = computed<number[]>(() => {
  const partOrder = readingStore.currentPart
  const part = readingStore.test?.parts?.find((p) => p.order === partOrder)
  const start = readingStore.partStats[partOrder]?.start
  if (!part?.content || start === undefined) return []
  return processQuestionText(part.content, start - 1)
    .tokens.filter((t) => t.kind === kind.value)
    .map((t) => t.number)
})

const groupBadge = computed(() => {
  const title = props.question.options_title || ''
  const firstLine = title.split('\n')[0]?.trim()
  if (firstLine) return firstLine
  const nums = zoneNumbers.value
  return nums.length ? `Questions ${nums[0]}–${nums[nums.length - 1]}` : 'Questions'
})

const groupInstruction = computed(() => {
  const title = props.question.options_title || ''
  const lines = title.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length > 1) {
    return lines.slice(1).join(' ')
  }
  return kind.value === 'heading'
    ? 'Read the text and choose the correct heading for each paragraph from the list of headings below.'
    : 'Choose the correct option for each question from the list below.'
})

const isOptionUsed = (key: string): boolean => {
  const targetKey = key.trim().toUpperCase()
  return zoneNumbers.value.some((n) => {
    const answer = readingStore.answers[n]
    return answer !== undefined && answer !== null && String(answer).trim().toUpperCase() === targetKey
  })
}

const remainingCount = computed(() => {
  const used = parsedOptions.value.filter((opt) => isOptionUsed(opt.key)).length
  return parsedOptions.value.length - used
})
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.heading-question-container {
  width: 100%;
  padding: 24px 28px;
  background: #ffffff;
}

@media (max-width: 640px) {
  .heading-question-container {
    padding: 16px;
  }
}

/* Group Instruction Card */
.group-instruction-card {
  margin-bottom: 18px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.group-instruction-header {
  margin-bottom: 4px;
}

.group-instruction-badge {
  display: inline-block;
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.instruction-main-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

/* Headings List Panel */
.headings-panel-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.headings-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.headings-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.headings-panel-title svg {
  color: #64748b;
}

.headings-counter {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.heading-cards-list {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Heading Option Card */
.heading-option-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  transition: all 0.15s ease;
}

.heading-option-card:hover:not(.used) {
  border-color: #94a3b8;
  background: #f8fafc;
}

.heading-option-card:active:not(.used) {
  cursor: grabbing;
}

.heading-option-card.selected-option {
  border-color: #2563eb !important;
  background: #f8fafc !important;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
}

.heading-option-card.used {
  /* keep used headings visible (struck through) – overrides global display:none */
  display: flex;
  opacity: 0.45;
  background: #f8fafc;
  border-color: #e2e8f0;
  cursor: not-allowed;
  box-shadow: none;
}

.heading-option-card.used .used-check {
  display: flex;
}

.heading-option-card.used .drag-grip {
  display: none;
}

.heading-letter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 4px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  font-weight: 700;
  font-size: 13px;
  border-radius: 4px;
  flex-shrink: 0;
}

.heading-option-card.used .heading-letter-pill {
  background: #e2e8f0;
  color: #94a3b8;
  border-color: #cbd5e1;
}

.heading-text-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.45;
  color: #334155;
}

.heading-option-card.used .heading-text-content {
  color: #94a3b8;
  text-decoration: line-through;
}

.heading-card-actions {
  display: flex;
  align-items: center;
  color: #94a3b8;
  flex-shrink: 0;
}

.used-check {
  display: none;
  color: #10b981;
}

.drag-grip {
  display: flex;
  color: #94a3b8;
}

.heading-option-card:hover .drag-grip {
  color: #475569;
}
</style>
