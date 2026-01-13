import { computed, type Ref, nextTick, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import type { ProcessedQuestion } from '@/types/test'

interface QuestionProcessorOptions {
  containerRef: Ref<HTMLElement | null>
}

export function useQuestionProcessor(options: QuestionProcessorOptions) {
  const listeningStore = useListeningStore()
  const { containerRef } = options

  // Process all content when questions or part changes
  const processedQuestions = computed<ProcessedQuestion[]>(() => {
    const questions = listeningStore.currentQuestions
    const part = listeningStore.currentPart

    if (!questions || questions.length === 0) return []

    let globalGapCounter = (part - 1) * 10

    const processText = (text: string | null | unknown): string => {
      if (!text || typeof text !== 'string') return ''

      return text
        .replace(/\[gap\]/g, () => {
          globalGapCounter++
          return `<input type="text" placeholder="${globalGapCounter}" class="gap-input" data-gap="${globalGapCounter}" style="width: 100px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin: 0 4px; text-align: center;">`
        })
        .replace(/\[match\]/g, () => {
          globalGapCounter++
          return `<span class="match-dropzone" draggable="true" data-match="${globalGapCounter}" data-gap="${globalGapCounter}"><span class="match-number">${globalGapCounter}</span><span class="match-value"></span></span>`
        })
    }

    return questions.map((question): ProcessedQuestion => {
      const processedQuestion: ProcessedQuestion = { ...question }

      if (question.type === 'test' || question.type === 'multiple_choice') {
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
      }

      if (question.content) {
        processedQuestion.processedContent = processText(question.content)
      }

      if (question.children && question.children.length > 0) {
        processedQuestion.children = question.children.map((child): ProcessedQuestion => {
          const processedChild: ProcessedQuestion = { ...child }

          if (child.type === 'test' || child.type === 'multiple_choice') {
            globalGapCounter++
            processedChild.questionNumber = globalGapCounter
          }

          if (child.content) {
            processedChild.processedContent = processText(child.content)
          }
          return processedChild
        })
      }

      return processedQuestion
    })
  })

  // Simple pass-through function for backward compatibility
  const replaceGapsWithInputs = (text: string | null | unknown): string => {
    if (!text || typeof text !== 'string') return ''
    return text
  }

  // Check if question has options
  const hasOptions = (options: unknown): boolean => {
    if (!options) return false
    if (Array.isArray(options) && options.length > 0) return true
    if (typeof options === 'object' && Object.keys(options as object).length > 0) return true
    return false
  }

  // Get options as array for radio buttons
  const getOptionsArray = (options: unknown): { key: string; value: string }[] => {
    if (!options) return []

    if (Array.isArray(options)) {
      return options.map((opt) => ({
        key: String(opt),
        value: String(opt),
      }))
    }

    if (typeof options === 'object') {
      return Object.entries(options as Record<string, string>).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    }

    return []
  }

  // Format options for display (draggable)
  const formatOptions = (options: unknown): string => {
    if (!options) return ''

    if (Array.isArray(options)) {
      return options
        .map((opt) => {
          return `<span class="draggable-option" draggable="true" data-option-key="${opt}" data-option-value="${opt}">${opt}</span>`
        })
        .join('')
    }

    if (typeof options === 'object') {
      return Object.entries(options as Record<string, string>)
        .map(
          ([key, value]) =>
            `<span class="draggable-option" draggable="true" data-option-key="${key}" data-option-value="${value}">${value}</span>`
        )
        .join('')
    }

    return String(options)
  }

  // Handle radio button change
  const onRadioChange = (questionId: number, value: string) => {
    listeningStore.updateAnswer(questionId, value)
  }

  // Restore saved values to gap inputs and match dropzones
  const restoreGapValues = () => {
    if (!containerRef.value) return

    // Reset all options to visible
    const allOptions = containerRef.value.querySelectorAll<HTMLElement>('.draggable-option')
    allOptions.forEach((opt) => opt.classList.remove('used'))

    // Restore gap inputs
    const inputs = containerRef.value.querySelectorAll<HTMLInputElement>('.gap-input')
    inputs.forEach((input) => {
      const gapNumber = input.dataset.gap
      if (!gapNumber) return

      const gapId = parseInt(gapNumber, 10)
      const savedValue = listeningStore.answers[gapId]
      if (savedValue !== undefined) {
        input.value = String(savedValue)
      }
    })

    // Restore match dropzones and hide used options
    const dropzones = containerRef.value.querySelectorAll<HTMLElement>('.match-dropzone')
    dropzones.forEach((dropzone) => {
      const matchNumber = dropzone.dataset.match
      if (!matchNumber) return

      const matchId = parseInt(matchNumber, 10)
      const savedValue = listeningStore.answers[matchId]
      const valueEl = dropzone.querySelector('.match-value')
      if (savedValue !== undefined && valueEl) {
        valueEl.textContent = String(savedValue)
        dropzone.classList.add('has-value')

        const usedOption = containerRef.value?.querySelector(
          `.draggable-option[data-option-key="${savedValue}"]`
        ) as HTMLElement
        if (usedOption) {
          usedOption.classList.add('used')
        }
      }
    })
  }

  // Handle input events using event delegation
  const handleGapInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains('gap-input')) return

    const gap = target.dataset.gap
    if (gap) {
      listeningStore.updateAnswer(parseInt(gap, 10), target.value)
    }
  }

  // Setup input event listener
  const setupInputListener = () => {
    if (containerRef.value) {
      containerRef.value.addEventListener('input', handleGapInput)
    }
  }

  // Cleanup input event listener
  const cleanupInputListener = () => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('input', handleGapInput)
    }
  }

  // Watch for questions changes to restore values
  watch(
    () => processedQuestions.value,
    () => {
      nextTick(restoreGapValues)
    },
    { deep: true }
  )

  return {
    processedQuestions,
    replaceGapsWithInputs,
    hasOptions,
    getOptionsArray,
    formatOptions,
    onRadioChange,
    restoreGapValues,
    setupInputListener,
    cleanupInputListener,
  }
}
