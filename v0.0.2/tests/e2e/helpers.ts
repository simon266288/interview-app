import { expect, type Page } from '@playwright/test'

export type SeedProgressState = {
  completedIds: number[]
  wrongIds: number[]
  favoriteIds: number[]
  moduleStats: Record<string, number>
  examHistory: any[]
  schemaVersion: number
}

export async function preparePage(page: Page, seedState?: SeedProgressState) {
  page.on('dialog', d => d.accept())
  await page.addInitScript(
    ({ state }) => {
      localStorage.clear()
      sessionStorage.clear()
      if (state) localStorage.setItem('interview_app_v1', JSON.stringify(state))
    },
    { state: seedState ?? null },
  )
}

export async function gotoHome(page: Page) {
  await page.goto('/#/')
  await expect(page.getByTestId('home.title')).toBeVisible()
}

export async function gotoModules(page: Page, mode: 'practice' | 'card') {
  if (mode === 'practice') {
    await page.getByTestId('home.practice').click()
    await expect(page.getByTestId('modules.title')).toHaveText('选择练习模块')
  } else {
    await page.getByTestId('home.cards').click()
    await expect(page.getByTestId('modules.title')).toHaveText('选择记忆卡模块')
  }
}

export async function selectModule(page: Page, moduleName: string) {
  await page.getByTestId('modules.item').filter({ hasText: moduleName }).first().click()
}

export async function goBack(page: Page) {
  await page.getByTestId('nav.back').click()
}

