export interface ReadingTestRaw {
  id: number
  type: 'reading'
  title: string
  created_at?: string
  updated_at?: string
  parts: Array<{
    id: number
    section_type: 'reading'
    order: number
    title: string
    content: string | null
    comment: string | null
    file: string | null
    created_at?: string
    updated_at?: string
    questions: Array<{
      id: number
      part_id?: number
      type: string
      order: number
      title: string | null
      name: string | null
      options_title: string | null
      options: unknown | null
      content: string | null
      answers?: unknown | null
      answers_count?: number
      parent_id?: number | null
      children?: Array<{
        id: number
        type: string
        order: number
        title: string | null
        name: string | null
        options: unknown | null
        content: string | null
        answers_count?: number
      }>
      created_at?: string
      updated_at?: string
    }>
  }>
}

export interface HighlightItem {
  id: string
  text: string
  color: string
  startIndex: number
  endIndex: number
}

export interface ReadingState {
  currentPart: number
  answers: Record<number, string | number>
  test?: ReadingTestRaw
  highlights: Record<number, HighlightItem[] | string>
}
