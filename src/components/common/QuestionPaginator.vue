<template>
  <div class="paginator">
    <button
      v-for="qid in questionIds"
      :key="qid"
      class="page"
      :class="{ active: qid === currentQuestion }"
      @click="$emit('change', qid)"
    >
      {{ qid }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  questionIds: number[]
  currentQuestion: number
}

defineProps<Props>()
defineEmits<{ (e: 'change', questionId: number): void }>()
</script>

<style scoped>
.paginator {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 12px 24px;
  display: flex;
  gap: 6px;
  justify-content: center;
}

.page {
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.page.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
</style>
