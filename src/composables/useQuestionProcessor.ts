import { computed, type Ref, nextTick, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import { processQuestionText, processDropdownText, restoreAnswersInContainer, autoResizeInput, autoResizeAllInputs } from '@/utils/questionUtils'

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

      if (question.type === QuestionType.TRUE_FALSE_NOT_GIVEN) {
        processedQuestion.options = ['TRUE', 'FALSE', 'NOT GIVEN']
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
        processedQuestion.displayNumber = String(globalGapCounter)
      } else if (question.type === QuestionType.YES_NO_NOT_GIVEN) {
        processedQuestion.options = ['YES', 'NO', 'NOT GIVEN']
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
        processedQuestion.displayNumber = String(globalGapCounter)
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
        const answerCount = question.answers_count ?? 1
        if (answerCount > 1) {
          const startNumber = globalGapCounter
          globalGapCounter += answerCount - 1
          processedQuestion.displayNumber = `${startNumber}-${globalGapCounter}`
        } else {
          processedQuestion.displayNumber = String(globalGapCounter)
        }
      }

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

  // Handle input events using event delegation
  const handleGapInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains('gap-input')) return

    const gap = target.dataset.gap
    if (gap) {
      listeningStore.updateAnswer(parseInt(gap, 10), target.value)
    }
    autoResizeInput(target)
  }

  // Handle dropdown change events
  const handleDropdownChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    if (!target.classList.contains('dropdown-select')) return

    const gap = target.dataset.gap
    if (gap) {
      listeningStore.updateAnswer(parseInt(gap, 10), target.value)
    }
  }

  // Setup input event listener
  const setupInputListener = () => {
    if (containerRef.value) {
      containerRef.value.addEventListener('input', handleGapInput)
      containerRef.value.addEventListener('change', handleDropdownChange)
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
    restoreGapValues,
    setupInputListener,
  }
}
