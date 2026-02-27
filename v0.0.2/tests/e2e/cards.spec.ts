import { test, expect } from '@playwright/test'
import { preparePage, gotoHome, gotoModules, selectModule } from './helpers'

test.beforeEach(async ({ page }) => {
  await preparePage(page)
})

test('cards: can flip and mark known/unknown', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'card')
  await selectModule(page, '手写代码')

  await expect(page.getByTestId('quiz.title')).toContainText('记忆卡片')
  await expect(page.getByTestId('quiz.flipCard')).toBeVisible()

  await page.getByTestId('quiz.flipCard').click()
  await expect(page.getByText('参考答案：')).toBeVisible()
  // 手写代码模块设计为不展示“答案解析”区块
  await expect(page.getByTestId('quiz.analysis')).toHaveCount(0)

  const q1 = await page.getByTestId('quiz.question').textContent()
  await page.getByTestId('quiz.card.known').click()
  await expect
    .poll(async () => page.getByTestId('quiz.question').textContent())
    .not.toBe(q1)
})
