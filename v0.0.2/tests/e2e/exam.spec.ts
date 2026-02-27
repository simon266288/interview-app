import { test, expect } from '@playwright/test'
import { preparePage, gotoHome } from './helpers'

test.beforeEach(async ({ page }) => {
  await preparePage(page)
})

test('exam: submit shows result and can return home', async ({ page }) => {
  await gotoHome(page)
  await page.getByTestId('home.exam').click()

  await expect(page.getByTestId('quiz.title')).toHaveText('模拟考试中...')
  await expect(page.getByTestId('quiz.option').first()).toBeVisible()

  await page.getByTestId('quiz.option').first().click()
  await page.getByTestId('quiz.next').click()

  await page.getByTestId('quiz.submit').click()
  await expect(page.getByTestId('result.title')).toHaveText('考试结束')
  await page.getByTestId('result.backHome').click()
  await expect(page.getByTestId('home.title')).toBeVisible()
})

test('exam: submitting without answers does not change totalDone', async ({ page }) => {
  await gotoHome(page)
  const before = (await page.getByTestId('home.totalDone').textContent())?.trim()

  await page.getByTestId('home.exam').click()
  await expect(page.getByTestId('quiz.title')).toHaveText('模拟考试中...')
  await page.getByTestId('quiz.submit').click()
  await expect(page.getByTestId('result.title')).toHaveText('考试结束')
  await page.getByTestId('result.backHome').click()

  await expect(page.getByTestId('home.totalDone')).toHaveText(String(before))
})

