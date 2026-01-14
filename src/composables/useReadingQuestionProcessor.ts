import { computed, type Ref, nextTick, watch } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import type { ProcessedQuestion } from '@/types/test'
import type { ReadingTestRaw } from '@/types/reading'

interface QuestionProcessorOptions {
  containerRef: Ref<HTMLElement | null>
}

type RawQuestion = ReadingTestRaw['parts'][0]['questions'][0]
type RawChild = NonNullable<RawQuestion['children']>[0]

export function useReadingQuestionProcessor(options: QuestionProcessorOptions) {
  const readingStore = useReadingStore()
  const { containerRef } = options

  // Get starting question number for each part
  const getStartNumber = (partOrder: number): number => {
    switch (partOrder) {
      case 1: return 1
      case 2: return 14
      case 3: return 27
      default: return 1
    }
  }

  // Process all content when questions or part changes
  const processedQuestions = computed<ProcessedQuestion[]>(() => {
    const currentPart = readingStore.currentPart
    const test = readingStore.test

    if (!test || !test.parts) return []

    const part = test.parts.find(p => p.order === currentPart)
    if (!part || !part.questions) return []

    const questions = [...part.questions].sort((a, b) => a.order - b.order)
    let globalGapCounter = getStartNumber(currentPart) - 1

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

    const processChild = (child: RawChild): ProcessedQuestion => {
      const processedChild: ProcessedQuestion = {
        id: child.id,
        type: child.type,
        order: child.order,
        title: child.title,
        name: child.name,
        options_title: null,
        options: child.options,
        content: child.content,
        answers_count: child.answers_count,
      }

      // For true_false_not_given children, add fixed options
      if (child.type === 'true_false_not_given') {
        processedChild.options = ['True', 'False', 'Not given']
        globalGapCounter++
        processedChild.questionNumber = globalGapCounter
      } else if (child.type === 'test' || child.type === 'multiple_choice') {
        globalGapCounter++
        processedChild.questionNumber = globalGapCounter
        const childAnswerCount = child.answers_count ?? 1
        if (childAnswerCount > 1) {
          globalGapCounter += childAnswerCount - 1
        }
      }

      if (child.content) {
        processedChild.processedContent = processText(child.content)
      }
      return processedChild
    }

    const processQuestion = (question: RawQuestion): ProcessedQuestion => {
      const processedQuestion: ProcessedQuestion = {
        id: question.id,
        part_id: question.part_id,
        type: question.type,
        order: question.order,
        title: question.title,
        name: question.name,
        options_title: question.options_title,
        options: question.options,
        content: question.content,
        answers: question.answers,
        answers_count: question.answers_count,
        parent_id: question.parent_id,
      }

      // For true_false_not_given, add fixed options
      if (question.type === 'true_false_not_given') {
        processedQuestion.options = ['True', 'False', 'Not given']
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
      } else if (question.type === 'test' || question.type === 'multiple_choice') {
        globalGapCounter++
        processedQuestion.questionNumber = globalGapCounter
        const answerCount = question.answers_count ?? 1
        if (answerCount > 1) {
          globalGapCounter += answerCount - 1
        }
      }

      if (question.content) {
        processedQuestion.processedContent = processText(question.content)
      }

      if (question.children && question.children.length > 0) {
        processedQuestion.children = question.children.map(processChild)
      }

      return processedQuestion
    }

    // Filter out 'parent' type questions only at root level and process them
    return questions.map(processQuestion)
  })

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
      const savedValue = readingStore.answers[gapId]
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
      const savedValue = readingStore.answers[matchId]
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
      readingStore.updateAnswer(parseInt(gap, 10), target.value)
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
