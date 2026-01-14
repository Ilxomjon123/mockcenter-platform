<template>
  <div class="question-panel" :style="{ width: `${width}%` }">
    <div class="question-content">
      <div v-if="writingStore.currentPart?.file" class="part-image-container">
        <img :src="writingStore.currentPart.file" :alt="writingStore.currentPart.title" class="part-image" />
      </div>
      <div class="instructions" v-html="writingStore.currentPart?.content"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWritingStore } from '@/stores/writingStore'

interface Props {
  page: number
  width: number
}

defineProps<Props>()

const writingStore = useWritingStore()
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

.question-content {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.instructions :deep(img),
.part-image {
  height: 500px;
  width: auto;
  object-fit: contain;
  display: block;
  margin: 16px 0;
}

.instructions {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
}
</style>
