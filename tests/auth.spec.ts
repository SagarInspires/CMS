import { test, expect } from '@playwright/test';

test('login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  
  // Login as admin
  await page.fill('input[name="email"]', 'admin@editorialflow.local');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  
  // Verify Admin sidebar items
  await expect(page.locator('a', { hasText: 'Review Queue' })).toBeVisible();
});

test('public article access', async ({ page }) => {
  // Access the seeded published article
  await page.goto('/articles/getting-started-with-nextjs-15');
  await expect(page.locator('h1', { hasText: 'Getting Started with Next.js 15' })).toBeVisible();
});
