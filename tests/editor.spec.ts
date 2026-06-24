import { test, expect } from '@playwright/test';

test.describe('EditorialFlow Editor Tests', () => {
  // Use the global setup login state or login manually here
  // Assuming test environment has a seeded author user

  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard(?:\/.*)?$/);
  });

  test('should support basic text formatting, alignment, and stats', async ({ page }) => {
    // Navigate to create new article
    await page.goto('/dashboard/articles/new');
    
    // Wait for redirect to edit page
    await expect(page).toHaveURL(/\/dashboard\/articles\/[^/]+\/edit$/, { timeout: 15_000 });

    // Wait for editor to initialize
    await expect(page.getByTestId('rich-text-editor')).toBeVisible();

    // Enter a title
    await page.locator('input[name="title"]').fill('Playwright Test Article');

    // Click into the TipTap canvas
    const editor = page.locator('.editorial-canvas .ProseMirror');
    await editor.click();

    // Type some text
    await page.keyboard.type('This is normal text. ');

    // Test Bold button
    await page.click('button[title="Bold (Cmd+B)"]');
    await page.keyboard.type('This is bold text.');
    await page.click('button[title="Bold (Cmd+B)"]'); // Toggle off
    
    // Assert Bold formatting exists
    const boldText = editor.locator('strong');
    await expect(boldText).toHaveText('This is bold text.');

    // Test Italic button
    await page.click('button[title="Italic (Cmd+I)"]');
    await page.keyboard.type(' This is italic text.');
    await page.click('button[title="Italic (Cmd+I)"]'); // Toggle off

    const italicText = editor.locator('em');
    await expect(italicText).toHaveText(' This is italic text.');

    // Test Alignment
    await page.click('button[title="Align Center"]');
    
    // Assert text alignment is center
    const paragraph = editor.locator('p').first();
    await expect(paragraph).toHaveCSS('text-align', 'center');

    // Test Statistics update
    const statsBar = page.getByTestId('editor-stats');
    await expect(statsBar).toContainText(/\b12 words\b/);
    await expect(statsBar).toContainText(/\b1 min read\b/);

    // Test Document Outline Sidebar
    await page.keyboard.press('Enter');
    
    // Use MenuBar to format as H1
    // Actually, we can use the slash command or just the menu
    // Type a slash command for heading
    await page.keyboard.type('/heading');
    await page.waitForSelector('text=Heading 1');
    await page.keyboard.press('Enter');
    await page.keyboard.type('My Outline Heading');

    // Verify Outline Sidebar updated
    // Open the sidebar first since it is hidden by default now
    await page.getByTitle('Open Sidebar').click();
    const outlineHeading = page.locator('button:has-text("My Outline Heading")');
    await expect(outlineHeading).toBeVisible();

    const saveStatus = page.getByTestId('editor-save-status');
    await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 15_000 });

    await page.reload();

    await expect(page.getByTestId('rich-text-editor')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toHaveValue('Playwright Test Article');

    const reloadedEditor = page.locator('.editorial-canvas .ProseMirror');
    await expect(reloadedEditor.getByText('This is bold text.')).toBeVisible();
    await expect(reloadedEditor.getByText('My Outline Heading')).toBeVisible();
  });
});
