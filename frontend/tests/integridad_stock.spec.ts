import { test, expect } from '@playwright/test';
import { login } from './helpers/login.js';

test('Verificar que el stock total refleja los cambios', async ({ page }) => {

  await login(page, 'admin', 'admin123');

  // IR A INVENTARIO
  await page.click('text=📦 Inventario');

  const row = page.locator('tr', { hasText: 'carlita' });
  await expect(row).toBeVisible();

  const stockAntes = Number(await row.locator('td').nth(6).innerText());

  // IR A VENTA
  await page.click('text=💳 Punto Venta');

  const search = page.getByRole('textbox', { name: '🔍' });

  await search.fill('carlita');
  await search.press('Enter');

  // 🔥 seleccionar producto (CRÍTICO)
  await page.getByText('carlita', { exact: false }).click();

  const btn = page.getByRole('button', { name: 'FINALIZAR VENTA' });

  await expect(btn).toBeEnabled();

  await btn.click();

  // volver a inventario
  await page.click('text=📦 Inventario');

  const rowAfter = page.locator('tr', { hasText: 'carlita' });
  await expect(rowAfter).toBeVisible();

  // 🔥 PRO: esperar cambio real (sin timeout fijo)
  await expect.poll(async () => {
    const value = await rowAfter.locator('td').nth(6).innerText();
    return Number(value);
  }, {
    timeout: 5000
  }).toBeLessThan(stockAntes);

});