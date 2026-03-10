import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

/**
 * Composable for uploading the combined speaking recording to the backend.
 */
export function useSpeakingUpload() {
  const { post } = useApi()
  const isUploading = ref(false)

  /**
   * Upload the combined audio blob and submit the speaking section.
   */
  async function uploadAndSubmit(blob: Blob): Promise<boolean> {
    isUploading.value = true

    // Upload combined audio with retry
    let uploaded = false
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const formData = new FormData()
        const extension = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'wav'
        formData.append('audio', blob, `speaking_combined.${extension}`)

        await post('/api/exam/speaking/upload-audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded = true
        break
      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error)
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }

    if (!uploaded) {
      isUploading.value = false
      return false
    }

    // Submit speaking section
    try {
      await post('/api/exam/speaking/submit', {})
      isUploading.value = false
      return true
    } catch (error) {
      console.error('Speaking submit failed:', error)
      isUploading.value = false
      return false
    }
  }

  return {
    isUploading,
    uploadAndSubmit,
  }
}
