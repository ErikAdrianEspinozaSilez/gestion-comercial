import { test, expect } from '@playwright/test';
import { login } from './helpers/login.js';

test('Verificar que el stock total refleja los cambios', async ({ page }) => {

  await login(page, 'admin', 'admin123');

  // 📦 IR A INVENTARIO
  await page.click('text=📦 Inventario');

  const row = page.locator('tr', { hasText: 'carlita' });
  await expect(row).toBeVisible();

  const stockAntes = Number(await row.locator('td').nth(6).innerText());

  // 🛒 IR A VENTA
  await page.click('text=💳 Punto Venta');

  const search = page.getByRole('textbox', { name: /🔍|escribe|código|nombre/i });

  await expect(search).toBeVisible();
  await search.fill('car');

  await page.waitForTimeout(800);

  // 🔥 PRODUCTO
  const producto = page.locator('div').filter({
    hasText: 'carlita'
  }).filter({
    hasText: 'Bs. 6.00'
  }).first();

  await expect(producto).toBeVisible({ timeout: 15000 });
  await producto.click();

  // 🧺 FIX IMPORTANTE: NO depender de texto exacto
  await expect(page.locator('text=/1.*item/i')).toBeVisible({ timeout: 15000 });

  // 🔥 BOTÓN FINALIZAR (ARREGLADO)
  const btn = page.getByRole('button', { name: /finalizar venta/i });

  await expect(btn).toBeVisible();

  // ❌ QUITAMOS expect.poll (ERA EL PROBLEMA)
  await page.waitForFunction(() => {
    const b = document.querySelector('button');
    return b && !b.hasAttribute('disabled');
  });

  await btn.click();

  // 📦 volver inventario
  await page.click('text=📦 Inventario');

  const rowAfter = page.locator('tr', { hasText: 'carlita' });
  await expect(rowAfter).toBeVisible();

  // 🔥 validación stock (MEJORADA)
  await expect.poll(async () => {
    const value = await rowAfter.locator('td').nth(6).innerText();
    return Number(value);
  }, {
    timeout: 8000
  }).toBeLessThan(stockAntes);

});