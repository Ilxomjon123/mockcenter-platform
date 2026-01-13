<template>
  <div class="passage-panel" :style="{ width: `${width}%` }">
    <div class="passage-header">
      <span class="part-label">Part {{ part }}</span>
      <p class="instruction">Read the text and answer questions {{ questionsRange }}</p>
    </div>

    <div class="passage-content">
      <h2 class="passage-title">{{ passage?.title }}</h2>
      <div class="passage-text" v-html="passage?.content"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Passage } from '@/types/reading'

interface Props {
  part: number
  width: number
  passage?: Passage
  questionsRange: string
}

defineProps<Props>()
</script>

<style scoped>
.passage-panel {
  background: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.passage-header {
  background: #f5f5f5;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.part-label {
  font-weight: 600;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.passage-content {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.passage-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.passage-text {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-line;
}
</style>
