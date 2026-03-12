import { defineStore } from 'pinia'
import { ref } from 'vue'

interface QuestionBankSettingsState {
  seed: number
  samplePerModule: number
  schemaVersion: number
}

const STORAGE_KEY = 'interview_app_question_bank_settings_v1'
const SCHEMA_VERSION = 1

function loadSettings(): Partial<QuestionBankSettingsState> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<QuestionBankSettingsState>
  } catch {
    return {}
  }
}

function saveSettings(state: QuestionBankSettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function generateSeed(): number {
  // Prefer crypto-grade randomness when available (browser). Fallback keeps tests/Node working.
  const g = globalThis as any
  const cryptoObj = g.crypto
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    cryptoObj.getRandomValues(buf)
    return buf[0]!
  }
  return Math.floor(Math.random() * 2 ** 32) >>> 0
}

export const useQuestionBankSettingsStore = defineStore('questionBankSettings', () => {
  const loaded = loadSettings()

  const seed = ref<number>(typeof loaded.seed === 'number' ? loaded.seed : generateSeed())
  const samplePerModule = ref<number>(typeof loaded.samplePerModule === 'number' ? loaded.samplePerModule : 20)

  const persist = () => {
    saveSettings({
      seed: seed.value >>> 0,
      samplePerModule: Math.max(0, Math.floor(samplePerModule.value)),
      schemaVersion: SCHEMA_VERSION,
    })
  }

  // Ensure first run persists defaults.
  persist()

  const shuffleSeed = () => {
    seed.value = generateSeed()
    persist()
  }

  const setSamplePerModule = (n: number) => {
    samplePerModule.value = n
    persist()
  }

  return {
    seed,
    samplePerModule,
    shuffleSeed,
    setSamplePerModule,
  }
})
