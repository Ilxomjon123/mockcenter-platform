<template>
  <div class="gap-fill-sheet-wrapper">
    <div
      v-if="question.processedContent"
      class="question-content gap-fill-sheet"
      v-html="question.processedContent"
    ></div>
    <div v-else class="question-content gap-fill-sheet" v-html="question.content"></div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuestion } from '@/types/test'

defineProps<{
  question: ProcessedQuestion
}>()
</script>

<style src="./styles/shared.css"></style>
<style scoped>
.gap-fill-sheet-wrapper {
  width: 100%;
  display: block;
  padding: 0;
}

.gap-fill-sheet {
  width: 100%;
  max-width: 920px;
}
</style>
