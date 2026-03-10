<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="part-badge">
    <span class="part-badge__text">PART</span>
    <span class="part-badge__number">{{ label }}</span>
  </div>
</template>

<style scoped>
.part-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  overflow: hidden;
  font-weight: 900;
  font-size: 38px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.part-badge__text {
  background: #4CAF50;
  color: #fff;
  padding: 14px 36px;
}

.part-badge__number {
  background: #F5E642;
  color: #1a1a1a;
  padding: 14px 36px;
}

@media (max-width: 768px) {
  .part-badge {
    font-size: 26px;
    border-radius: 12px;
  }

  .part-badge__text,
  .part-badge__number {
    padding: 10px 24px;
  }
}

@media (max-width: 480px) {
  .part-badge {
    font-size: 20px;
    border-radius: 10px;
  }

  .part-badge__text,
  .part-badge__number {
    padding: 8px 18px;
  }
}
</style>
