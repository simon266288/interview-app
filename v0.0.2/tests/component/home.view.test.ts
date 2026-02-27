import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../../src/views/HomeView.vue'

describe('HomeView', () => {
  it('navigates to exam quiz', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/quiz', component: { template: '<div />' } },
      ],
    })
    await router.push('/')

    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    const examBtn = wrapper.findAll('button').find(b => b.text().includes('模拟考试'))
    expect(examBtn).toBeTruthy()
    await examBtn!.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({ path: '/quiz', query: { mode: 'exam' } })
    wrapper.unmount()
  })
})

