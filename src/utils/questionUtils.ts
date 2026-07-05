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
): { html: string; nextCounter: number } {
  if (!text || typeof text !== 'string') return { html: '', nextCounter: startCounter }

  let counter = startCounter

  // Sanitize server-supplied HTML before token replacement to prevent stored XSS
  const safeText = sanitizeHtml(text)

  // Reset regex lastIndex for global pattern
  TOKEN_REGEX.lastIndex = 0

  const html = safeText.replace(TOKEN_REGEX, (token) => {
    counter++
    if (token === '[gap]') {
      return `<input type="text" placeholder="${counter}" class="gap-input" data-gap="${counter}">`
    }
    const kind = token === '[heading_match]' ? 'heading' : 'match'
    const extraClass = kind === 'heading' ? ' heading-dropzone' : ''
    return `<span class="match-dropzone${extraClass}" data-match="${counter}" data-gap="${counter}" data-kind="${kind}"><span class="match-number">${counter}</span><span class="match-value"></span></span>`
  })

  return { html, nextCounter: counter }
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
    }
  }

  // Restore match dropzones and hide used options
  const dropzones = container.querySelectorAll<HTMLElement>('.match-dropzone')
  for (let i = 0; i < dropzones.length; i++) {
    const dropzone = dropzones[i]!
    const matchNumber = dropzone.dataset.match
    if (!matchNumber) continue

    const matchId = parseInt(matchNumber, 10)
    const savedValue = answers[matchId]
    const valueEl = dropzone.querySelector('.match-value')
    if (savedValue !== undefined && valueEl) {
      valueEl.textContent = String(savedValue)
      dropzone.classList.add('has-value')

      // Only mark the used option within the same kind family so that an
      // identical option value in the other family stays available.
      const kind = dropzone.dataset.kind ?? 'match'
      const usedOption = container.querySelector(
        `.draggable-option[data-option-key="${savedValue}"][data-kind="${kind}"]`,
      ) as HTMLElement
      if (usedOption) {
        usedOption.classList.add(usedClass)
      }
    }
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
    autoResizeInput(target)
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
    container.addEventListener('change', handleDropdownChange)
  }

  return { handleGapInput, handleDropdownChange }
}
