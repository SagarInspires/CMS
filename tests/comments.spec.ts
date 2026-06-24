import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

test.describe('Comments E2E Workflow', () => {
  let uniqueTitle: string;
  let articleId: string;

  test.beforeEach(async () => {
    uniqueTitle = `Test Comments E2E ${Date.now()}`;
  });

  test('Author creates anchored comment, replies, and resolves, surviving reload', async ({ page, request }) => {
    // 1. Author logs in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Create an article
    await page.goto('/dashboard/articles/new');
    await expect(page).toHaveURL(/\/dashboard\/articles\/[^/]+\/edit$/, { timeout: 15_000 });

    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();

    const titleInput = page.locator('input[placeholder="Document Title"]');
    await titleInput.fill(uniqueTitle);

    await editor.fill('This is a test document to comment on.');

    const saveStatus = page.getByTestId('editor-save-status');
    // The first save might take a long time to compile the API route in Next.js dev server
    await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 30_000 });

    const url = page.url();
    articleId = url.split('/').slice(-2, -1)[0];

    // 3. Select text and create comment
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Meta+A'); // For Mac

    const commentIcon = page.getByRole('button', { name: 'Add Comment' });
    // Assuming the floating menu pops up
    await commentIcon.click();

    const commentsSidebar = page.getByRole('heading', { name: 'Comments' });
    await expect(commentsSidebar).toBeVisible();

    // The reply input should be visible for the new thread. 
    // Creating the root comment uses a new API route which may take a while to compile on first hit.
    const replyInput = page.locator('input[placeholder="Reply..."]');
    await expect(replyInput).toBeVisible({ timeout: 30_000 });
    await replyInput.fill('My first comment!');
    await replyInput.press('Enter');

    // Verify it renders
    await expect(page.getByText('My first comment!')).toBeVisible();
    await expect(page.getByText('Started a thread')).toBeVisible();

    // 4. Reload the page and verify persistence
    await page.reload();
    await expect(editor).toBeVisible();
    
    // The mark should still be there, and clicking it opens the thread
    const markedText = page.locator('span[data-comment-id]');
    await expect(markedText).toBeVisible();
    await markedText.click();

    // Comments sidebar should open
    await expect(page.getByText('My first comment!')).toBeVisible();

    // 5. Resolve the comment
    const resolveBtn = page.getByText('Resolve thread');
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();

    // Mark should be gone
    await expect(markedText).toHaveCount(0);
    
    // Sidebar should close or not show the comment
    await expect(page.getByText('My first comment!')).toHaveCount(0);
  });

  test.afterEach(async () => {
    if (uniqueTitle) {
      await prisma.article.deleteMany({ where: { title: uniqueTitle } });
    }
  });
});
