import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers'

test.describe('Navegación principal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('muestra tabs de navegación', async ({ page }) => {
    await expect(page.getByRole('link', { name: /bodega/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /añadir|anadir/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /catas/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sommelier/i })).toBeVisible()
  })

  test('navega a /anadir', async ({ page }) => {
    await page.getByRole('link', { name: /añadir|anadir/i }).click()
    await expect(page).toHaveURL(/\/anadir/)
  })

  test('navega a /catas', async ({ page }) => {
    await page.getByRole('link', { name: /catas/i }).click()
    await expect(page).toHaveURL(/\/catas/)
  })

  test('navega a /sommelier', async ({ page }) => {
    await page.getByRole('link', { name: /sommelier/i }).click()
    await expect(page).toHaveURL(/\/sommelier/)
  })
})
