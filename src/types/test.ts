export enum QuestionType {
  PARENT = 'parent',
  GAP_FILLING = 'gap_filling',
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  TRUE_FALSE_NOT_GIVEN = 'true_false_not_given',
  YES_NO_NOT_GIVEN = 'yes_no_not_given',
}

export interface QuestionRaw {
  id: number
  part_id?: number
  type: QuestionType | string
  order: number
  title: string | null
  name: string | null
  options_title: string | null
  options: unknown | null
  content: string | null
  answers?: unknown | null
  answers_count?: number
  parent_id?: number | null
  children?: QuestionRaw[]
  created_at?: string
  updated_at?: string
}

// Processed question with additional computed properties
export interface ProcessedQuestion extends Omit<QuestionRaw, 'children'> {
  questionNumber?: number
  displayNumber?: string
  processedContent?: string
  children?: ProcessedQuestion[]
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
