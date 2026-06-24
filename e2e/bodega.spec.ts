import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers'

test.describe('Bodega', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/bodega')
  })

  test('muestra la página de bodega', async ({ page }) => {
    await expect(page).toHaveURL(/\/bodega/)
    await expect(page.getByRole('heading', { name: /bodega/i })).toBeVisible()
  })

  test('muestra lista de vinos o estado vacío', async ({ page }) => {
    const hasWines = await page.locator('[data-testid="wine-card"]').count() > 0
    if (hasWines) {
      await expect(page.locator('[data-testid="wine-card"]').first()).toBeVisible()
    } else {
      await expect(page.getByText(/vacía|sin vinos|añade/i)).toBeVisible()
    }
  })
})
