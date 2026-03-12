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

export function validateLocalQuestionBank(questions) {
  const errors = []

  if (!Array.isArray(questions)) {
    return { ok: false, errors: ['questions must be an array'] }
  }

  const seenIds = new Set()
  const validTypes = new Set(['choice', 'judge', 'card'])

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const at = `questions[${i}]`

    if (typeof q !== 'object' || q === null) {
      errors.push(`${at}: must be an object`)
      continue
    }

    if (!Number.isInteger(q.id)) {
      errors.push(`${at}.id: must be an integer`)
    } else {
      if (seenIds.has(q.id)) {
        errors.push(`${at}.id: duplicate id ${q.id}`)
      }
      seenIds.add(q.id)
    }

    if (!validTypes.has(q.type)) {
      errors.push(`${at}.type: invalid type ${String(q.type)}`)
    }

    if (typeof q.module !== 'string') {
      errors.push(`${at}.module: must be a string`)
    } else if (!MODULES.includes(q.module)) {
      errors.push(`${at}.module: invalid module ${q.module}`)
    }

    if (q.type === 'choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`${at}.options: choice must have at least 2 options`)
      }

      if (!Number.isInteger(q.answer)) {
        errors.push(`${at}.answer: choice answer must be an integer index`)
      } else if (Array.isArray(q.options) && (q.answer < 0 || q.answer >= q.options.length)) {
        errors.push(`${at}.answer: choice answer index out of range`)
      }
    } else if (q.type === 'judge') {
      if (typeof q.answer !== 'boolean') {
        errors.push(`${at}.answer: judge answer must be boolean`)
      }
    } else if (q.type === 'card') {
      if (typeof q.answer !== 'string') {
        errors.push(`${at}.answer: card answer must be string`)
      }
    }
  }

  return { ok: errors.length === 0, errors }
}
