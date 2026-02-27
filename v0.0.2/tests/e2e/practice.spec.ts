import { test, expect } from '@playwright/test'
import { preparePage, gotoHome, gotoModules, selectModule, goBack } from './helpers'

test.beforeEach(async ({ page }) => {
  await preparePage(page)
})

test('practice: answer shows analysis and can navigate back to home', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'practice')
  await selectModule(page, 'JS/CSS 基础')

  await expect(page.getByTestId('quiz.title')).toContainText('JS/CSS 基础')
  await expect(page.getByTestId('quiz.option').first()).toBeVisible()

  await page.getByTestId('quiz.option').first().click()
  await expect(page.getByTestId('quiz.analysis')).toBeVisible()

  const questionBefore = await page.getByTestId('quiz.question').textContent()
  await page.getByTestId('quiz.next').click()
  await expect(page.getByTestId('quiz.question')).toBeVisible()
  const questionAfter = await page.getByTestId('quiz.question').textContent()
  expect(questionAfter).not.toBe(questionBefore)

  await goBack(page)
  await expect(page.getByTestId('modules.title')).toBeVisible()
  await goBack(page)
  await expect(page.getByTestId('home.title')).toBeVisible()
})

test('practice: resumes from last position for same module', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'practice')
  await selectModule(page, 'JS/CSS 基础')

  const q1 = await page.getByTestId('quiz.question').textContent()
  await page.getByTestId('quiz.next').click()
  await expect(page.getByTestId('quiz.question')).toBeVisible()
  const q2 = await page.getByTestId('quiz.question').textContent()
  expect(q2).not.toBe(q1)

  await goBack(page)
  await expect(page.getByTestId('modules.title')).toBeVisible()
  await goBack(page)
  await expect(page.getByTestId('home.title')).toBeVisible()

  await gotoModules(page, 'practice')
  await selectModule(page, 'JS/CSS 基础')
  await expect(page.getByTestId('quiz.question')).toHaveText(String(q2))
})

