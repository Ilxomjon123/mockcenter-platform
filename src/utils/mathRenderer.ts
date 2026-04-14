import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Delimiter {
  left: string
  right: string
  display: boolean
}

const DELIMITERS: Delimiter[] = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false },
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Render LaTeX math in a string, returning HTML.
 * Scans for $$…$$, \[…\], \(…\), $…$ delimiters and renders them with KaTeX.
 * Text outside delimiters is returned as-is (caller is responsible for sanitization).
 */
export function renderMathInString(input: string): string {
  if (!input) return ''

  let result = ''
  let i = 0
  const len = input.length

  while (i < len) {
    let matched = false

    for (const delim of DELIMITERS) {
      if (input.startsWith(delim.left, i)) {
        const endIdx = input.indexOf(delim.right, i + delim.left.length)
        if (endIdx !== -1) {
          const math = input.slice(i + delim.left.length, endIdx)
          try {
            result += katex.renderToString(math, {
              displayMode: delim.display,
              throwOnError: false,
              output: 'html',
              strict: 'ignore',
            })
          } catch {
            result += escapeHtml(delim.left + math + delim.right)
          }
          i = endIdx + delim.right.length
          matched = true
          break
        }
      }
    }

    if (!matched) {
      result += input[i]
      i++
    }
  }

  return result
}

/**
 * Render LaTeX inside an already-rendered HTML string.
 *
 * Recognized formats:
 *   1. <span class="math-tex" data-latex="LATEX">...</span>  ← canonical (TinyMCE-compatible)
 *   2. Inline delimiters in text nodes: $...$, $$...$$, \(...\), \[...\]
 *
 * The canonical format is preferred — it survives TinyMCE round-trips and is
 * what the seeder writes. The delimiter fallback exists for legacy/manually-typed
 * math content.
 */
export function renderMathInHtml(html: string): string {
  if (!html) return ''

  // Quick path: no math markers at all
  if (
    !html.includes('math-tex') &&
    !html.includes('$') &&
    !html.includes('\\(') &&
    !html.includes('\\[')
  ) {
    return html
  }

  const container = document.createElement('div')
  container.innerHTML = html

  // 1. Render canonical math-tex spans first.
  renderMathTexSpans(container)

  // 2. Then walk remaining text nodes for delimiter-style math.
  walkTextNodes(container)

  return container.innerHTML
}

/**
 * Replace each <span class="math-tex" data-latex="..."> with KaTeX-rendered HTML.
 * The display mode is detected via data-display="block" (defaults to inline).
 */
function renderMathTexSpans(root: Element): void {
  const spans = root.querySelectorAll<HTMLElement>('span.math-tex[data-latex]')
  spans.forEach((span) => {
    const latex = span.getAttribute('data-latex') || ''
    const displayMode = span.getAttribute('data-display') === 'block'
    try {
      const rendered = katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'html',
        strict: 'ignore',
      })
      const wrapper = document.createElement('span')
      wrapper.className = 'math-tex'
      wrapper.innerHTML = rendered
      span.replaceWith(wrapper)
    } catch {
      // Leave the original span untouched on failure
    }
  })
}

function walkTextNodes(node: Node): void {
  const children = Array.from(node.childNodes)
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (
        text.includes('$') ||
        text.includes('\\(') ||
        text.includes('\\[')
      ) {
        const rendered = renderMathInString(text)
        if (rendered !== text) {
          const span = document.createElement('span')
          span.innerHTML = rendered
          child.parentNode?.replaceChild(span, child)
        }
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element
      // Skip already-rendered KaTeX nodes (and our own wrappers)
      if (el.classList?.contains('katex')) continue
      if (el.classList?.contains('math-tex')) continue
      walkTextNodes(el)
    }
  }
}
