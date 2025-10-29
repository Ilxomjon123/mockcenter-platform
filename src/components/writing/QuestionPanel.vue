<template>
  <div class="question-panel" :style="{ width: `${width}%` }">
    <div v-if="page === 1">
      <h2 class="part-title">Part 1</h2>
      <p class="part-subtitle">
        You should spend about 20 minutes on this task. Write at least 150 words.
      </p>

      <div class="instructions">
        <p class="instruction-bold">
          The chart below shows the number of adults participating in different major sports in one
          area, in 1997 and 2017.
        </p>
        <p class="instruction-bold">
          Summarise the information by selecting and reporting the main features, and make
          comparisons where relevant.
        </p>
      </div>
    </div>

    <div v-else>
      <h2 class="part-title">Part 2</h2>
      <p class="part-subtitle">
        You should spend about 40 minutes on this task. Write at least 250 words.
      </p>

      <div class="instructions">
        <p class="instruction-text">Write about the following topic:</p>

        <p class="instruction-bold">
          The world of work is changing rapidly and employees cannot depend on having the same job
          or the same working conditions for life.
        </p>

        <p class="instruction-bold">
          Discuss the possible causes for this rapid change, and suggest ways of preparing people
          for the world of work in the future.
        </p>

        <p class="instruction-text" style="margin-top: 16px">
          Give reasons for your answer and include any relevant examples from your own knowledge or
          experience.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  page: number
  width: number
}

defineProps<Props>()
</script>

<style scoped>
.question-panel {
  background: white;
  padding: 32px;
  overflow-y: auto;
  flex-shrink: 0;
}

.part-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.part-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.instructions {
  margin-bottom: 16px;
}

.instruction-text {
  font-size: 14px;
  margin-bottom: 16px;
}

.instruction-bold {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
