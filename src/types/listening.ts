import type { SectionWithPartsRaw } from './test'

export interface ListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  answers: Record<string | number, string | number>
  test?: SectionWithPartsRaw
}
