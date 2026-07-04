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

/**
 * Sanitizes HTML by removing potentially dangerous tags and attributes
 * Allows only safe tags: p, br, h1-h6, ul, ol, li, strong, em
 * @param html - The HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  // List of allowed tags
  const allowedTags = ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i']

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '')

  // Remove any tags not in allowedTags
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Remove any attributes except safe ones
      return match.replace(/\s+(?!\/?>)[a-z-]+=["'][^"']*["']/gi, '')
    }
    return ''
  })

  return sanitized
}
