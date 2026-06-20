import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/prisma';

test.describe('Editorial Workflow', () => {
  test('Author cannot access review queue', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    await page.goto('/dashboard/review');
    await expect(page.locator('h1')).not.toContainText('Editorial Review Queue');
  });

  test('Editor can view review queue and access detail page', async ({ page }) => {
    const author = await prisma.user.findFirst({ where: { email: 'author1@editorialflow.local' } });
    const article = await prisma.article.create({
      data: {
        title: 'E2E Review Test ' + Date.now(),
        slug: 'e2e-review-test-' + Date.now(),
        contentJson: {},
        sanitizedHtml: '<p>Content</p>',
        status: 'IN_REVIEW',
        authorId: author!.id,
        version: 1
      }
    });

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'editor@editorialflow.local');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      await page.click('text=Review Queue');
      await expect(page.locator('h1')).toContainText('Editorial Review Queue');
      
      await page.locator(`a[href="/dashboard/review/${article.id}"]`).click();
      await expect(page.locator('h2', { hasText: 'Status & Actions' })).toBeVisible();
      await expect(page.locator('text=Request Changes')).toBeVisible();
    } finally {
      await prisma.article.delete({ where: { id: article.id } });
    }
  });
});
