import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.ts'],
    environmentMatchGlobs: [['tests/unit/**/*.test.ts', 'node']],
  },
})

