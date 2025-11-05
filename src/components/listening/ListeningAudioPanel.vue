<template>
  <div class="audio-panel" :style="{ width: `${width}%` }">
    <div class="audio-header">
      <span class="section-label">Section {{ section }}</span>
      <p class="instruction">{{ instructions }}</p>
    </div>

    <div class="audio-content">
      <div class="audio-controls">
        <audio ref="audioRef" controls :src="audioSrc" @timeupdate="onTimeUpdate" />
        <div class="file-input">
          <label class="file-label">
            <input type="file" accept="audio/*" @change="onFileChange" />
            Load audio file
          </label>
          <span v-if="fileName" class="file-name">{{ fileName }}</span>
        </div>
      </div>

      <div class="time-info">
        <span>{{ formattedTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  section: number
  width: number
  instructions: string
}

defineProps<Props>()

const audioRef = ref<HTMLAudioElement | null>(null)
const audioSrc = ref<string>('')
const fileName = ref<string>('')
const currentTime = ref<number>(0)

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(currentTime.value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  fileName.value = file.name
  const url = URL.createObjectURL(file)
  audioSrc.value = url
}

const onTimeUpdate = () => {
  currentTime.value = audioRef.value?.currentTime || 0
}
</script>

<style scoped>
.audio-panel {
  background: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.audio-header {
  background: #f5f5f5;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.section-label {
  font-weight: 600;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.audio-content {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.file-input input[type='file'] {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}

.file-name {
  font-size: 14px;
  color: #6b7280;
}

.time-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
