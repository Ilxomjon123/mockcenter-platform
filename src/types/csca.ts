export interface SubQuestionItem {
  key?: string
  title?: string
  title_ru?: string
  label?: string
  label_ru?: string
  points?: number
}

export type SubQuestionRecord = Record<string, SubQuestionItem>

export interface CscaQuestion {
  id: number
  topic: string
  type?: 'single' | 'single_choice' | 'matching' | 'open' | 'essay'
  title: string
  title_ru?: string
  options?: Record<string, string> | null
  options_ru?: Record<string, string> | null
  points?: number
  sub_questions?: SubQuestionRecord | SubQuestionItem[] | null
  order: number
}

export interface CscaSubjectSession {
  session_id: number
  subject: string
  /** Human-readable subject name resolved by the backend (falls back to the local map). */
  subject_label?: string
  /** Per-subject time limit in minutes, resolved by the backend. */
  duration_minutes?: number
  /** Maximum attainable score for this subject. */
  max_score?: number
  total_questions: number
  questions: CscaQuestion[]
  started_at?: number
  submitted_at?: string | number | null
  score?: number | null
  correct_count?: number | null
  answers?: Record<number, string | Record<string, string>>
  result?: CscaSubjectResult
}

export interface CscaTestResponse {
  /** Exam type this session belongs to ('csca', 'national', ...). */
  exam_type?: string
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

/** Fallback when the backend does not send `duration_minutes`. */
export const CSCA_SUBJECT_DURATION_MINUTES = 60

/**
 * Exam types that use the subject-based flow (/api/exam/subject/*).
 * Keep in sync with ExamTypeEnum::isSubjectBased() on the backend.
 */
export const SUBJECT_BASED_EXAM_TYPES = ['csca', 'national', 'driving_license'] as const

export const isSubjectBasedExam = (examType?: string | null): boolean =>
  !!examType && (SUBJECT_BASED_EXAM_TYPES as readonly string[]).includes(examType)

/**
 * Local fallback labels. The backend sends `subject_label` for every subject,
 * so this map only covers the case where an older cached payload is restored.
 */
export const CSCA_SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  matematika: 'Matematika',
  fizika: 'Fizika',
  kimyo: 'Kimyo',
  biologiya: 'Biologiya',
  ingliz_tili: 'Ingliz tili',
  tarix: 'Tarix',
  geografiya: 'Geografiya',
  ona_tili: "O'zbek tili va adabiyoti",
  rus_tili: 'Rus tili va adabiyoti',
  qoraqalpoq_tili: 'Qoraqalpoq tili va adabiyoti',
  huquqshunoslik: 'Huquqshunoslik',
  b_category: 'B toifa (Yengil avtomobil)',
  a_category: 'A toifa (Mototsikl)',
  c_category: 'C toifa (Yuk avtomobili)',
  d_category: 'D toifa (Avtobus)',
}

const SUBJECT_ICONS: Record<string, string> = {
  math: '📐',
  physics: '⚛️',
  chemistry: '🧪',
  matematika: '📐',
  fizika: '⚛️',
  kimyo: '🧪',
  biologiya: '🧬',
  ingliz_tili: '🇬🇧',
  tarix: '🏛️',
  geografiya: '🌍',
  ona_tili: '📖',
  rus_tili: '📚',
  b_category: '🚗',
  a_category: '🏍️',
  c_category: '🚚',
  d_category: '🚌',
  qoraqalpoq_tili: '📕',
  huquqshunoslik: '⚖️',
}

const SUBJECT_COLORS: Record<string, string> = {
  math: 'blue',
  physics: 'purple',
  chemistry: 'emerald',
  matematika: 'blue',
  fizika: 'purple',
  kimyo: 'emerald',
  biologiya: 'emerald',
  ingliz_tili: 'blue',
  tarix: 'amber',
  geografiya: 'emerald',
  ona_tili: 'purple',
  rus_tili: 'indigo',
  qoraqalpoq_tili: 'teal',
  huquqshunoslik: 'amber',
}

/** Prefer the backend-supplied label; fall back to the local map, then the raw slug. */
export const subjectLabelOf = (session: Pick<CscaSubjectSession, 'subject' | 'subject_label'>): string =>
  session.subject_label || CSCA_SUBJECT_LABELS[session.subject] || session.subject

export const subjectIconOf = (subject: string): string => SUBJECT_ICONS[subject] || '📘'

export const subjectColorOf = (subject: string): string => SUBJECT_COLORS[subject] || 'blue'

export const subjectDurationOf = (
  session: Pick<CscaSubjectSession, 'duration_minutes'> | null | undefined,
): number => session?.duration_minutes || CSCA_SUBJECT_DURATION_MINUTES
