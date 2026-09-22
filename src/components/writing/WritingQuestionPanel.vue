<template>
  <div class="question-panel" :style="{ width: `${width}%` }">
    <div class="question-content">
      <div v-if="writingStore.currentPart?.file && !hasImgInContent" class="part-image-container">
        <img :src="writingStore.currentPart.file" :alt="writingStore.currentPart.title" class="part-image" />
      </div>
      <div class="instructions" v-html="writingStore.currentPart?.content"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWritingStore } from '@/stores/writingStore'

interface Props {
  page: number
  width: number
}

defineProps<Props>()

const writingStore = useWritingStore()
const hasImgInContent = computed(() => /<img\s/i.test(writingStore.currentPart?.content || ''))
</script>

<style scoped>
.question-panel {
  background: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
}

@media (max-width: 640px) {
  .question-panel {
    width: 100% !important;
    border-right: none;
  }
}

.question-content {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 640px) {
  .question-content {
    padding: 16px;
  }
}

.instructions :deep(img),
.part-image {
  max-width: 100%;
  height: auto;
  max-height: 480px;
  object-fit: contain;
  display: block;
  margin: 16px auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

@media (max-width: 640px) {
  .instructions :deep(img),
  .part-image {
    max-height: 300px;
    margin: 12px auto;
  }
}

.instructions {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
}

@media (max-width: 640px) {
  .instructions {
    font-size: 14px;
  }
}
</style>
