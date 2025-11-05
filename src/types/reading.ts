export interface Question {
  id: number
  type: 'true-false-not-given' | 'multiple-choice' | 'fill-blank' | 'matching'
  text: string
  options?: string[]
  answer?: string | number
}

export interface Passage {
  id: number
  title: string
  content: string
  questions: Question[]
}

export interface ReadingState {
  currentPart: number
  passages: Passage[]
  answers: Record<number, string | number>
}
