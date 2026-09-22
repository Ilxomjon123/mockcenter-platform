/**
 * HTML Sanitization utilities to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/** Formatting / layout tags that are kept (with filtered attributes). */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark', 'blockquote',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'figure', 'figcaption', 'img',
])

/**
 * Tags that are dropped together with everything inside them. Any other tag
 * that is not allowed is unwrapped (its text/children are kept), which matches
 * the previous regex sanitizer that only stripped the tag markup.
 */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'template', 'noscript', 'iframe', 'frame', 'frameset', 'object', 'embed',
  'applet', 'svg', 'math', 'select', 'option', 'optgroup', 'textarea', 'input', 'button', 'form',
  'audio', 'video', 'source', 'track', 'canvas', 'link', 'meta', 'base', 'title', 'head',
])

/** Attributes allowed on any allowed tag. */
const GLOBAL_ATTRS = new Set(['class', 'style', 'title', 'lang', 'dir'])

/** Extra attributes allowed per tag. URL-valued ones are validated separately. */
const TAG_ATTRS: Record<string, Set<string>> = {
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan', 'align']),
  th: new Set(['colspan', 'rowspan', 'align', 'scope']),
  ol: new Set(['start', 'type']),
  table: new Set(['border', 'cellpadding', 'cellspacing']),
}

/**
 * Class names the exam UI uses as interaction hooks (drag/drop, gap inputs).
 * Server content must not be able to impersonate them, otherwise a crafted
 * element could act as a fake dropzone/option.
 */
const RESERVED_CLASSES = new Set([
  'gap-input', 'match-dropzone', 'match-value', 'match-number', 'heading-dropzone',
  'draggable-option', 'dropdown-select', 'dropdown-wrapper', 'drag-ghost',
])

/** Image sources: http(s), protocol-relative, root/relative paths, raster data URIs. */
const SAFE_IMG_SRC = /^(?:https?:\/\/|\/\/|\/(?!\/)|\.{1,2}\/|[\w-][\w\-./]*$|data:image\/(?:png|jpe?g|gif|webp);base64,)/i

/** CSS constructs that can load resources or execute code. */
const DANGEROUS_CSS = /url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behavior\s*:|-moz-binding|\\/i

const isSafeImgSrc = (value: string): boolean => {
  // Strip ASCII control chars/whitespace browsers ignore inside URLs ("java\tscript:")
  const compact = value.replace(/[\x00-\x20]/g, '')
  if (!compact) return false
  return SAFE_IMG_SRC.test(compact)
}

const sanitizeStyle = (value: string): string | null => {
  if (DANGEROUS_CSS.test(value)) return null
  // Drop fixed/sticky positioning so content cannot overlay the exam UI.
  const kept = value
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => decl && !/^position\s*:\s*(?:fixed|sticky)/i.test(decl))
  return kept.length ? kept.join('; ') : null
}

const sanitizeClass = (value: string): string | null => {
  const kept = value.split(/\s+/).filter((c) => c && !RESERVED_CLASSES.has(c))
  return kept.length ? kept.join(' ') : null
}

const sanitizeElementAttributes = (el: Element, tag: string): void => {
  const tagAttrs = TAG_ATTRS[tag]
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    const allowed = GLOBAL_ATTRS.has(name) || (tagAttrs?.has(name) ?? false)
    if (!allowed) {
      el.removeAttribute(attr.name)
      continue
    }

    let next: string | null = attr.value
    if (name === 'style') next = sanitizeStyle(attr.value)
    else if (name === 'class') next = sanitizeClass(attr.value)
    else if (name === 'src') next = isSafeImgSrc(attr.value) ? attr.value.trim() : null

    if (next === null) el.removeAttribute(attr.name)
    else if (next !== attr.value) el.setAttribute(attr.name, next)
  }

  if (tag === 'img' && !el.hasAttribute('src')) {
    el.remove()
  }
}

const sanitizeNode = (parent: Node): void => {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType !== Node.ELEMENT_NODE) {
      // Comments, processing instructions, CDATA...
      child.parentNode?.removeChild(child)
      continue
    }

    const el = child as Element
    const tag = el.localName.toLowerCase()

    if (DROP_WITH_CONTENT.has(tag) || el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      el.remove()
      continue
    }

    // Sanitize descendants first so unwrapped children are already clean.
    sanitizeNode(el)

    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }

    sanitizeElementAttributes(el, tag)
  }
}

/**
 * Sanitizes server-supplied HTML with an allowlist of formatting tags and
 * attributes. Uses the browser's own HTML parser (inert DOMParser document:
 * no scripts run, no images load) so there is no parser differential between
 * what is checked and what is rendered.
 *
 * - Kept tags: text formatting, headings, lists, div/span, tables, img.
 * - Kept attributes: class (minus the app's interaction hooks), style (no url()/expression()
 *   or fixed positioning), title/lang/dir, table spans, and img src/alt/width/height.
 * - img src must be http(s), protocol-relative, a relative path or a raster data URI.
 * - Scripts, styles, frames, forms, SVG/MathML and event handlers are removed.
 *
 * Placeholder tokens such as [gap] / [match] are plain text and survive untouched.
 *
 * @param html - The HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  // No markup at all: nothing to sanitize (keeps entities/text exactly as authored).
  if (!/[<>]/.test(html)) return html

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body
  if (!body) return ''
  sanitizeNode(body)
  return body.innerHTML
}
