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
  countAnswerTokens,
  isStandaloneFillQuestion,
  normalizeMatchOptions,
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

    const currentPartObj = listeningStore.test?.parts?.find((p) => p.order === part)
    const partContent = currentPartObj?.content || ''

    // Standalone fill questions (no token in content, no children) take one
    // number in partStats; give them a real input so they can be answered.
    const withAnswerToken = (q: ProcessedQuestion): ProcessedQuestion => {
      if (!isStandaloneFillQuestion(q, false)) return q
      const token = q.type === QuestionType.GAP_FILLING ? '[gap]' : '[match]'
      const base = typeof q.content === 'string' ? q.content.trim() : ''
      return { ...q, content: base ? `${base} ${token}` : token }
    }

    // Consecutive flat single-answer matching questions WITHOUT a [match] token
    // that share the same letter options (legacy CEFR "Speaker 1" / map "Item 1"
    // layout) are shown as one matching group with a single options bank.
    // Flat matching with its own [match] (IELTS) keeps the per-question rendering.
    const isLetterOptions = (opts: unknown): boolean => {
      const items = normalizeMatchOptions(opts)
      if (items.length < 2) return false
      if (!Array.isArray(opts)) return true
      return items.every((o) => !o.text)
    }
    const isGroupableMatching = (q: ProcessedQuestion): boolean =>
      q.type === QuestionType.MATCHING &&
      !(q.children && q.children.length > 0) &&
      countAnswerTokens(q.content) === 0 &&
      isLetterOptions(q.options)

    const preprocessed: ProcessedQuestion[] = []
    let flatMatchingBatch: ProcessedQuestion[] = []

    const flushBatch = () => {
      const batch = flatMatchingBatch
      flatMatchingBatch = []
      const first = batch[0]
      if (!first) return

      if (batch.length === 1) {
        preprocessed.push(withAnswerToken(first))
        return
      }

      const letterItems = normalizeMatchOptions(first.options)
      let sharedOptions: Record<string, string> = {}
      letterItems.forEach((o) => {
        sharedOptions[o.key] = o.text || o.letter
      })

      // Option descriptions may only exist in the part text ("Options: A) ... B) ...")
      if (letterItems.every((o) => !o.text)) {
        const optMatch = partContent.match(
          /Options:\s*([\s\S]+?)(?:\n\s*Speaker|\n\s*1\b|<div|<p|$)/i,
        )
        if (optMatch && optMatch[1]) {
          const optRegex = /([A-Z])[).]\s*([^\n\r<]+)/g
          let om: RegExpExecArray | null
          const parsed: Record<string, string> = {}
          while ((om = optRegex.exec(optMatch[1])) !== null) {
            if (om[1] && om[2]) parsed[om[1].toUpperCase()] = om[2].trim()
          }
          if (Object.keys(parsed).length > 2 && Object.keys(parsed).every((k) => k in sharedOptions)) {
            sharedOptions = { ...sharedOptions, ...parsed }
          }
        }
      }

      const children = batch.map((child) => {
        const c: ProcessedQuestion = { ...child, content: '[match]' }
        // Placeholder rows ("Item 1") take their label from the part text ("1. bow and arrow displays")
        const itemMatch = String(child.content || child.title || '').match(/^\s*item\s*(\d+)\s*$/i)
        if (itemMatch && itemMatch[1]) {
          const nameRegex = new RegExp(`(?:^|[\\s|;])${itemMatch[1]}\\s*[.)]\\s*([^0-9|;\\n<]+)`, 'i')
          const nameMatch = partContent.match(nameRegex)
          if (nameMatch && nameMatch[1] && nameMatch[1].trim()) {
            c.title = nameMatch[1].trim()
          }
        }
        return c
      })

      preprocessed.push({
        id: typeof first.id === 'number' ? first.id * 1000 : 99000 + part * 10,
        order: first.order,
        name: null,
        type: QuestionType.MATCHING,
        title: null, // set after numbering (needs the children numbers)
        content: '',
        options_title: first.options_title || 'Options',
        options: sharedOptions,
        children,
      })
    }

    for (const q of questions) {
      if (isGroupableMatching(q)) {
        const prev = flatMatchingBatch[0]
        if (prev && JSON.stringify(prev.options) !== JSON.stringify(q.options)) flushBatch()
        flatMatchingBatch.push(q)
      } else {
        flushBatch()
        preprocessed.push(withAnswerToken(q))
      }
    }
    flushBatch()

    // Use partStats to get the correct starting counter
    let globalGapCounter = stats[part].start - 1

    const processQuestion = (question: ProcessedQuestion): ProcessedQuestion => {
      const processedQuestion: ProcessedQuestion = { ...question }

      globalGapCounter = applyQuestionNumbering(question, processedQuestion, globalGapCounter)

      if (question.content) {
        let cleanContent = question.content
        // Clean out sheet badge and bullet elements
        cleanContent = cleanContent.replace(
          /<div[^>]*class=["'][^"']*sheet-badge[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
          ''
        )
        cleanContent = cleanContent.replace(
          /<span[^>]*class=["'][^"']*note-bullet[^"']*["'][^>]*>\s*<\/span>/gi,
          ''
        )
        // For Lecture Passage (Part 6): unify sentences into continuous prose (bir butun matn)
        if (cleanContent.includes('lecture-passage')) {
          const titleMatch = cleanContent.match(/<h3[^>]*class=["'][^"']*sheet-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)
          const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : ''

          const sentences: string[] = []
          const textRegex = /<div[^>]*class=["'][^"']*note-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
          let m: RegExpExecArray | null
          while ((m = textRegex.exec(cleanContent)) !== null) {
            const t = (m[1] || '').trim()
            if (t) sentences.push(t)
          }

          if (sentences.length > 0) {
            const prose = sentences.join(' ')
            cleanContent = `<div class="lecture-passage">` +
              (title ? `<h3 class="sheet-title">${title}</h3>` : '') +
              `<div class="sheet-body"><p class="lecture-prose">${prose}</p></div></div>`
          }
        } else {
          // Merge split label + gap rows (e.g., "...Length of walk:</div></div>...<div class="note-text">[gap]...")
          cleanContent = cleanContent.replace(
            /<\/div>\s*<\/div>\s*<div[^>]*class=["'][^"']*note-row[^"']*["'][^>]*>\s*<div[^>]*class=["'][^"']*note-text[^"']*["']>\s*(\[gap\])/gi,
            ' $1'
          )
        }

        if (question.type === QuestionType.DROP_DOWN) {
          const { html, nextCounter } = processDropdownText(
            cleanContent,
            globalGapCounter,
            question.options
          )
          processedQuestion.processedContent = html
          globalGapCounter = nextCounter
        } else {
          const { html, nextCounter } = processQuestionText(cleanContent, globalGapCounter)
          processedQuestion.processedContent = html
          globalGapCounter = nextCounter
        }
      }

      if (question.children && question.children.length > 0) {
        processedQuestion.children = question.children.map((child): ProcessedQuestion => {
          return processQuestion(withAnswerToken({ ...child }))
        })
      }

      return processedQuestion
    }

    return preprocessed.map((question): ProcessedQuestion => {
      const processed = processQuestion({ ...question })
      if (processed.title === null && processed.children?.length) {
        const nums = processed.children
          .map((c) => Number(/data-match="(\d+)"/.exec(c.processedContent || '')?.[1]))
          .filter((n) => Number.isFinite(n) && n > 0)
        const letters = normalizeMatchOptions(processed.options).map((o) => o.letter)
        const range = nums.length ? ` (${nums[0]}–${nums[nums.length - 1]})` : ''
        const letterRange = letters.length ? ` (${letters[0]}–${letters[letters.length - 1]})` : ''
        processed.title = `Match each question${range} with the correct option${letterRange}.`
      }
      return processed
    })
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
