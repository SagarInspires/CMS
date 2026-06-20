import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/prisma';
import { UserStatus, Role } from '@prisma/client';

test.describe('Admin User Management', () => {
  
  test('Author cannot access user management', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    
    await page.goto('/dashboard/users');
    await expect(page.locator('h1')).not.toContainText('User Management');
  });

  test('Admin can access user management and change user status', async ({ page }, testInfo) => {
    // Ensure we have a dummy user to modify
    const uniqueEmail = `e2e-user-${Date.now()}-${testInfo.workerIndex}@example.com`;
    let dummyUser = await prisma.user.create({
      data: {
        name: 'Dummy User',
        email: uniqueEmail,
        passwordHash: 'fakeHash',
        role: Role.AUTHOR,
        status: UserStatus.ACTIVE
      }
    });

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'admin@editorialflow.local');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 15000 });


      await page.click('a[href="/dashboard/users"]');
      await expect(page.locator('h1')).toContainText('User Management');
      
      // Locate the row for the dummy user
      const userRow = page.locator('tr', { hasText: uniqueEmail });
      await expect(userRow).toBeVisible();

      // Change role to Editor
      await userRow.locator('select[name="newRole"]').selectOption('EDITOR');
      await userRow.getByRole("button", { name: /save access/i }).click();
      
      // Wait for the UI to reflect the selected option after the first save
      await expect(userRow.locator('select[name="newRole"]')).toHaveValue('EDITOR', { timeout: 10000 });
      
      // Give the server action enough time to write to the DB before querying Prisma
      await expect(async () => {
        const updatedUser = await prisma.user.findUnique({ where: { id: dummyUser.id } });
        expect(updatedUser?.role).toBe(Role.EDITOR);
      }).toPass({ timeout: 10000 });

      // Test status change on the temporary user instead of the seeded admin
      await userRow.locator('select[name="newStatus"]').selectOption('LOCKED');
      // Remember to click save again since both selects are in the same form now
      await userRow.getByRole("button", { name: /save access/i }).click();
      
      // Verify both UI values after the second save
      await expect(userRow.locator('select[name="newRole"]')).toHaveValue('EDITOR', { timeout: 10000 });
      await expect(userRow.locator('select[name="newStatus"]')).toHaveValue('LOCKED', { timeout: 10000 });
      
      await expect(async () => {
        const updatedUserStatus = await prisma.user.findUnique({ where: { id: dummyUser.id } });
        expect(updatedUserStatus?.status).toBe(UserStatus.LOCKED);
        expect(updatedUserStatus?.role).toBe(Role.EDITOR);
      }).toPass({ timeout: 10000 });

    } finally {
      // Clean up
      await prisma.user.delete({ where: { id: dummyUser!.id } });
    }
  });
});
