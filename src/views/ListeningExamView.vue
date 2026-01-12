<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <ListeningQuestionPanel />
    </div>

    <ExamFooter
      :current-page="listeningStore.currentSection"
      :total-pages="getTotalSections()"
      :part-orders="getPartOrders()"
      @change-page="listeningStore.setSection"
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

const getTotalSections = (): number => {
  // If test data is loaded, return the number of parts/sections
  if (listeningStore.test?.parts) {
    return listeningStore.test.parts.length
  }
  // Otherwise return the number of default sections
  return listeningStore.sections.length
}

const getPartOrders = (): number[] => {
  // If test data is loaded, return the part orders
  if (listeningStore.test?.parts) {
    return [...listeningStore.test.parts]
      .sort((a, b) => a.order - b.order)
      .map((p) => p.order)
  }
  // Otherwise return sequential section IDs
  return listeningStore.sections.map((s) => s.id)
}

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
