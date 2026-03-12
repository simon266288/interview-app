import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..', '..')
const questionBankTsPath = path.join(projectRoot, 'src', 'data', 'questionBank.ts')
const exportsDir = path.join(projectRoot, 'exports')

async function loadModulesFromQuestionBankTs() {
  try {
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

    const tmpModulePath = path.join(exportsDir, `.questionBank.modules.tmp.${Date.now()}.mjs`)
    await fs.writeFile(tmpModulePath, transpiled.outputText, 'utf8')

    const modUrl = `${pathToFileURL(tmpModulePath).href}?t=${Date.now()}`
    const mod = await import(modUrl)

    await fs.unlink(tmpModulePath)

    return Array.isArray(mod.MODULES) ? mod.MODULES : []
  } catch {
    return []
  }
}

const MODULES = await loadModulesFromQuestionBankTs()

function guessModuleFromText(text) {
  const t = String(text)

  const rules = [
    {
      module: 'TypeScript 基础（新模块）',
      keywords: ['typescript', 'ts', 'interface', 'type', '泛型', 'unknown', 'any', 'never', '类型体操'],
    },
    {
      module: 'React 基础（新模块）',
      keywords: ['react', 'jsx', 'hooks', 'useeffect', 'usestate', 'fiber', '虚拟dom', 'vdom'],
    },
    {
      module: 'Vue 核心原理',
      keywords: ['vue', 'vue2', 'vue3', 'composition', 'setup', 'computed', 'watch', 'pinia', 'diff', 'nexttick'],
    },
    {
      module: '工程化 (Webpack/Vite)',
      keywords: ['webpack', 'vite', 'rollup', 'babel', 'eslint', 'prettier', 'tree shaking', 'bundler', 'monorepo'],
    },
    {
      module: '性能优化',
      keywords: ['性能', '优化', 'lcp', 'cls', 'fcp', 'long task', 'webp', '缓存', '懒加载', '虚拟列表'],
    },
    {
      module: '浏览器与网络',
      keywords: ['http', 'https', 'tcp', 'dns', 'cors', 'cookie', '缓存', 'etag', 'service worker', 'websocket'],
    },
    {
      module: '手写代码',
      keywords: ['手写', '实现', '代码', '写一个', '实现一个', 'debounce', 'throttle', 'promise', '深拷贝'],
    },
    {
      module: '场景题 & 项目经验',
      keywords: ['场景', '项目', '经验', '排查', '设计', '架构', '方案', '上线', '复盘'],
    },
  ]

  const lower = t.toLowerCase()

  for (const r of rules) {
    for (const k of r.keywords) {
      if (lower.includes(String(k).toLowerCase())) return r.module
    }
  }

  return 'JS/CSS 基础'
}

function guessTypeFromText(text) {
  const t = String(text)

  // very rough heuristic: “手写/实现”倾向 card
  if (/手写|实现|写一个|写出/.test(t)) return 'card'

  // 明确判断题
  if (/是否正确|对不对|正确吗|是真的吗/.test(t)) return 'judge'

  // 默认 choice（后续 Task 5 会按比例再做分配）
  return 'choice'
}

function ensureValidModuleOrFallback(moduleName) {
  if (typeof moduleName !== 'string') return 'JS/CSS 基础'
  if (MODULES.includes(moduleName)) return moduleName
  return 'JS/CSS 基础'
}

function createChoiceQuestion({ id, module, question }) {
  // Minimal stub options; generator will refine later.
  return {
    id,
    type: 'choice',
    module,
    question,
    options: ['选项 A', '选项 B', '选项 C', '选项 D'],
    answer: 0,
    analysis: '解析待补充。',
  }
}

function createJudgeQuestion({ id, module, question }) {
  return {
    id,
    type: 'judge',
    module,
    question,
    answer: true,
    analysis: '解析待补充。',
  }
}

function createCardQuestion({ id, module, question }) {
  return {
    id,
    type: 'card',
    module,
    question,
    answer: '参考答案待补充。',
  }
}

export function mapCandidatesToQuestions({ candidates, startId, count }) {
  const safeCandidates = Array.isArray(candidates) ? candidates : []
  const n = Number.isInteger(count) ? count : safeCandidates.length
  const baseId = Number.isInteger(startId) ? startId : 1

  const out = []

  for (let i = 0; i < safeCandidates.length && out.length < n; i++) {
    const c = safeCandidates[i]
    const text = typeof c?.text === 'string' ? c.text.trim() : ''
    if (!text) continue

    const id = baseId + out.length
    const module = ensureValidModuleOrFallback(guessModuleFromText(text))
    const type = guessTypeFromText(text)

    if (type === 'card') {
      out.push(createCardQuestion({ id, module, question: text }))
    } else if (type === 'judge') {
      out.push(createJudgeQuestion({ id, module, question: text }))
    } else {
      out.push(createChoiceQuestion({ id, module, question: text }))
    }
  }

  return out
}
