import { test, expect } from '@playwright/test';

test('Prueba simplificada de venta', async ({ page }) => {

  await page.goto('http://localhost:5173/');

  // 🔐 LOGIN
  await page.getByRole('textbox', { name: 'Usuario' }).fill('admin');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('admin123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // ⏳ esperar dashboard
  await page.waitForTimeout(2000);

  // 🧭 IR A PUNTO VENTA
  await page.locator('text=Punto Venta').click();

  // 🔎 BUSCAR PRODUCTO
  const search = page.getByPlaceholder(/escribe el nombre o código/i);
  await search.fill('car');

  // 📦 seleccionar producto correcto
  const producto = page.locator('text=Carlita').first();
  await expect(producto).toBeVisible({ timeout: 10000 });
  await producto.click();

  // 🧺 VALIDAR QUE SE AGREGA AL CARRITO
  await expect(page.getByText('1 Items')).toBeVisible({ timeout: 10000 });

  // 🔥 IMPORTANTE: esperar a que React habilite botón
  const btn = page.getByRole('button', { name: /finalizar venta/i });

  // 👇 CLAVE: esperar que deje de estar disabled
  await expect(btn).toBeVisible();

  await expect.poll(async () => {
    return await btn.isEnabled();
  }, {
    timeout: 15000
  }).toBe(true);

  // 🟢 CLICK FINAL
  await btn.click();
});