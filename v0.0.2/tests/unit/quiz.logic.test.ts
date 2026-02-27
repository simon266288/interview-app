import { describe, it, expect } from 'vitest'
import { getCorrectAnswerIndex, isAnswerCorrect } from '../../src/domain/quiz.logic'
import type { Question } from '../../src/domain/question.types'

describe('quiz.logic', () => {
  it('handles judge questions', () => {
    const qTrue: Question = { id: 1, type: 'judge', module: 'm', question: 'q', answer: true }
    const qFalse: Question = { id: 2, type: 'judge', module: 'm', question: 'q', answer: false }
    expect(getCorrectAnswerIndex(qTrue)).toBe(0)
    expect(getCorrectAnswerIndex(qFalse)).toBe(1)
    expect(isAnswerCorrect(qTrue, 0)).toBe(true)
    expect(isAnswerCorrect(qTrue, 1)).toBe(false)
  })

  it('handles choice questions', () => {
    const q: Question = { id: 1, type: 'choice', module: 'm', question: 'q', options: ['a', 'b'], answer: 1 }
    expect(getCorrectAnswerIndex(q)).toBe(1)
    expect(isAnswerCorrect(q, 1)).toBe(true)
    expect(isAnswerCorrect(q, 0)).toBe(false)
  })

  it('returns null for card questions', () => {
    const q: Question = { id: 1, type: 'card', module: 'm', question: 'q', answer: 'x' }
    expect(getCorrectAnswerIndex(q)).toBe(null)
    expect(isAnswerCorrect(q, 0)).toBe(false)
  })
})

