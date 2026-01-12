export type BackendQuestionType =
  | 'multiple_choice'
  | 'sentence_completion'
  | 'matching'
  | 'matching_sentence_endings'
  | 'matching_information'
  | 'flow_chart_completion'
  | 'plan_map_diagram'
  | 'diagram_labelling'
  | 'short_answer_questions'
  | 'summary_completion'
  | 'speaking'
  | 'writing'

export interface QuestionRaw {
  id: number
  part_id?: number
  type: BackendQuestionType | string
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
}

export interface PartRaw {
  id: number
  section_type: 'listening' | 'reading' | 'writing' | 'speaking'
  order: number
  title: string
  content: string | null
  comment: string | null
  file: string | null
  created_at?: string
  updated_at?: string
  pivot?: { section_id: number; part_id: number }
  questions: QuestionRaw[]
}

export interface SectionWithPartsRaw {
  id: number
  type: 'listening' | 'reading' | 'writing' | 'speaking'
  title: string
  created_at?: string
  updated_at?: string
  parts: PartRaw[]
}

export interface ExamTestRaw {
  id: number
  title: string
  listening_id?: number
  reading_id?: number
  writing_id?: number
  speaking_id?: number
  created_at?: string
  updated_at?: string
  listening: SectionWithPartsRaw
  reading: SectionWithPartsRaw
  writing: SectionWithPartsRaw
  speaking: SectionWithPartsRaw
}
