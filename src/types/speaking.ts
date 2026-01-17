import type { ProcessedQuestion } from './test'

export enum SpeakingPart {
  PART_1 = 'part_1',
  PART_2 = 'part_2',
  PART_3 = 'part_3',
}

export interface SpeakingQuestion extends ProcessedQuestion {
  speaking_part: SpeakingPart
  time_limit_seconds?: number
  preparation_time_seconds?: number // For Part 2
  prompt_text?: string // For Part 2
}

export interface SpeakingRecording {
  id: number
  user_id: number
  exam_id: number
  question_id: number
  speaking_part: SpeakingPart
  audio_url: string
  duration_seconds: number
  uploaded_at: string
}

export interface SpeakingFeedback {
  id: number
  recording_id: number
  band_score: number
  fluency_band: number
  lexical_resource_band: number
  grammatical_range_band: number
  pronunciation_band: number
  ai_feedback: string
  examiner_comments?: string
  created_at: string
}

export interface SpeakingState {
  currentPart: SpeakingPart
  currentQuestionIndex: number
  recordings: Map<number, Blob>
  isRecording: boolean
  recordingStartTime: number | null
  elapsedSeconds: number
  questions: SpeakingQuestion[]
}

export enum RecordingState {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RECORDING = 'recording',
  REVIEWING = 'reviewing',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
}
