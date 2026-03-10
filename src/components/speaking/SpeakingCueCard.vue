<script setup lang="ts">
defineProps<{
  content: string | null
}>()
</script>

<template>
  <div class="cue-card">
    <div class="cue-card__content" v-html="content" />
  </div>
</template>

<style scoped>
.cue-card {
  background: #fff;
  border: 3px solid #4CAF50;
  border-radius: 16px;
  padding: 40px;
  max-width: 700px;
  margin: 0 auto;
  text-align: left;
}

.cue-card__content {
  font-size: 24px;
  line-height: 1.6;
  color: #333;
}

.cue-card__content :deep(ul) {
  margin: 12px 0;
  padding-left: 20px;
}

.cue-card__content :deep(li) {
  margin: 6px 0;
}

.cue-card__content :deep(p) {
  margin: 8px 0;
}
</style>
