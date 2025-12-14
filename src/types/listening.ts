export interface ListeningQuestion {
  id: number
  type: 'true-false-not-given' | 'multiple-choice' | 'fill-blank'
  text: string
  options?: string[]
}

export interface ListeningSection {
  id: number
  title: string
  instructions: string
  audioUrl?: string
  questions: ListeningQuestion[]
}

export interface ListeningState {
  text: string
  currentSection: number
  currentQuestion: number
  sections: ListeningSection[]
  answers: Record<number, string | number>
  test?: ListeningTestRaw
}

// Backend structures (as provided)
export type BackendQuestionType =
  | 'multiple_choice'
  | 'sentence_completion'
  | 'matching'
  | 'flow_chart_completion'
  | 'plan_map_diagram'
  | 'diagram_labelling'
  | 'summary_completion'
  | 'speaking'
  | 'writing'

export interface ListeningQuestionRaw {
  id: number
  part_id: number
  type: BackendQuestionType
  order: number
  title: string | null
  name: string | null
  options_title: string | null
  options: unknown | null
  content: unknown | null
  answers: unknown | null
  parent_id: number | null
  created_at: string
  updated_at: string
}

export interface ListeningPartRaw {
  id: number
  section_type: 'listening'
  order: number
  title: string
  content: string | null
  comment: string | null
  file: string | null
  created_at: string
  updated_at: string
  pivot: { section_id: number; part_id: number }
  questions: ListeningQuestionRaw[]
}

export interface ListeningTestRaw {
  id: number
  type: 'listening'
  title: string
  created_at: string
  updated_at: string
  parts: ListeningPartRaw[]
}
