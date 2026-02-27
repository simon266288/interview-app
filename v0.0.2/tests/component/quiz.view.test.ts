import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import QuizView from '../../src/views/QuizView.vue'

describe('QuizView', () => {
  it('renders exam title in exam mode', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/quiz', component: QuizView }],
    })
    await router.push('/quiz?mode=exam')

    const wrapper = mount(QuizView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await nextTick()
    expect(wrapper.text()).toContain('模拟考试中...')
    wrapper.unmount()
  })

  it('renders module title in practice mode', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/quiz', component: QuizView }],
    })
    await router.push('/quiz?module=JS%2FCSS%20%E5%9F%BA%E7%A1%80')

    const wrapper = mount(QuizView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await nextTick()
    expect(wrapper.text()).toContain('JS/CSS 基础')
    wrapper.unmount()
  })

  it('shows flip card in card mode', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/quiz', component: QuizView }],
    })
    await router.push('/quiz?mode=card&module=%E6%89%8B%E5%86%99%E4%BB%A3%E7%A0%81')

    const wrapper = mount(QuizView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await nextTick()
    await nextTick()
    expect(wrapper.find('.flip-card').exists()).toBe(true)
    wrapper.unmount()
  })
})

