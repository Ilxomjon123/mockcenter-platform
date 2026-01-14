import type { PartRaw, SectionWithPartsRaw } from './test'

export interface WritingAnswers {
  [key: number]: string
}

export type WritingPart = PartRaw
export type WritingTestRaw = SectionWithPartsRaw

export interface WritingState {
  currentPage: number
  answers: WritingAnswers
  test?: WritingTestRaw
  startTime?: number
  isCompleted: boolean
  isManualSubmit: boolean
}
