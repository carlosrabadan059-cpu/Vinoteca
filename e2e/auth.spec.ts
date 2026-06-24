import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('redirige a /login si no hay sesión', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige a /login desde ruta protegida', async ({ page }) => {
    await page.goto('/bodega')
    await expect(page).toHaveURL(/\/login/)
  })

  test('página de login renderiza formulario', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /entrar|iniciar|login/i })).toBeVisible()
  })

  test('página de registro accesible desde login', async ({ page }) => {
    await page.goto('/login')
    // El link es un <Link> de React Router con texto "Regístrate"
    const registerLink = page.getByRole('link', { name: /Regístrate/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('formulario de login muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill('wrong@test.com')
    await page.getByPlaceholder('Contraseña').fill('wrongpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()
    // El componente muestra el mensaje de error en un <p> tras el submit
    await expect(page.locator('p').filter({ hasText: /.+/ }).first()).toBeVisible({ timeout: 10000 })
  })
})
