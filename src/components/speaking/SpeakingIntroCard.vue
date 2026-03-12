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
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
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
  flex-wrap: wrap;
}

.intro-card__badge {
  background: #3f51b5;
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 32px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .intro-card {
    padding: 36px 28px;
    border-radius: 18px;
  }

  .intro-card__title {
    font-size: 36px;
    margin: 0 0 14px;
  }

  .intro-card__divider {
    width: 160px;
    margin: 0 auto 14px;
  }

  .intro-card__subtitle {
    font-size: 30px;
    gap: 10px;
  }

  .intro-card__badge {
    font-size: 22px;
    padding: 4px 14px;
  }
}

@media (max-width: 480px) {
  .intro-card {
    padding: 28px 20px;
    border-radius: 14px;
  }

  .intro-card__title {
    font-size: 28px;
    margin: 0 0 12px;
  }

  .intro-card__divider {
    width: 120px;
    margin: 0 auto 12px;
  }

  .intro-card__subtitle {
    font-size: 24px;
    gap: 8px;
  }

  .intro-card__badge {
    font-size: 18px;
    padding: 4px 12px;
    border-radius: 6px;
  }
}
</style>
