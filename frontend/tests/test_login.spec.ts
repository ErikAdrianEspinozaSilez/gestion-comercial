import { test, expect } from '@playwright/test';
import { login } from './helpers/login.js';

test('test login helper', async ({ page }) => {
  await login(page, 'admin', 'admin123');

  await expect(page).toHaveURL(/5173/);
});