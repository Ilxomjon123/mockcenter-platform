export interface WritingAnswers {
  part1: string
  part2: string
}

export interface WritingTestRaw {
  id: number
  type: 'writing'
  title: string
  created_at?: string
  updated_at?: string
  parts: Array<{
    id: number
    section_type: 'writing'
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
      parent_id?: number | null
      created_at?: string
      updated_at?: string
    }>
  }>
}

export interface WritingPrompt {
  title: string
  content: string
}

export interface WritingState {
  currentPage: number
  answers: WritingAnswers
  test?: WritingTestRaw
  prompts?: WritingPrompt[]
}
