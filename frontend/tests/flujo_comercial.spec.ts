import { test, expect } from '@playwright/test';

test('Prueba simplificada de venta', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // LOGIN
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // IR A VENTAS
  await page.getByRole('link', { name: '💳 Punto Venta' }).click();

  // BUSCAR PRODUCTO
  const search = page.getByRole('textbox', { name: '🔍 Escribe el nombre o código' });
  await search.fill('carlita');
  await search.press('Enter');

  // 🔥 IMPORTANTE: seleccionar el resultado (ESTO FALTABA)
  await page.getByText('carlita', { exact: false }).click();

  // ESPERAR QUE EL BOTÓN SE ACTIVE (NO waitForTimeout)
  const btn = page.getByRole('button', { name: 'FINALIZAR VENTA' });

  await expect(btn).toBeEnabled();

  // CLICK FINAL
  await btn.click();
});