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

test('cards: deep clone answer header should remain visible after flip', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'card')
  await selectModule(page, '手写代码')

  await page.getByTestId('quiz.next').click()
  await page.getByTestId('quiz.next').click()
  await expect(page.getByTestId('quiz.question')).toContainText('手写深拷贝')

  await page.getByTestId('quiz.flipCard').click()

  const answerHeader = page.getByText('参考答案：')
  await expect(answerHeader).toBeVisible()
  await expect(answerHeader).toBeInViewport()
})

test('cards: deep clone answer scrollTop=0 should show code first line', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'card')
  await selectModule(page, '手写代码')

  await page.getByTestId('quiz.next').click()
  await page.getByTestId('quiz.next').click()
  await expect(page.getByTestId('quiz.question')).toContainText('手写深拷贝')

  await page.getByTestId('quiz.flipCard').click()

  const scrollContainer = page.locator('.card-back-scroll')
  await expect(scrollContainer).toBeVisible()

  await scrollContainer.evaluate((el) => {
    ;(el as HTMLElement).scrollTop = 0
  })

  await expect
    .poll(async () =>
      scrollContainer.evaluate((el) => {
        const node = el as HTMLElement
        return {
          scrollTop: node.scrollTop,
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
        }
      }),
    )
    .toMatchObject({ scrollTop: 0 })

  const answerHeader = page.getByText('参考答案：')
  const codeFirstLine = page.getByText('function deepClone(')

  await expect(answerHeader).toBeInViewport()
  await expect(codeFirstLine).toBeVisible()
  await expect(codeFirstLine).toBeInViewport()
})


