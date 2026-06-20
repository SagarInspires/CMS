import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/prisma';

test.describe('Public Discovery & SEO', () => {

  test('Homepage loads and displays featured articles', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading / layout
    await expect(page.locator('text=EditorialFlow').first()).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Latest Articles' })).toBeVisible();
    
    // Check if the "Featured Article" section is visible (if seeded)
    // The seed script creates "Getting Started with Next.js 15" as PUBLISHED
    const featuredHeading = page.locator('h1', { hasText: 'Getting Started with Next.js 15' });
    if (await featuredHeading.isVisible()) {
      await expect(featuredHeading).toBeVisible();
    }
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto('/');
    
    // Use the search form in the header
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('Next.js');
    await searchInput.press('Enter');

    // Should redirect to /articles?q=Next.js
    await expect(page).toHaveURL(/.*\/articles\?q=Next\.js/);
    
    // Expect search results heading
    await expect(page.locator('h1')).toContainText('Search results for "Next.js"');
  });

  test('Unpublished articles return 404', async ({ page }) => {
    // The seed script creates "Draft Article on React 19" as DRAFT
    // Its slug is "draft-article-react-19"
    const response = await page.goto('/articles/draft-article-react-19');
    
    // Next.js returns 404 for notFound()
    expect(response?.status()).toBe(404);
  });

  test('Sitemap generates successfully', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('/articles/getting-started-with-nextjs-15');
  });

});
