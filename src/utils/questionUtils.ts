/**
 * Common utilities for processing IELTS exam questions (Listening and Reading)
 */

// Pre-compiled regex patterns for better performance
const GAP_REGEX = /\[gap\]/g
const MATCH_REGEX = /\[match\]/g

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
 * Processes text containing [gap] and [match] tags and replaces them with HTML elements
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

  // Reset regex lastIndex for global patterns
  GAP_REGEX.lastIndex = 0
  MATCH_REGEX.lastIndex = 0

  const html = text
    .replace(GAP_REGEX, () => {
      counter++
      return `<input type="text" placeholder="${counter}" class="gap-input" data-gap="${counter}">`
    })
    .replace(MATCH_REGEX, () => {
      counter++
      return `<span class="match-dropzone" data-match="${counter}" data-gap="${counter}"><span class="match-number">${counter}</span><span class="match-value"></span></span>`
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
      const opt = options[i]
      optionParts.push(`<option value="${opt}">${opt}</option>`)
    }
    optionsHtml += optionParts.join('')
  } else if (options && typeof options === 'object') {
    const entries = Object.entries(options as Record<string, string>)
    const optionParts: string[] = []
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]!
      optionParts.push(`<option value="${key}">${value}</option>`)
    }
    optionsHtml += optionParts.join('')
  }

  let counter = startCounter
  // Reset regex lastIndex
  MATCH_REGEX.lastIndex = 0

  const html = text.replace(MATCH_REGEX, () => {
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

      const usedOption = container.querySelector(
        `.draggable-option[data-option-key="${savedValue}"]`,
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
