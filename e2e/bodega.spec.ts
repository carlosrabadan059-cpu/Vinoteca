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
    // Espera a que cargue: o hay tarjetas (rounded-xl cursor-pointer) o el estado vacío
    await expect(
      page.locator('.rounded-xl.cursor-pointer').first()
        .or(page.getByText('Tu bodega está vacía'))
    ).toBeVisible({ timeout: 8000 })
  })
})
