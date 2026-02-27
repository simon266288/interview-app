import { describe, it, expect } from 'vitest'
import { MODULES, QUESTION_BANK } from '../../src/data/questionBank'

describe('questionBank', () => {
  it('has stable modules list', () => {
    expect(MODULES.length).toBeGreaterThan(0)
    expect(MODULES).toContain('JS/CSS 基础')
    expect(MODULES).toContain('手写代码')
  })

  it('has unique question ids', () => {
    const ids = QUESTION_BANK.map(q => q.id)
    const uniq = new Set(ids)
    expect(uniq.size).toBe(ids.length)
  })

  it('has some card questions', () => {
    expect(QUESTION_BANK.some(q => q.type === 'card')).toBe(true)
  })
})

