import { computed, type Ref, nextTick, watch } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import type { ReadingTestRaw } from '@/types/reading'
import { processQuestionText, processDropdownText, restoreAnswersInContainer, autoResizeInput, autoResizeAllInputs } from '@/utils/questionUtils'

interface QuestionProcessorOptions {
  containerRef: Ref<HTMLElement | null>
}

type RawQuestion = ReadingTestRaw['parts'][0]['questions'][0]
type RawChild = NonNullable<RawQuestion['children']>[0]

export function useReadingQuestionProcessor(options: QuestionProcessorOptions) {
  const readingStore = useReadingStore()
  const { containerRef } = options

  // Process all content when questions or part changes
  const processedQuestions = computed<ProcessedQuestion[]>(() => {
    const currentPart = readingStore.currentPart
    const test = readingStore.test
    const stats = readingStore.partStats

    if (!test || !test.parts || !stats[currentPart]) return []

    const part = test.parts.find((p) => p.order === currentPart)
    if (!part || !part.questions) return []

    const questions = [...part.questions].sort((a, b) => a.order - b.order)
    let globalGapCounter = stats[currentPart].start - 1

    // Also account for gaps in passage content to keep globalGapCounter correct
    if (part.content) {
      const { nextCounter } = processQuestionText(part.content, globalGapCounter)
      globalGapCounter = nextCounter
    }

    const processAnyQuestion = (q: RawQuestion | RawChild): ProcessedQuestion => {
      const processed: ProcessedQuestion = {
        id: q.id,
        type: q.type,
        order: q.order,
        title: q.title,
        name: q.name,
        options_title: (q as RawQuestion).options_title || null,
        options: q.options,
        content: q.content,
        answers_count: q.answers_count,
        answers: (q as RawQuestion).answers,
        parent_id: (q as RawQuestion).parent_id,
      }

      if (q.type === QuestionType.TRUE_FALSE_NOT_GIVEN) {
        processed.options = ['TRUE', 'FALSE', 'NOT GIVEN']
        globalGapCounter++
        processed.questionNumber = globalGapCounter
        processed.displayNumber = String(globalGapCounter)
      } else if (q.type === QuestionType.YES_NO_NOT_GIVEN) {
        processed.options = ['YES', 'NO', 'NOT GIVEN']
        globalGapCounter++
        processed.questionNumber = globalGapCounter
        processed.displayNumber = String(globalGapCounter)
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        globalGapCounter++
        processed.questionNumber = globalGapCounter
        const answerCount = q.answers_count ?? 1
        if (answerCount > 1) {
          const startNumber = globalGapCounter
          globalGapCounter += answerCount - 1
          processed.displayNumber = `${startNumber}-${globalGapCounter}`
        } else {
          processed.displayNumber = String(globalGapCounter)
        }
      }

      if (q.content) {
        if (q.type === QuestionType.DROP_DOWN) {
          const { html, nextCounter } = processDropdownText(q.content, globalGapCounter, q.options)
          processed.processedContent = html
          globalGapCounter = nextCounter
        } else {
          const { html, nextCounter } = processQuestionText(q.content, globalGapCounter)
          processed.processedContent = html
          globalGapCounter = nextCounter
        }
      }

      if ('children' in q && q.children && q.children.length > 0) {
        processed.children = q.children.map(processAnyQuestion)
      }

      return processed
    }

    return questions.map(processAnyQuestion)
  })

  // Process passage content
  const processedPassageContent = computed(() => {
    const currentPart = readingStore.currentPart
    const passage = readingStore.currentPassage
    const stats = readingStore.partStats

    if (!passage || !passage.content || !stats[currentPart]) return ''

    // If there's highlighted HTML in store, use that
    const highlight = readingStore.highlights[currentPart] || readingStore.highlights[String(currentPart)]
    if (highlight && typeof highlight === 'string') {
      return highlight
    }

    const { html } = processQuestionText(passage.content, stats[currentPart].start - 1)
    return html
  })

  // Restore saved values to gap inputs and match dropzones
  const restoreGapValues = () => {
    restoreAnswersInContainer(containerRef.value, readingStore.answers)
    autoResizeAllInputs(containerRef.value)
  }

  // Handle input events using event delegation
  const handleGapInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains('gap-input')) return

    const gap = target.dataset.gap
    if (gap) {
      readingStore.updateAnswer(parseInt(gap, 10), target.value)
    }
    autoResizeInput(target)
  }

  // Handle dropdown change events
  const handleDropdownChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    if (!target.classList.contains('dropdown-select')) return

    const gap = target.dataset.gap
    if (gap) {
      readingStore.updateAnswer(parseInt(gap, 10), target.value)
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
    processedPassageContent,
    restoreGapValues,
    setupInputListener,
  }
}
