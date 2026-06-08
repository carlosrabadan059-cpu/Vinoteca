import { test, expect } from '@playwright/test'

const SUPABASE_KEY = 'sb-xagsblgwvfitqkzjtwyc-auth-token'

const FAKE_SESSION = JSON.stringify({
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.fake',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'fake-refresh-token',
  user: {
    id: 'user-123',
    email: 'test@test.com',
    role: 'authenticated',
  },
})

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SUPABASE_KEY, value: FAKE_SESSION }
  )
})

test('bodega carga con header editorial', async ({ page }) => {
  await page.goto('/bodega')
  await expect(page.getByText('Mi Bodega')).toBeVisible()
})

test('header muestra Vinoteca con icono de copa', async ({ page }) => {
  await page.goto('/bodega')
  await expect(page.getByText('Vinoteca')).toBeVisible()
})

test('navegación inferior tiene las 5 secciones', async ({ page }) => {
  await page.goto('/bodega')
  await expect(page.getByRole('link', { name: /Bodega/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Añadir/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Catas/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Sommelier/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Stats/i })).toBeVisible()
})
