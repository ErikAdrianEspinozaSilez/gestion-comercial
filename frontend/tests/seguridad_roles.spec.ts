import { test, expect } from '@playwright/test';
import { login } from './helpers/login.js';

test('Acceso denegado a Usuarios para rol Empleado', async ({ page }) => {

  await login(page, 'empleado', 'empleado123');

  // intentar acceso directo
  await page.goto('http://localhost:5173/usuarios');

  // 🔥 VALIDACIÓN REAL (lo importante)
  // el sistema NO debe mostrar contenido de usuarios

  const bodyText = await page.textContent('body');

  expect(bodyText?.toLowerCase()).not.toContain('gestión de usuarios');
  expect(bodyText?.toLowerCase()).not.toContain('crear usuario');
});