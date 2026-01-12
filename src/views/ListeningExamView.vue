<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <audio
        ref="audioRef"
        :src="listeningStore.currentSectionData?.audioUrl || ''"
        autoplay
        style="display: none"
      ></audio>

      <ListeningQuestionPanel
        :questions="listeningStore.currentSectionData?.questions || []"
        :questions-range="getQuestionsRange()"
        :instruction="getInstruction()"
        :answers="listeningStore.answers"
        @update-answer="listeningStore.updateAnswer"
        :text="listeningStore.text"
      />
    </div>

    <ExamFooter
      :current-page="listeningStore.currentSection"
      :total-pages="4"
      @change-page="listeningStore.setSection"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import { ref, watch } from 'vue'
import ListeningQuestionPanel from '@/components/listening/ListeningQuestionPanel.vue'
import { useListeningStore } from '@/stores/listeningStore'

const listeningStore = useListeningStore()
const audioRef = ref<HTMLAudioElement | null>(null)

watch(
  () => listeningStore.currentSection,
  () => {
    if (audioRef.value) {
      audioRef.value.currentTime = 0
      audioRef.value.play().catch(() => {})
    }
  },
)

const getQuestionsRange = (): string => {
  const section = listeningStore.currentSectionData
  if (!section || section.questions.length === 0) return ''
  const firstQ = section!.questions[0]!.id
  const lastQ = section!.questions[section!.questions.length - 1]!.id
  return firstQ === lastQ ? `${firstQ}` : `${firstQ}-${lastQ}`
}

const getInstruction = (): string => {
  return listeningStore.currentSectionData?.instructions || ''
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
