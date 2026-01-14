import { computed, type Ref, nextTick, watch } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import type { ProcessedQuestion } from '@/types/test'
import { processQuestionText, restoreAnswersInContainer } from '@/utils/questionUtils'

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

    return questions.map((question): ProcessedQuestion => {
      const processedQuestion: ProcessedQuestion = { ...question }

      if (question.type === 'test' || question.type === 'multiple_choice') {
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
        // Use answers_count to properly increment counter (default to 1 for single-answer questions)
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
        const { html, nextCounter } = processQuestionText(question.content, globalGapCounter)
        processedQuestion.processedContent = html
        globalGapCounter = nextCounter
      }

      if (question.children && question.children.length > 0) {
        processedQuestion.children = question.children.map((child): ProcessedQuestion => {
          const processedChild: ProcessedQuestion = { ...child }

          if (child.type === 'test' || child.type === 'multiple_choice') {
            globalGapCounter++
            processedChild.questionNumber = globalGapCounter
            // Use answers_count to properly increment counter (default to 1 for single-answer questions)
            const childAnswerCount = child.answers_count ?? 1
            if (childAnswerCount > 1) {
              const startNumber = globalGapCounter
              globalGapCounter += childAnswerCount - 1
              processedChild.displayNumber = `${startNumber}-${globalGapCounter}`
            } else {
              processedChild.displayNumber = String(globalGapCounter)
            }
          }

          if (child.content) {
            const { html, nextCounter } = processQuestionText(child.content, globalGapCounter)
            processedChild.processedContent = html
            globalGapCounter = nextCounter
          }
          return processedChild
        })
      }

      return processedQuestion
    })
  })

  // Restore saved values to gap inputs and match dropzones
  const restoreGapValues = () => {
    restoreAnswersInContainer(containerRef.value, listeningStore.answers)
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
