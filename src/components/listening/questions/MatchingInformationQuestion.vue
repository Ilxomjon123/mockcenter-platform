<template>
  <div class="mi-container">
    <div v-if="question.title" class="mi-title" v-html="question.title"></div>

    <div class="mi-table-wrap">
      <table class="mi-table">
        <thead>
          <tr>
            <th class="mi-th-info">{{ infoHeader }}</th>
            <th
              v-for="opt in optionsArray"
              :key="opt.key"
              class="mi-th-letter"
            >
              {{ opt.value }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :data-question-number="row.questionNumber"
            :class="{ 'mi-row-current': currentRowId === row.id }"
          >
            <td class="mi-td-info">
              <span
                class="mi-row-number"
                :class="{ 'mi-row-number-current': currentRowId === row.id }"
              >{{ row.displayNumber }}</span>
              <span class="mi-row-text" v-html="row.title"></span>
            </td>
            <td
              v-for="opt in optionsArray"
              :key="opt.key"
              class="mi-td-cell"
              @click="selectAnswer(row, opt.key)"
            >
              <svg
                v-if="isSelected(row, opt.key)"
                class="mi-check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProcessedQuestion } from '@/types/test'
import { useListeningStore } from '@/stores/listeningStore'

const props = defineProps<{
  question: ProcessedQuestion
}>()

const listeningStore = useListeningStore()
const currentRowId = ref<number | null>(null)

const infoHeader = computed(() => props.question.options_title || 'Information')

const DEFAULT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const optionsArray = computed(() => {
  const options = props.question.options
  const fallback = DEFAULT_LETTERS.map((l) => ({ key: l, value: l }))

  if (!options) return fallback
  if (Array.isArray(options)) {
    if (options.length === 0) return fallback
    return options.map((opt) => ({ key: String(opt), value: String(opt) }))
  }
  if (typeof options === 'object') {
    const entries = Object.entries(options as Record<string, string>)
    if (entries.length === 0) return fallback
    return entries.map(([key, value]) => ({ key, value: String(value) }))
  }
  return fallback
})

const rows = computed(() => props.question.children ?? [])

const isSelected = (row: ProcessedQuestion, key: string): boolean => {
  const qNum = row.questionNumber
  if (qNum === undefined) return false
  return String(listeningStore.answers[qNum] ?? '') === key
}

const selectAnswer = (row: ProcessedQuestion, key: string): void => {
  const qNum = row.questionNumber
  if (qNum === undefined) return
  currentRowId.value = row.id
  listeningStore.updateAnswer(qNum, key)
}
</script>

<style scoped>
.mi-container {
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

@media (max-width: 640px) {
  .mi-container {
    padding: 16px;
  }
}

.mi-title {
  font-size: 14px;
  font-family: Arial, sans-serif;
  color: #374151;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.mi-table-wrap {
  overflow-x: auto;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.mi-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #374151;
}

@media (max-width: 640px) {
  .mi-table {
    font-size: 13px;
  }
}

.mi-table th,
.mi-table td {
  border: 1px solid #d1d5db;
  padding: 8px 10px;
  vertical-align: middle;
}

.mi-table thead th {
  background: #dbe6ff;
  font-weight: 700;
  text-align: center;
  color: #1f2937;
}

.mi-th-info {
  text-align: left !important;
  min-width: 320px;
}

.mi-th-letter {
  width: 56px;
}

.mi-td-info {
  background: #eef2ff;
  text-align: left;
  padding-left: 12px;
}

.mi-row-number {
  display: inline-block;
  min-width: 26px;
  padding: 2px 6px;
  margin-right: 10px;
  font-weight: 700;
  text-align: center;
  color: #1f2937;
}

.mi-row-number-current {
  border: 2px solid #1f2937;
  border-radius: 3px;
  padding: 0 6px;
}

.mi-row-text {
  display: inline;
}

.mi-row-text :deep(p) {
  display: inline;
  margin: 0;
  padding: 0;
}

.mi-td-cell {
  text-align: center;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #16a34a;
}

.mi-td-cell:hover {
  background: #f0f9ff;
}

.mi-check {
  width: 18px;
  height: 18px;
  vertical-align: middle;
}
</style>
