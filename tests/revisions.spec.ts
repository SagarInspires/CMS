import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Revisions E2E Workflow', () => {
  let uniqueTitle: string;
  let articleId: string;

  test.beforeEach(async () => {
    uniqueTitle = `Test Revisions E2E ${Date.now()}`;
  });

  test('Author previews and restores a revision safely', async ({ page }) => {
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

    // Initial content
    await editor.fill('Version 1 Content');
    const saveStatus = page.getByTestId('editor-save-status');
    // First save may take a while if Next.js compiles the route
    await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 30_000 });

    const url = page.url();
    articleId = url.split('/').slice(-2, -1)[0];

    // Simulate 10 saves to trigger a backend revision creation
    // The backend route creates a revision every 10 versions.
    for (let i = 0; i < 11; i++) {
      await editor.fill(`Version content loop ${i}`);
      // Wait for debounced autosave
      await page.waitForTimeout(1600); // Debounce is 1500ms
      await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 15_000 });
    }

    // Now write final content
    await editor.fill('Final latest content');
    await page.waitForTimeout(1600);
    await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 15_000 });

    // Open revisions sidebar
    await page.getByTitle('Open Sidebar').click();
    const revisionsBtn = page.getByText('Revisions', { exact: true });
    await revisionsBtn.click();

    // Verify history shows at least one real revision + Current Draft
    await expect(page.getByText('Current Draft')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('button:has-text("v10.")')).toBeVisible({ timeout: 30_000 }); // The 10th save triggered a revision

    // Preview the revision
    await page.locator('button:has-text("v10.")').click();
    
    // Editor should show the preview content, not "Final latest content"
    await expect(editor).not.toHaveText('Final latest content');
    await expect(editor).toHaveText(/Version content loop/);

    // Restore it
    // Playwright needs to handle window.confirm
    page.once('dialog', dialog => dialog.accept());
    
    const restoreBtn = page.getByText('Restore', { exact: true });
    await restoreBtn.click();

    // The page should reload and the content should be the restored content
    await expect(editor).toHaveText(/Version content loop/);
    await expect(editor).not.toHaveText('Final latest content');
  });

  test.afterEach(async () => {
    if (uniqueTitle) {
      await prisma.article.deleteMany({ where: { title: uniqueTitle } });
    }
  });

  test('Review page revision preview safely renders advanced extensions', async ({ page }) => {
    // 1. Author logs in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Seed a revision directly via Prisma for speed and precise JSON control
    const author = await prisma.user.findUnique({ where: { email: 'author1@editorialflow.local' } });
    if (!author) throw new Error('Author not found');

    const testArticle = await prisma.article.create({
      data: {
        title: uniqueTitle,
        slug: uniqueTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        contentJson: {},
        sanitizedHtml: '<p>Current</p>',
        authorId: author.id,
        status: 'IN_REVIEW',
        version: 2
      }
    });

    const goodRevision = await prisma.articleRevision.create({
      data: {
        articleId: testArticle.id,
        version: 1,
        title: 'Historical Revision with Features',
        authorId: author.id,
        contentJson: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Revision Heading" }] },
            { 
              type: "imageBlock", 
              attrs: { src: "/uploads/test.png", alt: "Test Image", alignment: "center" }
            },
            {
              type: "table",
              content: [
                { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Table Data" }] }] }] }
              ]
            },
            // Unsafe HTML simulation (will be sanitized)
            { type: "paragraph", content: [{ type: "text", text: "Bad Script: <script>alert(1)</script>" }] }
          ]
        }
      }
    });

    const badRevision = await prisma.articleRevision.create({
      data: {
        articleId: testArticle.id,
        version: 0,
        title: 'Broken JSON Revision',
        authorId: author.id,
        contentJson: "THIS IS INVALID JSON" // not an object
      }
    });

    // 3. Visit the Review page with the GOOD revision
    await page.goto(`/dashboard/review/${testArticle.id}?rev=${goodRevision.id}`);
    
    // Check heading renders
    await expect(page.getByRole('heading', { name: 'Historical Revision with Features (Revision v1)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Revision Heading' })).toBeVisible();

    // Check image renders
    const img = page.locator('img[alt="Test Image"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/uploads/test.png');

    // Check table renders
    await expect(page.getByRole('cell', { name: 'Table Data' })).toBeVisible();

    // Check unsafe scripts stripped
    // Since tip-tap encodes text, '<script>' might just render as text. 
    // To be sure, we check there is no raw script tag block.
    const scriptCount = await page.locator('script:has-text("alert(1)")').count();
    expect(scriptCount).toBe(0);

    // 4. Visit Review page with the BAD revision
    await page.goto(`/dashboard/review/${testArticle.id}?rev=${badRevision.id}`);
    await expect(page.getByText('Failed to render revision preview.')).toBeVisible();
  });
});
