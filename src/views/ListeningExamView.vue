<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <ListeningQuestionPanel />
    </div>

    <ExamFooter
      :current-page="listeningStore.currentPart"
      :total-pages="listeningStore.test?.parts?.length || 0"
      :part-orders="listeningStore.partOrders"
      @change-page="listeningStore.setPart"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ListeningQuestionPanel from '@/components/listening/ListeningQuestionPanel.vue'
import { useListeningStore } from '@/stores/listeningStore'

const listeningStore = useListeningStore()

const handleSubmit = (): void => {
  alert('Listening exam submitted successfully!')
}
</script>

<style scoped>
.exam-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
