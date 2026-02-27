import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '../../src/stores/progress.store'

describe('progress.store', () => {
  beforeEach(() => {
    const storeMap = new Map<string, string>()
    ;(globalThis as any).localStorage = {
      getItem: (k: string) => (storeMap.has(k) ? storeMap.get(k) : null),
      setItem: (k: string, v: string) => storeMap.set(k, v),
      removeItem: (k: string) => storeMap.delete(k),
      clear: () => storeMap.clear(),
    }
    setActivePinia(createPinia())
    ;(globalThis as any).localStorage.clear()
  })

  it('toggles favorite', () => {
    const store = useProgressStore()
    store.toggleFavorite(1)
    expect(store.favoriteIds).toContain(1)
    store.toggleFavorite(1)
    expect(store.favoriteIds).not.toContain(1)
  })

  it('addCompleted removes wrong', () => {
    const store = useProgressStore()
    store.addWrong(1)
    expect(store.wrongIds).toContain(1)
    store.addCompleted(1)
    expect(store.completedIds).toContain(1)
    expect(store.wrongIds).not.toContain(1)
  })

  it('persists practice index by module', () => {
    const store = useProgressStore()
    store.init()

    expect(store.getPracticeIndex('JS/CSS 基础')).toBe(0)
    store.setPracticeIndex('JS/CSS 基础', 3)
    expect(store.getPracticeIndex('JS/CSS 基础')).toBe(3)

    const store2 = useProgressStore()
    store2.init()
    expect(store2.getPracticeIndex('JS/CSS 基础')).toBe(3)
  })
})

