import type { SectionWithPartsRaw } from './test'

export interface ListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  currentAudioTime: number
  hasStarted: boolean
  isCompleted: boolean
  isManualSubmit: boolean
  isInTransferTime: boolean
  transferTimeEnd: number | null
  answers: Record<string | number, string | number>
  test?: SectionWithPartsRaw
  questionHighlights: Record<string | number, string>
}
