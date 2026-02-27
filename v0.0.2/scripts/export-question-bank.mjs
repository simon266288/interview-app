import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const inputTsPath = path.join(projectRoot, 'src', 'data', 'questionBank.ts')
const outDir = path.join(projectRoot, 'exports')
const tmpModulePath = path.join(outDir, `.questionBank.tmp.${Date.now()}.mjs`)
const outJsonPath = path.join(outDir, 'questionBank.json')
const outModulesPath = path.join(outDir, 'modules.json')

function normalizeQuestion(q) {
  const base = {
    id: q.id,
    module: q.module,
    type: q.type,
    question: q.question,
  }

  if (Array.isArray(q.options)) base.options = q.options
  if (q.answer !== undefined) base.answer = q.answer
  if (typeof q.analysis === 'string') base.analysis = q.analysis

  if (q.type === 'choice' && Array.isArray(q.options) && typeof q.answer === 'number') {
    base.answerText = q.options[q.answer]
  }

  return base
}

async function main() {
  await fs.mkdir(outDir, { recursive: true })

  const tsSource = await fs.readFile(inputTsPath, 'utf8')
  const transpiled = ts.transpileModule(tsSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: inputTsPath,
  })

  await fs.writeFile(tmpModulePath, transpiled.outputText, 'utf8')

  const modUrl = `${pathToFileURL(tmpModulePath).href}?t=${Date.now()}`
  const mod = await import(modUrl)

  const modules = Array.isArray(mod.MODULES) ? mod.MODULES : []
  const questions = Array.isArray(mod.QUESTION_BANK) ? mod.QUESTION_BANK : []

  const normalized = questions.map(normalizeQuestion)

  await fs.writeFile(outJsonPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  await fs.writeFile(outModulesPath, `${JSON.stringify(modules, null, 2)}\n`, 'utf8')
  await fs.unlink(tmpModulePath)

  process.stdout.write(`Exported questions: ${normalized.length}\n`)
  process.stdout.write(`Wrote: ${outJsonPath}\n`)
  process.stdout.write(`Wrote: ${outModulesPath}\n`)
}

await main()
