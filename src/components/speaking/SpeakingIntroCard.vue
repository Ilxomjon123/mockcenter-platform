<script setup lang="ts">
</script>

<template>
  <div class="intro-card">
    <h1 class="intro-card__title">Multilevel Exam</h1>
    <div class="intro-card__divider" />
    <div class="intro-card__subtitle">
      <span class="intro-card__badge">New</span>
      <span>Speaking Test</span>
    </div>
  </div>
</template>

<style scoped>
.intro-card {
  background: #4CAF50;
  border-radius: 24px;
  padding: 56px 72px;
  text-align: center;
  color: #fff;
  max-width: 640px;
  margin: 0 auto;
}

.intro-card__title {
  font-size: 56px;
  font-weight: 800;
  font-style: italic;
  margin: 0 0 20px;
}

.intro-card__divider {
  height: 3px;
  background: rgba(255, 255, 255, 0.5);
  margin: 0 auto 20px;
  width: 240px;
}

.intro-card__subtitle {
  font-size: 44px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.intro-card__badge {
  background: #3f51b5;
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 32px;
  font-weight: 800;
}
</style>
