<script setup lang="ts">
defineProps<{
  number: number
}>()
</script>

<template>
  <div class="question-badge">
    <span class="question-badge__text">QUESTION</span>
    <span class="question-badge__number">{{ number }}</span>
  </div>
</template>

<style scoped>
.question-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  overflow: hidden;
  font-weight: 900;
  font-size: 38px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.question-badge__text {
  background: #4caf50;
  color: #fff;
  padding: 14px 36px;
}

.question-badge__number {
  background: #f5e642;
  color: #1a1a1a;
  padding: 14px 36px;
}

@media (max-width: 768px) {
  .question-badge {
    font-size: 26px;
    border-radius: 12px;
  }

  .question-badge__text,
  .question-badge__number {
    padding: 10px 24px;
  }
}

@media (max-width: 480px) {
  .question-badge {
    font-size: 20px;
    border-radius: 10px;
  }

  .question-badge__text,
  .question-badge__number {
    padding: 8px 18px;
  }
}
</style>
