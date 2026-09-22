/**
 * Common utilities for processing IELTS exam questions (Listening and Reading)
 */

import { escapeHtml, sanitizeHtml } from './sanitize'
import { QuestionType, type ProcessedQuestion } from '@/types/test'

// Pre-compiled regex patterns for better performance
const MATCH_REGEX = /\[match\]/g
// Single pass over all placeholder tokens, in order of appearance.
// [heading_match] listed before [match] in the alternation for clarity;
// they never overlap since `[match]` is not a substring of `[heading_match]`.
const TOKEN_REGEX = /\[gap\]|\[heading_match\]|\[match\]/g

/** Counts every answer placeholder token ([gap], [match], [heading_match]) in a text. */
export function countAnswerTokens(text: unknown): number {
  if (!text || typeof text !== 'string') return 0
  return text.match(TOKEN_REGEX)?.length ?? 0
}

/**
 * Question types whose answer normally lives in a placeholder token
 * ([gap] / [match] / [heading_match]) instead of fixed numbering.
 */
const FILL_TYPES = new Set<string>([
  QuestionType.GAP_FILLING,
  QuestionType.MATCHING,
  QuestionType.MATCH_HEADING,
  QuestionType.DROP_DOWN,
])

interface NumberingNode {
  type: QuestionType | string
  content?: string | null
  children?: unknown[] | null
}

const hasChildNodes = (q: NumberingNode): boolean => Array.isArray(q.children) && q.children.length > 0

/**
 * A fill-type question (gap/matching/heading/dropdown) that has no token in its
 * own content, no children, and whose part content has no tokens either.
 * It is a single-answer question on its own (legacy CEFR layout, e.g.
 * "Paragraph I" headings or "Text 7" matching with a list of letters), so it
 * takes exactly one question number. Stores and processors must agree on this.
 */
export function isStandaloneFillQuestion(q: NumberingNode, partHasTokens: boolean): boolean {
  if (partHasTokens) return false
  if (!FILL_TYPES.has(String(q.type))) return false
  if (hasChildNodes(q)) return false
  return countAnswerTokens(q.content) === 0
}

/**
 * A fill-type question without tokens/children in a part whose content (passage)
 * does contain tokens: its answer lives in the passage dropzone/gap, so the
 * question itself takes no number (options holder or metadata duplicate).
 */
export function isPassageTokenQuestion(q: NumberingNode, partHasTokens: boolean): boolean {
  if (!partHasTokens) return false
  if (!FILL_TYPES.has(String(q.type))) return false
  if (hasChildNodes(q)) return false
  return countAnswerTokens(q.content) === 0
}

const hasOptionItems = (options: unknown): boolean =>
  (Array.isArray(options) && options.length > 0) ||
  (!!options && typeof options === 'object' && !Array.isArray(options) && Object.keys(options).length > 0)

/**
 * A reading part whose every answer is a gap/dropzone inside the passage and
 * whose questions carry nothing to display (no title, options or content) –
 * e.g. CEFR Part 1 gap text. Such a part is shown as a single full-width passage.
 */
export function isPassageOnlyPart(
  part:
    | { content?: string | null; questions?: Array<NumberingNode & { title?: string | null; options?: unknown }> }
    | null
    | undefined,
): boolean {
  if (!part || countAnswerTokens(part.content) === 0) return false
  return (part.questions ?? []).every(
    (q) => isPassageTokenQuestion(q, true) && !hasOptionItems(q.options) && !String(q.title ?? '').trim(),
  )
}

/** True when a processed question has nothing to render (passage-token metadata row). */
export function isBlankQuestion(q: {
  title?: string | null
  content?: string | null
  options?: unknown
  children?: unknown[] | null
}): boolean {
  return (
    !String(q.title ?? '').trim() &&
    !String(q.content ?? '').trim() &&
    !hasOptionItems(q.options) &&
    !(Array.isArray(q.children) && q.children.length > 0)
  )
}

export interface MatchOptionItem {
  /** Value stored as the answer (dict key, or the raw array value) */
  key: string
  /** Short label shown on badges/pills (A, B, iv...) */
  letter: string
  /** Descriptive text ('' when the option is just a label) */
  text: string
}

const SHORT_LABEL = /^[A-Za-z]{1,2}$|^[ivxlcdm]{1,6}$|^[IVXLCDM]{1,6}$|^\d{1,2}$/
const LABELLED_TEXT = /^\s*([A-Za-z]|[ivxlcdm]{1,6}|[IVXLCDM]{1,6})[).:]\s+(.+)$/s

/**
 * Normalises matching/heading options into { key, letter, text }.
 *
 * - Object options: key = object key (the backend answer is the key).
 * - Array options: key = the raw value (the backend compares values), so a
 *   list of letters ["A", ...] submits the letter and a list of texts submits
 *   the text. Duplicates are dropped; a pure list of letters is sorted.
 */
export function normalizeMatchOptions(options: unknown): MatchOptionItem[] {
  if (!options) return []

  if (Array.isArray(options)) {
    const seen = new Set<string>()
    const items: MatchOptionItem[] = []
    options.forEach((raw) => {
      const value = String(raw ?? '').trim()
      if (!value || seen.has(value)) return
      seen.add(value)
      if (SHORT_LABEL.test(value)) {
        items.push({ key: value, letter: value, text: '' })
        return
      }
      const labelled = value.match(LABELLED_TEXT)
      if (labelled) {
        items.push({ key: value, letter: labelled[1]!, text: labelled[2]!.trim() })
        return
      }
      items.push({ key: value, letter: String.fromCharCode(65 + items.length), text: value })
    })
    if (items.length > 0 && items.every((o) => !o.text && /^[A-Za-z]$/.test(o.letter))) {
      items.sort((a, b) => a.letter.localeCompare(b.letter))
    }
    return items
  }

  if (typeof options === 'object') {
    return Object.entries(options as Record<string, unknown>).map(([key, raw]) => {
      const value = String(raw ?? '').trim()
      if (value === key) return { key, letter: key, text: '' }
      // Drop a redundant "A) " / "A. " prefix that repeats the key
      const labelled = value.match(LABELLED_TEXT)
      const text = labelled && labelled[1] === key ? labelled[2]!.trim() : value
      return { key, letter: key, text }
    })
  }

  return []
}

/** Text shown inside a filled dropzone for an option: "D" or "D) a zoo keeper". */
export function matchOptionDisplay(opt: MatchOptionItem): string {
  return opt.text ? `${opt.letter}) ${opt.text}` : opt.letter
}

// Reusable span element for measuring text width
let measureSpan: HTMLSpanElement | null = null

const getMeasureSpan = (): HTMLSpanElement => {
  if (!measureSpan) {
    measureSpan = document.createElement('span')
    measureSpan.style.cssText = 'visibility:hidden;position:absolute;white-space:pre'
    document.body.appendChild(measureSpan)
  }
  return measureSpan
}

/**
 * Auto-resizes an input element based on its content
 * @param input The input element to resize
 */
export function autoResizeInput(input: HTMLInputElement): void {
  const minWidth = 80
  const padding = 20

  const span = getMeasureSpan()
  span.style.font = window.getComputedStyle(input).font
  span.textContent = input.value || input.placeholder || ''

  const textWidth = span.offsetWidth
  const newWidth = Math.max(minWidth, textWidth + padding)
  input.style.width = `${newWidth}px`
}

/**
 * Auto-resizes all gap inputs in a container
 * @param container The container element
 */
export function autoResizeAllInputs(container: HTMLElement | null): void {
  if (!container) return
  const inputs = container.querySelectorAll<HTMLInputElement>('.gap-input')
  inputs.forEach(autoResizeInput)
}

/**
 * Processes text containing [gap], [match] and [heading_match] tags and replaces
 * them with HTML elements. Tokens are numbered in the order they appear.
 *
 * Dropzones carry a `data-kind` attribute so that drag/drop keeps the two match
 * families separate: `match` dropzones only accept `match` options and
 * `heading` dropzones only accept `heading` options.
 *
 * @param text The raw text content
 * @param startCounter The starting number for the gaps/matches
 * @returns Object containing the processed HTML and the next counter value
 */
export function processQuestionText(
  text: string | null | unknown,
  startCounter: number,
): { html: string; nextCounter: number; tokens: Array<{ number: number; kind: 'gap' | 'match' | 'heading' }> } {
  if (!text || typeof text !== 'string') return { html: '', nextCounter: startCounter, tokens: [] }

  let counter = startCounter
  const tokens: Array<{ number: number; kind: 'gap' | 'match' | 'heading' }> = []

  // Sanitize server-supplied HTML before token replacement to prevent stored XSS
  let safeText = sanitizeHtml(text)

  // Remove awkward spacing before punctuation right after a gap (e.g. [gap] , -> [gap],)
  safeText = safeText.replace(/\[gap\]\s+([,.:;!?'")\]])/g, '[gap]$1')

  // Reset regex lastIndex for global pattern
  TOKEN_REGEX.lastIndex = 0

  const html = safeText.replace(TOKEN_REGEX, (token) => {
    counter++
    if (token === '[gap]') {
      tokens.push({ number: counter, kind: 'gap' })
      return `<input type="text" placeholder="${counter}" class="gap-input" data-gap="${counter}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`
    }
    const kind = token === '[heading_match]' ? 'heading' : 'match'
    tokens.push({ number: counter, kind })
    const extraClass = kind === 'heading' ? ' heading-dropzone' : ''
    const hintHtml = kind === 'heading' ? '<span class="dropzone-hint">Select or drop heading</span>' : ''
    return `<span class="match-dropzone${extraClass}" data-match="${counter}" data-gap="${counter}" data-kind="${kind}"><span class="match-number">${counter}</span><span class="match-value"></span>${hintHtml}</span>`
  })

  return { html, nextCounter: counter, tokens }
}

/**
 * Processes text containing [match] tags for dropdown questions and replaces them with select elements
 * @param text The raw text content
 * @param startCounter The starting number for the dropdowns
 * @param options The options for the dropdown (array or object)
 * @returns Object containing the processed HTML and the next counter value
 */
export function processDropdownText(
  text: string | null | unknown,
  startCounter: number,
  options: unknown,
): { html: string; nextCounter: number } {
  if (!text || typeof text !== 'string') return { html: '', nextCounter: startCounter }

  // Build options HTML once
  let optionsHtml = '<option value="">--</option>'
  if (Array.isArray(options)) {
    const optionParts: string[] = []
    for (let i = 0; i < options.length; i++) {
      const opt = escapeHtml(String(options[i]))
      optionParts.push(`<option value="${opt}">${opt}</option>`)
    }
    optionsHtml += optionParts.join('')
  } else if (options && typeof options === 'object') {
    const entries = Object.entries(options as Record<string, string>)
    const optionParts: string[] = []
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]!
      optionParts.push(`<option value="${escapeHtml(String(key))}">${escapeHtml(String(value))}</option>`)
    }
    optionsHtml += optionParts.join('')
  }

  // Sanitize server-supplied HTML before token replacement to prevent stored XSS
  const safeText = sanitizeHtml(text)

  let counter = startCounter
  // Reset regex lastIndex
  MATCH_REGEX.lastIndex = 0

  const html = safeText.replace(MATCH_REGEX, () => {
    counter++
    return `<span class="dropdown-wrapper"><select class="dropdown-select" data-gap="${counter}">${optionsHtml}</select></span>`
  })

  return { html, nextCounter: counter }
}

/** CSS.escape with a fallback for environments that lack it. */
export function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/["\\]/g, '\\$&')
}

/** Question block that owns both a dropzone and its option bank (per-question banks). */
export const OPTION_SCOPE_SELECTOR = '.question-item, .matching-group-container, .mg-container'

/**
 * Finds the draggable options for an option key. When the dropzone sits in a
 * question block with its own option bank, only that bank is used (so the same
 * option in another question's bank stays available); otherwise (e.g. reading
 * heading dropzones in the passage) the whole document is searched.
 */
export function findMatchOptions(
  root: ParentNode,
  key: string,
  kind: string | null,
  zone?: HTMLElement | null,
): HTMLElement[] {
  const kindSelector = kind ? `[data-kind="${cssEscape(kind)}"]` : ''
  const selector = `.draggable-option[data-option-key="${cssEscape(key)}"]${kindSelector}`
  const scope = zone?.closest<HTMLElement>(OPTION_SCOPE_SELECTOR)
  if (scope) {
    const scoped = Array.from(scope.querySelectorAll<HTMLElement>(selector))
    if (scoped.length > 0) return scoped
  }
  return Array.from(root.querySelectorAll<HTMLElement>(selector))
}

/**
 * Restores saved answer values to gap inputs and match dropzones in a container
 * @param container The HTML element containing the inputs/dropzones
 * @param answers The answers record from the store
 * @param usedClass The CSS class to apply to used draggable options
 */
export function restoreAnswersInContainer(
  container: HTMLElement | null,
  answers: Record<string | number, string | number>,
  usedClass: string = 'used',
): void {
  if (!container) return

  // Reset all options to visible
  const allOptions = container.querySelectorAll<HTMLElement>('.draggable-option')
  for (let i = 0; i < allOptions.length; i++) {
    allOptions[i]!.classList.remove(usedClass)
  }

  // Restore gap inputs
  const inputs = container.querySelectorAll<HTMLInputElement>('.gap-input')
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!
    const gapNumber = input.dataset.gap
    if (!gapNumber) continue

    const gapId = parseInt(gapNumber, 10)
    const savedValue = answers[gapId]
    if (savedValue !== undefined) {
      input.value = String(savedValue)
      if (input.value.trim().length > 0) {
        input.classList.add('has-value')
      } else {
        input.classList.remove('has-value')
      }
    } else {
      input.classList.remove('has-value')
    }
  }

  // Restore match dropzones. The stored answer is always the option KEY; the
  // text shown in the box comes from the option's data-option-display (or the
  // key itself) and the key is kept on the dropzone as data-stored-key so a
  // later drag/clear never mistakes the display text for the answer.
  const rootDoc = container.ownerDocument || document
  const findOptions = (key: string, kind: string, zone?: HTMLElement): HTMLElement[] =>
    findMatchOptions(rootDoc, key, kind, zone)

  const dropzones = container.querySelectorAll<HTMLElement>('.match-dropzone')
  for (let i = 0; i < dropzones.length; i++) {
    const dropzone = dropzones[i]!
    const matchNumber = dropzone.dataset.match
    if (!matchNumber) continue

    const matchId = parseInt(matchNumber, 10)
    const savedValue = answers[matchId]
    const valueEl = dropzone.querySelector('.match-value')
    if (!valueEl) continue

    const savedStr = savedValue === undefined || savedValue === null ? '' : String(savedValue)
    if (savedStr !== '') {
      const kind = dropzone.dataset.kind ?? 'match'
      const option = findOptions(savedStr, kind, dropzone)[0]
      valueEl.textContent = option?.dataset.optionDisplay || savedStr
      dropzone.dataset.storedKey = savedStr
      dropzone.classList.add('has-value')
    } else {
      valueEl.textContent = ''
      delete dropzone.dataset.storedKey
      dropzone.classList.remove('has-value')
    }
  }

  // Mark options as used for every filled dropzone on the page (options and
  // dropzones may live in different panels, e.g. reading headings).
  const filledZones = rootDoc.querySelectorAll<HTMLElement>('.match-dropzone.has-value')
  for (let i = 0; i < filledZones.length; i++) {
    const zone = filledZones[i]!
    const key = zone.dataset.storedKey
    if (!key) continue
    findOptions(key, zone.dataset.kind ?? 'match', zone).forEach((opt) => opt.classList.add(usedClass))
  }

  // Restore dropdown selects
  const dropdowns = container.querySelectorAll<HTMLSelectElement>('.dropdown-select')
  for (let i = 0; i < dropdowns.length; i++) {
    const dropdown = dropdowns[i]!
    const gapNumber = dropdown.dataset.gap
    if (!gapNumber) continue

    const gapId = parseInt(gapNumber, 10)
    const savedValue = answers[gapId]
    if (savedValue !== undefined) {
      dropdown.value = String(savedValue)
    }
  }
}

/**
 * Applies the standard IELTS question-numbering rules (true/false-not-given,
 * yes/no-not-given, multiple choice and matching-information) to a processed
 * question, mutating it in place, and returns the updated running gap counter.
 *
 * Shared between the listening and reading question processors; any
 * section-specific numbering rules (e.g. reading's statement-style MATCHING)
 * should be layered on top by the caller.
 *
 * @param question The raw question being processed
 * @param processedQuestion The output question object to annotate
 * @param globalGapCounter The running gap/question counter
 * @returns The updated running gap counter
 */
export function applyQuestionNumbering(
  question: { type: QuestionType | string; answers_count?: number; children?: unknown[] },
  processedQuestion: ProcessedQuestion,
  globalGapCounter: number,
): number {
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
  } else if (question.type === QuestionType.MATCHING_INFORMATION) {
    const hasChildren = Array.isArray(question.children) && question.children.length > 0
    if (!hasChildren) {
      globalGapCounter++
      processedQuestion.questionNumber = globalGapCounter
      processedQuestion.displayNumber = String(globalGapCounter)
    }
  }

  return globalGapCounter
}

/**
 * Wires up gap-input and dropdown-select change delegation on a container,
 * persisting edits via `updateAnswer`. Shared between the listening and
 * reading question processors.
 *
 * @param container The container element to listen on
 * @param updateAnswer Callback that persists a single answer for a gap
 * @returns The handlers that were attached, in case the caller needs them
 */
export function attachGapInputListeners(
  container: HTMLElement | null,
  updateAnswer: (gap: number, value: string) => void,
): { handleGapInput: (e: Event) => void; handleDropdownChange: (e: Event) => void } {
  const handleGapInput = (e: Event): void => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains('gap-input')) return

    const gap = target.dataset.gap
    if (gap) {
      updateAnswer(parseInt(gap, 10), target.value)
    }
    if (target.value.trim().length > 0) {
      target.classList.add('has-value')
    } else {
      target.classList.remove('has-value')
    }
    autoResizeInput(target)
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLInputElement
    if (!target.classList.contains('gap-input')) return

    if (e.key === 'Enter') {
      e.preventDefault()
      if (!container) return
      const allInputs = Array.from(container.querySelectorAll<HTMLInputElement>('.gap-input'))
      const currentIndex = allInputs.indexOf(target)
      if (currentIndex !== -1) {
        if (e.shiftKey) {
          const prev = allInputs[currentIndex - 1]
          if (prev) {
            prev.focus()
            prev.select()
          }
        } else {
          const next = allInputs[currentIndex + 1]
          if (next) {
            next.focus()
            next.select()
          }
        }
      }
    }
  }

  const handleDropdownChange = (e: Event): void => {
    const target = e.target as HTMLSelectElement
    if (!target.classList.contains('dropdown-select')) return

    const gap = target.dataset.gap
    if (gap) {
      updateAnswer(parseInt(gap, 10), target.value)
    }
  }

  if (container) {
    container.addEventListener('input', handleGapInput)
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('change', handleDropdownChange)
  }

  return { handleGapInput, handleDropdownChange }
}
