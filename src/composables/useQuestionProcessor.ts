import { computed, type Ref, nextTick, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import {
  processQuestionText,
  processDropdownText,
  restoreAnswersInContainer,
  autoResizeAllInputs,
  applyQuestionNumbering,
  attachGapInputListeners,
} from '@/utils/questionUtils'

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
    const stats = listeningStore.partStats

    if (!questions || questions.length === 0 || !stats[part]) return []

    // Use partStats to get the correct starting counter
    let globalGapCounter = stats[part].start - 1

    const processQuestion = (question: ProcessedQuestion): ProcessedQuestion => {
      const processedQuestion: ProcessedQuestion = { ...question }

      globalGapCounter = applyQuestionNumbering(question, processedQuestion, globalGapCounter)

      if (question.content) {
        if (question.type === QuestionType.DROP_DOWN) {
          const { html, nextCounter } = processDropdownText(question.content, globalGapCounter, question.options)
          processedQuestion.processedContent = html
          globalGapCounter = nextCounter
        } else {
          const { html, nextCounter } = processQuestionText(question.content, globalGapCounter)
          processedQuestion.processedContent = html
          globalGapCounter = nextCounter
        }
      }

      if (question.children && question.children.length > 0) {
        processedQuestion.children = question.children.map((child): ProcessedQuestion => {
          return processQuestion({ ...child })
        })
      }

      return processedQuestion
    }

    return questions.map((question): ProcessedQuestion => processQuestion({ ...question }))
  })

  // Restore saved values to gap inputs and match dropzones
  const restoreGapValues = () => {
    restoreAnswersInContainer(containerRef.value, listeningStore.answers)
    autoResizeAllInputs(containerRef.value)
  }

  // Setup input event listener (gap-input + dropdown-select delegation)
  const setupInputListener = () => {
    attachGapInputListeners(containerRef.value, listeningStore.updateAnswer)
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
    restoreGapValues,
    setupInputListener,
  }
}
