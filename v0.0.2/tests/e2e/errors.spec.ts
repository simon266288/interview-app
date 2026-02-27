import { test, expect } from '@playwright/test'
import { preparePage, gotoHome, type SeedProgressState } from './helpers'

const seed: SeedProgressState = {
  completedIds: [],
  wrongIds: [101],
  favoriteIds: [],
  moduleStats: {},
  examHistory: [],
  schemaVersion: 1,
}

test.beforeEach(async ({ page }) => {
  await preparePage(page, seed)
})

test('errors: list renders, can remove item, can start list practice', async ({ page }) => {
  await gotoHome(page)
  await page.getByTestId('home.errors').click()

  await expect(page.getByTestId('list.title')).toHaveText('错题本')
  await expect(page.getByTestId('list.item').first()).toBeVisible()

  await page.getByTestId('list.item').first().click()
  await expect(page.getByTestId('quiz.title')).toHaveText('错题/收藏练习')
  await expect(page.getByTestId('quiz.question')).toContainText('闭包')

  await page.getByTestId('nav.back').click()
  await expect(page.getByTestId('list.title')).toHaveText('错题本')

  await page.getByTestId('list.remove').first().click()
  await expect(page.getByTestId('list.empty')).toBeVisible()
})

