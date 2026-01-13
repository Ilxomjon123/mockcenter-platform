<template>
  <div
    v-if="question.processedContent"
    class="question-content"
    v-html="question.processedContent"
  ></div>
  <div v-else class="question-content" v-html="question.content"></div>
</template>

<script setup lang="ts">
import type { ProcessedQuestion } from '@/types/test'

defineProps<{
  question: ProcessedQuestion
}>()
</script>

<style src="./styles/shared.css"></style>
