import { computed, type Ref, nextTick, watch } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import { QuestionType, type ProcessedQuestion } from '@/types/test'
import type { ReadingTestRaw } from '@/types/reading'
import {
  processQuestionText,
  processDropdownText,
  restoreAnswersInContainer,
  autoResizeInput,
  autoResizeAllInputs,
  countAnswerTokens,
  isStandaloneFillQuestion,
  isPassageTokenQuestion,
  isPassageOnlyPart,
} from '@/utils/questionUtils'

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
    const partHasTokens = countAnswerTokens(part.content) > 0

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
      } else if (q.type === QuestionType.MATCHING || q.type === QuestionType.MATCH_HEADING) {
        if (typeof q.content === 'string' && q.content.includes('[match]')) {
          // Statement-style matching: the question number is the number the
          // upcoming [match] dropzone in `content` will receive.
          const num = globalGapCounter + 1
          processed.questionNumber = num
          processed.displayNumber = String(num)
        } else if (isStandaloneFillQuestion(q, partHasTokens)) {
          // Legacy/CEFR single-answer matching ("Text 7", "Paragraph I"): one number,
          // answered with the letter pills / dropdown of MatchingQuestion.
          globalGapCounter++
          processed.questionNumber = globalGapCounter
          processed.displayNumber = String(globalGapCounter)
        } else if (isPassageTokenQuestion(q, partHasTokens)) {
          // Heading-style: dropzones are in the passage, this question holds the options.
          processed.usesPassageDropzones = true
        }
      } else if (q.type === QuestionType.MATCHING_INFORMATION) {
        const hasChildren = 'children' in q && Array.isArray(q.children) && q.children.length > 0
        if (!hasChildren) {
          globalGapCounter++
          processed.questionNumber = globalGapCounter
          processed.displayNumber = String(globalGapCounter)
        }
      } else if (isStandaloneFillQuestion(q, partHasTokens)) {
        // Standalone gap / dropdown without a token: append one so it gets an input
        // and exactly the one number partStats reserved for it.
        const token = q.type === QuestionType.DROP_DOWN ? '[match]' : '[gap]'
        const base = typeof q.content === 'string' ? q.content.trim() : ''
        processed.content = base ? `${base} ${token}` : token
      } else if (isPassageTokenQuestion(q, partHasTokens)) {
        processed.usesPassageDropzones = true
      }

      const content = processed.content
      if (content) {
        if (q.type === QuestionType.DROP_DOWN) {
          const { html, nextCounter } = processDropdownText(content, globalGapCounter, q.options)
          processed.processedContent = html
          globalGapCounter = nextCounter
        } else {
          const { html, nextCounter } = processQuestionText(content, globalGapCounter)
          processed.processedContent = html
          globalGapCounter = nextCounter
        }
      }

      if ('children' in q && q.children && q.children.length > 0) {
        processed.children = [...q.children].sort((a, b) => a.order - b.order).map(processAnyQuestion)
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

    // If there's user-highlighted HTML in store, use that
    const highlight = readingStore.highlights[currentPart] || readingStore.highlights[String(currentPart)]
    if (highlight && typeof highlight === 'string' && highlight.includes('<mark')) {
      return highlight
    }

    let { html } = processQuestionText(passage.content, stats[currentPart].start - 1)

    // CEFR gap-text parts (all answers are passage gaps): label the instruction
    // card with the real question range instead of the generic "PART N" badge.
    if (isPassageOnlyPart(passage)) {
      const range = `Questions ${stats[currentPart].start}–${stats[currentPart].end}`
      html = html.replace(
        /(<div class=["']instruction-badge["']>)\s*PART\s*\d+\s*(<\/div>)/i,
        `$1${range}$2`,
      )
    }

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
