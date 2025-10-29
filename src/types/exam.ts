export interface ExamAnswers {
  part1: string
  part2: string
}

export interface ExamState {
  currentPage: number
  answers: ExamAnswers
}
