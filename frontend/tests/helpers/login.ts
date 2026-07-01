import type { Page } from '@playwright/test';
export async function login(page: Page, user: string, pass: string) {
  await page.goto('http://localhost:5173/');

  await page.getByRole('textbox', { name: 'Usuario' }).fill(user);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(pass);

  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.waitForLoadState('networkidle');
}