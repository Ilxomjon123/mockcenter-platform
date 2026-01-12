export interface Question {
  id: number
  type: 'true-false-not-given' | 'multiple-choice' | 'fill-blank' | 'matching'
  text: string
  options?: string[]
  answer?: string | number
}

export interface Passage {
  id: number
  title: string
  content: string
  questions: Question[]
}

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
      content: unknown | null
      answers?: unknown | null
      parent_id?: number | null
      created_at?: string
      updated_at?: string
    }>
  }>
}

export interface ReadingState {
  currentPart: number
  passages: Passage[]
  answers: Record<number, string | number>
  test?: ReadingTestRaw
}
