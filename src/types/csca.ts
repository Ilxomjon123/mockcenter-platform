export interface CscaQuestion {
  id: number
  topic: string
  title: string
  options: Record<string, string>
  order: number
}

export interface CscaSubjectSession {
  session_id: number
  subject: string
  total_questions: number
  questions: CscaQuestion[]
  started_at?: number
  submitted_at?: string | number | null
  score?: number | null
  correct_count?: number | null
  answers?: Record<number, string>
  result?: CscaSubjectResult
}

export interface CscaTestResponse {
  subjects: CscaSubjectSession[]
  total_subjects: number
}

export interface CscaSubjectResult {
  session_id: number
  subject: string
  correct_count: number
  total_questions: number
  score: number
}

export interface CscaSubmitSessionResponse {
  message: string
  result: CscaSubjectResult
  all_submitted: boolean
}

export const CSCA_SUBJECT_DURATION_MINUTES = 60

export const CSCA_SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
}
