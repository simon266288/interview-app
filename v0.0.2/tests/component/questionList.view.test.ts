import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import QuestionListView from '../../src/views/QuestionListView.vue'
import { useProgressStore } from '../../src/stores/progress.store'

describe('QuestionListView', () => {
  it('navigates to list quiz from errors', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useProgressStore()
    store.wrongIds.push(101)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/errors', component: QuestionListView },
        { path: '/quiz', component: { template: '<div />' } },
      ],
    })
    await router.push('/errors')

    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(QuestionListView, {
      global: {
        plugins: [pinia, router],
      },
    })

    const items = wrapper.findAll('.cursor-pointer')
    expect(items.length).toBeGreaterThan(0)
    await items[0].trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({ path: '/quiz', query: { mode: 'list' } })
    const raw = sessionStorage.getItem('quiz_list')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string) as { ids: number[]; startIdx: number }
    expect(parsed.ids).toContain(101)
    expect(parsed.startIdx).toBe(0)
    wrapper.unmount()
  })
})

