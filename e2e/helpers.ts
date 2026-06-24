import type { Page } from '@playwright/test'

export async function loginAsTestUser(page: Page) {
  const email = process.env.TEST_USER_EMAIL ?? ''
  const password = process.env.TEST_USER_PASSWORD ?? ''

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL y TEST_USER_PASSWORD deben estar definidas en .env.test'
    )
  }

  await page.goto('/login')
  await page.getByPlaceholder(/email|correo/i).fill(email)
  await page.getByPlaceholder(/contraseña|password/i).fill(password)
  await page.getByRole('button', { name: /entrar|iniciar|login/i }).click()
  await page.waitForURL(/\/bodega/, { timeout: 10000 })
}
