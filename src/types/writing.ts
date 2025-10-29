export interface WritingAnswers {
  part1: string
  part2: string
}

export interface WritingState {
  currentPage: number
  answers: WritingAnswers
}
