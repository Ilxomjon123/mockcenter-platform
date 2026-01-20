/**
 * Common utilities for processing IELTS exam questions (Listening and Reading)
 */

/**
 * Auto-resizes an input element based on its content
 * @param input The input element to resize
 */
export function autoResizeInput(input: HTMLInputElement): void {
  const minWidth = 80
  const padding = 20 // Account for padding

  // Create a temporary span to measure text width
  const span = document.createElement('span')
  span.style.visibility = 'hidden'
  span.style.position = 'absolute'
  span.style.whiteSpace = 'pre'
  span.style.font = window.getComputedStyle(input).font
  span.textContent = input.value || input.placeholder || ''

  document.body.appendChild(span)
  const textWidth = span.offsetWidth
  document.body.removeChild(span)

  // Set the width based on content, with min and max constraints
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
  startCounter: number
): { html: string; nextCounter: number } {
  if (!text || typeof text !== 'string') return { html: '', nextCounter: startCounter }

  let counter = startCounter
  const html = text
    .replace(/\[gap\]/g, () => {
      counter++
      return `<input type="text" placeholder="${counter}" class="gap-input" data-gap="${counter}">`
    })
    .replace(/\[match\]/g, () => {
      counter++
      return `<span class="match-dropzone" draggable="true" data-match="${counter}" data-gap="${counter}"><span class="match-number">${counter}</span><span class="match-value"></span></span>`
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
  usedClass: string = 'used'
): void {
  if (!container) return

  // Reset all options to visible
  const allOptions = container.querySelectorAll<HTMLElement>('.draggable-option')
  allOptions.forEach((opt) => opt.classList.remove(usedClass))

  // Restore gap inputs
  const inputs = container.querySelectorAll<HTMLInputElement>('.gap-input')
  inputs.forEach((input) => {
    const gapNumber = input.dataset.gap
    if (!gapNumber) return

    const gapId = parseInt(gapNumber, 10)
    const savedValue = answers[gapId]
    if (savedValue !== undefined) {
      input.value = String(savedValue)
    }
  })

  // Restore match dropzones and hide used options
  const dropzones = container.querySelectorAll<HTMLElement>('.match-dropzone')
  dropzones.forEach((dropzone) => {
    const matchNumber = dropzone.dataset.match
    if (!matchNumber) return

    const matchId = parseInt(matchNumber, 10)
    const savedValue = answers[matchId]
    const valueEl = dropzone.querySelector('.match-value')
    if (savedValue !== undefined && valueEl) {
      valueEl.textContent = String(savedValue)
      dropzone.classList.add('has-value')

      const usedOption = container.querySelector(
        `.draggable-option[data-option-key="${savedValue}"]`
      ) as HTMLElement
      if (usedOption) {
        usedOption.classList.add(usedClass)
      }
    }
  })
}
