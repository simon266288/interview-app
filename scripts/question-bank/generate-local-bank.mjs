import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

import { listRepoMarkdownFiles, fetchRawFile } from './github-fetch.mjs'
import { extractCandidatesFromMarkdown } from './extract-candidates.mjs'
import { validateLocalQuestionBank } from './validate-local-bank.mjs'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..', '..')
const outJsonPath = path.join(projectRoot, 'src', 'data', 'questionBank.local.json')
const exportsDir = path.join(projectRoot, 'exports')
const questionBankTsPath = path.join(projectRoot, 'src', 'data', 'questionBank.ts')

const SOURCES = [
  { owner: 'haizlin', repo: 'fe-interview', ref: 'master' },
  { owner: 'febobo', repo: 'web-interview', ref: 'master' },
  { owner: 'pwstrick', repo: 'daily', ref: 'main' },
]

function normalizeText(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeQuestionText(s) {
  return normalizeText(s)
    .replace(/^\s*(q\s*\d+|\d+)[\.、\)]\s*/i, '')
    .replace(/^\s*[（(]?(单选题|多选题|判断题|问|答)[）)]?\s*/g, '')
    .trim()
}

function uniqBy(items, keyFn) {
  const seen = new Set()
  const out = []
  for (const it of items) {
    const k = keyFn(it)
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

function splitSentences(text) {
  const t = String(text).replace(/\r\n/g, '\n').trim()
  if (!t) return []
  // very rough sentence split (CN + EN)
  const parts = t
    .split(/(?<=[。！？!?\n])\s*/)
    .map(x => x.trim())
    .filter(Boolean)
  return parts.length ? parts : [t]
}

function takeShortOption(text) {
  const first = splitSentences(text)[0] ?? ''
  const normalized = normalizeText(first)
  if (!normalized) return ''
  // limit option length to keep UI usable
  return normalized.length > 60 ? `${normalized.slice(0, 60)}…` : normalized
}

async function loadQuestionBankSummary() {
  await fs.mkdir(exportsDir, { recursive: true })

  const tsSource = await fs.readFile(questionBankTsPath, 'utf8')
  const transpiled = ts.transpileModule(tsSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: questionBankTsPath,
  })

  const tmpModulePath = path.join(exportsDir, `.questionBank.summary.tmp.${Date.now()}.mjs`)
  await fs.writeFile(tmpModulePath, transpiled.outputText, 'utf8')

  const modUrl = `${pathToFileURL(tmpModulePath).href}?t=${Date.now()}`
  const mod = await import(modUrl)

  await fs.unlink(tmpModulePath)

  const modules = Array.isArray(mod.MODULES) ? mod.MODULES : []
  const questions = Array.isArray(mod.QUESTION_BANK) ? mod.QUESTION_BANK : []

  const counts = { choice: 0, judge: 0, card: 0 }
  for (const q of questions) {
    if (q?.type === 'choice') counts.choice++
    else if (q?.type === 'judge') counts.judge++
    else if (q?.type === 'card') counts.card++
  }

  return { modules, counts }
}

function allocateTypeCounts(total, ratios) {
  const raw = {
    choice: total * ratios.choice,
    judge: total * ratios.judge,
    card: total * ratios.card,
  }

  const out = {
    choice: Math.round(raw.choice),
    judge: Math.round(raw.judge),
    card: Math.round(raw.card),
  }

  // fix rounding drift
  const sum = out.choice + out.judge + out.card
  let diff = total - sum

  const order = [
    { k: 'choice', frac: raw.choice - Math.floor(raw.choice) },
    { k: 'judge', frac: raw.judge - Math.floor(raw.judge) },
    { k: 'card', frac: raw.card - Math.floor(raw.card) },
  ].sort((a, b) => b.frac - a.frac)

  let i = 0
  while (diff !== 0) {
    const k = order[i % order.length].k
    out[k] += diff > 0 ? 1 : -1
    diff += diff > 0 ? -1 : 1
    i++
  }

  return out
}

function guessModule(modules, text) {
  const t = String(text)
  const lower = t.toLowerCase()

  const want = (name) => modules.includes(name) ? name : null

  const rules = [
    { module: want('TypeScript 基础（新模块）'), keywords: ['typescript', 'ts', 'interface', 'type ', '泛型', 'unknown', 'any', 'never', '类型'] },
    { module: want('React 基础（新模块）'), keywords: ['react', 'jsx', 'hooks', 'useeffect', 'usestate', 'fiber', '虚拟dom', 'vdom'] },
    { module: want('Vue 核心原理'), keywords: ['vue', 'composition', 'setup', 'computed', 'watch', 'pinia', 'nexttick', 'diff'] },
    { module: want('工程化 (Webpack/Vite)'), keywords: ['webpack', 'vite', 'rollup', 'babel', 'eslint', 'prettier', 'tree shaking', 'bundler', 'monorepo'] },
    { module: want('性能优化'), keywords: ['性能', '优化', 'lcp', 'cls', 'fcp', 'long task', 'webp', '懒加载', '虚拟列表', '缓存'] },
    { module: want('浏览器与网络'), keywords: ['http', 'https', 'tcp', 'dns', 'cors', 'cookie', 'etag', 'service worker', 'websocket', '缓存'] },
    { module: want('低代码平台'), keywords: ['低代码', 'schema', 'renderer', '物料', 'setter', 'monaco'] },
    { module: want('手写代码'), keywords: ['手写', '实现', '写一个', 'promise', 'debounce', 'throttle', '深拷贝'] },
    { module: want('场景题 & 项目经验'), keywords: ['场景', '项目', '经验', '排查', '设计', '架构', '方案', '复盘'] },
  ]

  for (const r of rules) {
    if (!r.module) continue
    for (const k of r.keywords) {
      if (lower.includes(String(k).toLowerCase())) return r.module
    }
  }

  return modules.includes('JS/CSS 基础') ? 'JS/CSS 基础' : modules[0] ?? 'JS/CSS 基础'
}

async function collectMarkdownFromRepo(source) {
  const files = await listRepoMarkdownFiles(source)

  // Prefer smaller, content-heavy files; avoid gigantic ones.
  const picked = files
    .filter(f => !/node_modules|dist|build|\bsummary\b/i.test(f.path))
    .slice(0, 80)

  const markdowns = []
  for (const f of picked) {
    const md = await fetchRawFile({ ...source, path: f.path, ref: source.ref })
    markdowns.push({ path: f.path, md })
  }

  return markdowns
}

function buildCardQuestion({ id, module, question, answer }) {
  return {
    id,
    type: 'card',
    module,
    question,
    answer,
  }
}

function buildJudgeQuestion({ id, module, statement, analysis, answer }) {
  const q = statement.endsWith('？') || statement.endsWith('?') ? statement : `${statement}（对/错）`
  return {
    id,
    type: 'judge',
    module,
    question: q,
    answer: Boolean(answer),
    analysis,
  }
}

function buildChoiceQuestion({ id, module, question, options, answerIndex, analysis }) {
  return {
    id,
    type: 'choice',
    module,
    question,
    options,
    answer: answerIndex,
    analysis,
  }
}

function shuffleInPlace(arr, seed) {
  // mulberry32
  let t = seed >>> 0
  const rand = () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function generateLocalBank() {
  const { modules, counts } = await loadQuestionBankSummary()
  const totalExisting = counts.choice + counts.judge + counts.card

  const ratios = totalExisting
    ? {
        choice: counts.choice / totalExisting,
        judge: counts.judge / totalExisting,
        card: counts.card / totalExisting,
      }
    : { choice: 0.6, judge: 0.2, card: 0.2 }

  const target = allocateTypeCounts(300, ratios)

  const rawCandidates = []

  for (const source of SOURCES) {
    const markdowns = await collectMarkdownFromRepo(source)
    for (const { md } of markdowns) {
      const candidates = extractCandidatesFromMarkdown(md)
      for (const c of candidates) {
        const title = typeof c?.title === 'string' ? normalizeQuestionText(c.title) : ''
        const body = typeof c?.text === 'string' ? c.text.trim() : ''

        if (!body) continue

        // Prefer heading as question when present
        const question = title || normalizeQuestionText(body.split('\n')[0] ?? '')
        if (!question) continue

        rawCandidates.push({ question, answer: body })
      }
    }
  }

  const candidates = uniqBy(rawCandidates, c => normalizeText(c.question).toLowerCase())

  // Build pools
  const choicePool = candidates
    .map(c => ({ ...c, option: takeShortOption(c.answer) }))
    .filter(c => c.option && c.option.length >= 4)

  const cardPool = candidates.filter(c => normalizeText(c.answer).length >= 20)
  const judgePool = candidates
    .map(c => {
      const stmt = takeShortOption(c.answer)
      return { ...c, statement: stmt }
    })
    .filter(c => c.statement && c.statement.length >= 6)

  // Deterministic-ish selection
  shuffleInPlace(choicePool, 1001)
  shuffleInPlace(cardPool, 1002)
  shuffleInPlace(judgePool, 1003)

  const questions = []
  const usedQuestionText = new Set()

  const addIfUnique = (q) => {
    const key = normalizeText(q.question).toLowerCase()
    if (!key) return false
    if (usedQuestionText.has(key)) return false
    usedQuestionText.add(key)
    questions.push(q)
    return true
  }

  // ---- choice ----
  for (let i = 0; i < choicePool.length && questions.length < target.choice; i++) {
    const c = choicePool[i]
    const module = guessModule(modules, `${c.question}\n${c.answer}`)

    const correct = c.option

    // take 3 distractors from other answers
    const distractors = []
    for (let j = i + 1; j < choicePool.length && distractors.length < 3; j++) {
      const d = choicePool[j].option
      if (!d || d === correct) continue
      if (distractors.includes(d)) continue
      distractors.push(d)
    }

    if (distractors.length < 3) continue

    const opts = [correct, ...distractors]
    shuffleInPlace(opts, 2000 + i)
    const answerIndex = opts.indexOf(correct)

    const q = buildChoiceQuestion({
      id: 100001 + questions.length,
      module,
      question: normalizeQuestionText(c.question),
      options: opts,
      answerIndex,
      analysis: normalizeText(c.answer),
    })

    addIfUnique(q)
  }

  // ---- judge ----
  while (questions.length < target.choice + target.judge && judgePool.length) {
    const c = judgePool.shift()
    if (!c) break

    const module = guessModule(modules, `${c.question}\n${c.answer}`)
    const statement = c.statement

    const q = buildJudgeQuestion({
      id: 100001 + questions.length,
      module,
      statement,
      answer: true,
      analysis: normalizeText(c.answer),
    })

    addIfUnique(q)
  }

  // ---- card ----
  while (questions.length < 300 && cardPool.length) {
    const c = cardPool.shift()
    if (!c) break

    const module = guessModule(modules, `${c.question}\n${c.answer}`)

    const q = buildCardQuestion({
      id: 100001 + questions.length,
      module,
      question: normalizeQuestionText(c.question),
      answer: c.answer.trim(),
    })

    addIfUnique(q)
  }

  if (questions.length !== 300) {
    throw new Error(`Expected 300 questions, got ${questions.length}. Candidates: ${candidates.length}`)
  }

  // Ensure id range exactly 100001..100300
  for (let i = 0; i < questions.length; i++) {
    questions[i].id = 100001 + i
  }

  const validation = validateLocalQuestionBank(questions)
  if (!validation.ok) {
    throw new Error(`Validation failed:\n${validation.errors.join('\n')}`)
  }

  await fs.writeFile(outJsonPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8')
  process.stdout.write(`Wrote ${questions.length} questions to ${outJsonPath}\n`)
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(__filename)) {
  await generateLocalBank()
}
