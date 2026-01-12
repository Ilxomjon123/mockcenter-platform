import type { SectionWithPartsRaw } from './test'

export interface ListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  answers: Record<number, string | number>
  test?: SectionWithPartsRaw
}
