<template>
  <div class="resizable-divider" :class="{ dragging: isDragging }" @mousedown="onMouseDown">
    <div class="divider-line"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isDragging: boolean
}

interface Emits {
  (e: 'startDrag'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const onMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  emit('startDrag')
}
</script>

<style scoped>
.resizable-divider {
  width: 8px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.resizable-divider:hover {
  background: #f3f4f6;
}

.resizable-divider.dragging {
  background: #e5e7eb;
}

.divider-line {
  width: 1px;
  height: 100%;
  background: #d1d5db;
}

.resizable-divider:hover .divider-line {
  background: #9ca3af;
  width: 2px;
}

.resizable-divider.dragging .divider-line {
  background: #6b7280;
  width: 2px;
}
</style>
