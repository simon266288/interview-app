import type { Question } from './question.types'

export function getCorrectAnswerIndex(q: Question): number | null {
  if (q.type === 'judge') return q.answer ? 0 : 1
  if (q.type === 'choice') return typeof q.answer === 'number' ? q.answer : null
  return null
}

export function isAnswerCorrect(q: Question, userAnswerIndex: number): boolean {
  const correct = getCorrectAnswerIndex(q)
  if (correct === null) return false
  return userAnswerIndex === correct
}

