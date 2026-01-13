import type { SectionWithPartsRaw } from './test'

export interface ListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  currentAudioTime: number
  hasStarted: boolean
  answers: Record<string | number, string | number>
  test?: SectionWithPartsRaw
}
