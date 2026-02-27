import { test, expect } from '@playwright/test'
import { preparePage, gotoHome, gotoModules, selectModule } from './helpers'

test.beforeEach(async ({ page }) => {
  await preparePage(page)
})

test('edge: errors/favorites empty state', async ({ page }) => {
  await gotoHome(page)
  await page.getByTestId('home.errors').click()
  await expect(page.getByTestId('list.empty')).toBeVisible()
  await page.getByTestId('nav.back').click()

  await page.getByTestId('home.favorites').click()
  await expect(page.getByTestId('list.empty')).toBeVisible()
})

test('edge: practice module with 0 questions shows alert', async ({ page }) => {
  await gotoHome(page)
  await gotoModules(page, 'practice')
  await selectModule(page, '工程化 (Webpack/Vite)')
  await expect(page.getByTestId('quiz.title')).toBeVisible()
})

