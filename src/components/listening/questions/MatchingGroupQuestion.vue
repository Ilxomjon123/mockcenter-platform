<template>
  <div class="matching-group-container">
    <div v-if="question.title" class="mg-instruction" v-html="question.title"></div>

    <div class="matching-layout">
      <!-- Left Column: Statements / Speakers with dropzones -->
      <div class="matching-statements-col">
        <div v-for="child in children" :key="child.id" class="matching-row">
          <div class="statement-label">
            <span v-if="child.displayNumber || child.questionNumber" class="statement-num">
              {{ child.displayNumber || child.questionNumber }}.
            </span>
            <span class="statement-text" v-html="cleanChildTitle(child.title, child.displayNumber || child.questionNumber)"></span>
          </div>
          <div class="statement-drop" v-html="child.processedContent"></div>
        </div>
      </div>

      <!-- Right Column: Options Bank (cards A to F), displayed ONCE -->
      <div class="matching-options-col">
        <div class="options-bank-card">
          <div class="options-bank-header">{{ optionsTitle }}</div>
          <div class="options-bank-list" :class="{ 'grid-layout': !hasOptionDescriptions }">
            <div
              v-for="opt in optionsList"
              :key="opt.key"
              class="draggable-option matching-option-item"
              :data-option-key="opt.key"
              :data-option-value="opt.text || opt.letter"
              :data-option-display="matchOptionDisplay(opt)"
              data-kind="match"
              data-reusable="true"
            >
              <span class="opt-badge">{{ opt.letter }}</span>
              <span v-if="opt.text" class="opt-desc">{{ opt.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedQuestion } from '@/types/test'
import { matchOptionDisplay, normalizeMatchOptions } from '@/utils/questionUtils'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const children = computed(() => props.question.children ?? [])

const optionsTitle = computed(() => props.question.options_title || 'Options')

const cleanChildTitle = (title: string | null | undefined, num: string | number | undefined): string => {
  if (!title) return ''
  let t = title.trim()
  if (num !== undefined && num !== null && num !== '') {
    const pattern = new RegExp(`^(?:(?:Question|Statement)\\s+${num}[.):\\-\\s\\u00a0]+|${num}[.):][\\s\\u00a0]+)`, 'i')
    while (pattern.test(t)) {
      t = t.replace(pattern, '').trim()
    }
  }
  if (/^(?:Question|Statement)\s+\d+[\.:]?$/i.test(t)) {
    return ''
  }
  return t
}

// Options live on the parent or (identically) on each child. The stored answer
// is always the option key: object key, or the raw value for array options.
const optionsList = computed(() => {
  const own = normalizeMatchOptions(props.question.options)
  if (own.length > 0) return own
  for (const child of children.value) {
    const fromChild = normalizeMatchOptions(child.options)
    if (fromChild.length > 0) return fromChild
  }
  return []
})

const hasOptionDescriptions = computed(() => optionsList.value.some((opt) => !!opt.text))
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.matching-group-container {
  padding: 20px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
}

.mg-instruction {
  font-size: 14.5px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  line-height: 1.5;
}

.matching-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.matching-statements-col {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.matching-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  gap: 12px;
}

.matching-row:hover {
  border-color: #cbd5e1;
}

.statement-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.statement-num {
  font-weight: 700;
  color: #0f172a;
}

.statement-drop {
  flex-shrink: 0;
}

.statement-drop :deep(.match-dropzone) {
  min-width: 80px;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.statement-drop :deep(.match-dropzone:hover) {
  border-color: #94a3b8;
}

.statement-drop :deep(.match-value) {
  display: inline-block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.statement-drop :deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #94a3b8;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
}

.matching-options-col {
  flex: 1;
  position: sticky;
  top: 16px;
}

.options-bank-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  box-shadow: none;
}

.options-bank-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.options-bank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.matching-option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13.5px;
  color: #1e293b;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s ease;
}

.matching-option-item:hover {
  border-color: #94a3b8;
}

.matching-option-item:active {
  cursor: grabbing;
}

.matching-option-item.used {
  /* Stays visible and draggable: one bank serves several questions and some
     tasks allow a letter more than once (overrides the global display:none) */
  display: flex;
  opacity: 0.5;
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #94a3b8;
  cursor: grab;
}

.options-bank-list.grid-layout .matching-option-item.used {
  display: flex;
}

.opt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #f1f5f9;
  color: #334155;
  font-weight: 600;
  font-size: 12.5px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
}

.opt-desc {
  flex: 1;
  line-height: 1.35;
}

.options-bank-list.grid-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.options-bank-list.grid-layout .matching-option-item {
  justify-content: center;
  padding: 7px 4px;
  font-weight: 600;
  font-size: 14px;
  min-height: 36px;
}

.options-bank-list.grid-layout .opt-badge {
  background: transparent;
  color: inherit;
  font-size: 14px;
  width: auto;
  height: auto;
  border: none;
}

/* Side-by-side Split Layout (Part 4 Map) */
:global(.media-split-right) .matching-group-container {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(.media-split-right) .mg-instruction {
  font-size: 13.5px;
  margin-bottom: 10px;
  color: #1e293b;
}

:global(.media-split-right) .matching-layout {
  gap: 16px;
}

:global(.media-split-right) .matching-statements-col {
  flex: 1.25;
  gap: 6px;
}

:global(.media-split-right) .matching-row {
  padding: 7px 10px;
  gap: 8px;
  min-height: 38px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

:global(.media-split-right) .statement-label {
  font-size: 13px;
}

:global(.media-split-right) .statement-drop :deep(.match-dropzone) {
  min-width: 64px;
  min-height: 30px;
  padding: 2px 8px;
  font-size: 13px;
}

:global(.media-split-right) .matching-options-col {
  flex: 1;
  position: static;
}

:global(.media-split-right) .options-bank-card {
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

:global(.media-split-right) .options-bank-header {
  font-size: 11px;
  margin-bottom: 6px;
  padding-bottom: 4px;
}

@media (max-width: 900px) {
  .matching-layout {
    flex-direction: column;
  }
  .matching-options-col {
    position: static;
    width: 100%;
  }
}
</style>
