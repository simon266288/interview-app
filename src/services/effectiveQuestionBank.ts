import type { Question } from '../domain/question.types'
import { MODULES, QUESTION_BANK } from '../data/questionBank'
import localQuestionsRaw from '../data/questionBank.local.json'

export type EffectiveQuestionBankMode = 'all' | 'sample'

export interface EffectiveQuestionBankOptions {
  mode: EffectiveQuestionBankMode
  seed: number
  samplePerModule: number
}

function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function isValidModule(mod: string): boolean {
  return MODULES.includes(mod)
}

function normalizeLocalQuestions(): Question[] {
  const data = localQuestionsRaw as unknown
  if (!Array.isArray(data)) return []
  return data as Question[]
}

export function getAllQuestions(): Question[] {
  const localQuestions = normalizeLocalQuestions()

  // Treat all sources as part of the same bank; keep first occurrence on id collisions.
  const merged = [...QUESTION_BANK, ...localQuestions].filter(q => isValidModule(q.module))

  const seen = new Set<number>()
  const uniq: Question[] = []
  for (const q of merged) {
    if (seen.has(q.id)) continue
    seen.add(q.id)
    uniq.push(q)
  }

  return uniq
}

export function getEffectiveModules(_opts: EffectiveQuestionBankOptions): string[] {
  // Keep a stable module list for UI; counts/availability are derived from effective questions.
  return MODULES
}

export function getEffectiveQuestions(opts: EffectiveQuestionBankOptions): Question[] {
  const all = getAllQuestions()
  if (opts.mode === 'all') return all

  const cards = all.filter(q => q.type === 'card')
  const nonCards = all.filter(q => q.type !== 'card')

  const sampledNonCards: Question[] = []

  for (const mod of MODULES) {
    const candidates = nonCards.filter(q => q.module === mod)
    if (candidates.length === 0) continue

    const moduleSeed = (opts.seed ^ hashStringToUint32(mod)) >>> 0
    const shuffled = seededShuffle(candidates, moduleSeed)
    sampledNonCards.push(...shuffled.slice(0, Math.max(0, opts.samplePerModule)))
  }

  // Always include cards to avoid card mode becoming empty due to sampling.
  return [...sampledNonCards, ...cards]
}
