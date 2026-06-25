import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/prisma';
import path from 'path';

test.describe('Image Upload E2E Workflow', () => {

  test('Author can upload image and it renders securely', async ({ page, browser }) => {
    test.setTimeout(120000); // Increase to 120s due to extensive workflow and dev server latency
    
    // Unique identifier for this test run to ensure isolation
    const uniqueTitle = `Test Upload E2E ${Date.now()} ${Math.random().toString(36).substring(7)}`;

    try {
      // 1. Author logs in
      await page.goto('/login');
      await page.fill('input[name="email"]', 'author1@editorialflow.local');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // 2. Author opens new article page
      await page.getByRole("link", { name: "New Draft +" }).click();

      await expect(page).toHaveURL(/\/dashboard\/articles\/[^/]+\/edit$/, { timeout: 15_000 });

      await expect(page.getByTestId('rich-text-editor')).toBeVisible();
      
      await expect(
        page.locator('input[name="title"]')
      ).toBeVisible();

      // Fill title
      await page.locator('input[name="title"]').fill(uniqueTitle);

      // 3. Author uploads an image through the editor toolbar
      // Override window.prompt to provide alt text
      page.on('dialog', dialog => dialog.accept('Test Alt Text'));

      // Playwright needs to wait for the UI to be ready
      await expect(page.getByTestId("rich-text-editor")).toBeVisible();
      await expect(page.getByRole("button", { name: "Upload Image" })).toBeVisible();

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();

      const fixturePath = path.resolve(__dirname, 'fixtures/test.png');
      
      // Attach file to hidden input
      await fileInput.setInputFiles(fixturePath);

      // Ensure image is visible in the editor
      await expect(page.locator('.ProseMirror img[alt="Test Alt Text"]')).toBeVisible();

      // 5. Author waits for autosave
      const saveStatus = page.getByTestId('editor-save-status');
      await expect(saveStatus).toHaveText(/^\s*Saved\s*$/i, { timeout: 15_000 });

      // Navigate to dashboard articles list
      await page.goto('/dashboard/articles');

      // Wait for redirect and ensure draft exists
      await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();

      // 6. Draft image content does not make draft article public
      const draftArticle = await prisma.article.findFirst({ where: { title: uniqueTitle } });
      expect(draftArticle).not.toBeNull();

      if (!draftArticle) {
        throw new Error(`Created article was not found: ${uniqueTitle}`);
      }
      
      // Attempt public access
      const draftPublicResponse = await page.goto(`/articles/${draftArticle!.slug}`);
      expect(draftPublicResponse?.status()).toBe(404);

      // 7. Admin (Reviewer) logs in and sees image in review
      const reviewerContext = await browser.newContext();
      const reviewerPage = await reviewerContext.newPage();
      await reviewerPage.goto('/login');
      await reviewerPage.fill('input[name="email"]', 'admin@editorialflow.local');
      await reviewerPage.fill('input[name="password"]', 'Password123!');
      await reviewerPage.getByRole('button', { name: 'Sign In' }).click();

      await expect(
        reviewerPage,
        'Admin login failed or did not complete'
      ).toHaveURL(/\/dashboard(?:\/.*)?$/, { timeout: 15_000 });

      await expect(
        reviewerPage.getByRole('heading', { name: /login to editorialflow/i })
      ).toHaveCount(0);

      await reviewerPage.goto(`/dashboard/review/${draftArticle!.id}`);

      await expect(
        reviewerPage,
        'Admin was redirected away from the review page'
      ).toHaveURL(
        new RegExp(`/dashboard/review/${draftArticle!.id}$`),
        { timeout: 15_000 }
      );
      
      // Ensure image is visible in the review preview
      await expect(reviewerPage.locator('img[alt="Test Alt Text"]')).toBeVisible();

      // DRAFT -> IN_REVIEW
      await reviewerPage.getByRole("button", { name: "Submit for Review", exact: true }).click();
      
      const submitDialog = reviewerPage.getByRole("dialog");
      await expect(submitDialog).toBeVisible();
      
      const confirmSubmit = submitDialog.getByRole("button", { name: "Confirm Submission", exact: true });
      await expect(confirmSubmit).toBeEnabled();
      await confirmSubmit.click();
      
      await expect.poll(async () => {
        const article = await prisma.article.findUnique({ where: { id: draftArticle!.id }, select: { status: true } });
        return article?.status;
      }, { message: "Article did not transition to IN_REVIEW", timeout: 10_000 }).toBe("IN_REVIEW");

      await expect(reviewerPage.getByTestId('article-status')).toHaveText('IN REVIEW', { timeout: 15000 });

      // IN_REVIEW -> APPROVED
      await reviewerPage.getByRole("button", { name: "Approve", exact: true }).click();
      
      const approveDialog = reviewerPage.getByRole("dialog");
      await expect(approveDialog).toBeVisible();
      
      const confirmApproval = approveDialog.getByRole("button", { name: "Confirm Approval", exact: true });
      await expect(confirmApproval).toBeEnabled();
      await confirmApproval.click();
      
      await expect.poll(async () => {
        const article = await prisma.article.findUnique({ where: { id: draftArticle!.id }, select: { status: true } });
        return article?.status;
      }, { message: "Article did not transition to APPROVED", timeout: 10_000 }).toBe("APPROVED");

      await expect(reviewerPage.getByTestId('article-status')).toHaveText('APPROVED', { timeout: 15000 });

      // APPROVED -> PUBLISHED
      await reviewerPage.getByRole("button", { name: "Publish Now", exact: true }).click();
      
      const publishDialog = reviewerPage.getByRole("dialog");
      await expect(publishDialog).toBeVisible();
      
      const confirmPublication = publishDialog.getByRole("button", { name: "Confirm Publication", exact: true });
      await expect(confirmPublication).toBeEnabled();
      await confirmPublication.click();
      
      await expect.poll(async () => {
        const article = await prisma.article.findUnique({ where: { id: draftArticle!.id }, select: { status: true } });
        return article?.status;
      }, { message: "Article did not transition to PUBLISHED", timeout: 10_000 }).toBe("PUBLISHED");

      await expect(reviewerPage.getByTestId('article-status')).toHaveText('PUBLISHED', { timeout: 15000 });

      // FINAL DB CHECK FOR PUBLICATION
      await expect
        .poll(
          async () => {
            return prisma.article.findUnique({
              where: { id: draftArticle!.id },
              select: {
                status: true,
                publishedAt: true,
                scheduledAt: true,
                deletedAt: true,
                slug: true,
              },
            });
          },
          {
            message: "Article was not persisted as publicly publishable",
            timeout: 10_000,
          }
        )
        .toMatchObject({
          status: "PUBLISHED",
          scheduledAt: null,
          deletedAt: null,
          slug: draftArticle!.slug,
        });

      const publishedArticle = await prisma.article.findUnique({
        where: { id: draftArticle!.id },
        select: { publishedAt: true, slug: true },
      });

      expect(publishedArticle?.publishedAt).not.toBeNull();

      // 8. Published article displays the image publicly safely
      const publishedPublicResponse = await reviewerPage.goto(`/articles/${publishedArticle!.slug}`);
      expect(
        publishedPublicResponse?.status(),
        "Published article must return HTTP 200"
      ).toBe(200);

      await expect(
        reviewerPage.getByRole("heading", {
          level: 1,
          name: uniqueTitle,
        })
      ).toBeVisible();
      
      // Check image attributes (Sanitization preserves safe image tags)
      const publicImg = reviewerPage.locator('img[alt="Test Alt Text"]');
      await expect(publicImg).toBeVisible();
      
      // Ensure no unsafe attributes
      const src = await publicImg.getAttribute('src');
      expect(src).toMatch(/^\/uploads\//); // Ensure it's a safe relative path

    } finally {
      // Clean up isolated test record
      await prisma.article.deleteMany({ where: { title: uniqueTitle } });
    }
  });

  test('Invalid file upload shows error and prevents insertion', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'author1@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    const response = await page.goto("/dashboard/articles/new");

    expect(
      response?.status(),
      "New article route must return HTTP 200"
    ).toBe(200);

    await expect(page).toHaveURL(/\/dashboard\/articles\/[^/]+\/edit$/, { timeout: 15_000 });

    await expect(
      page.getByTestId("rich-text-editor")
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Use the committed fixture
    const dummyPdfPath = path.resolve(__dirname, 'fixtures/test.pdf');
    
    // Wait for the client-side alert to appear and dismiss it so execution doesn't block
    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await fileInput.setInputFiles(dummyPdfPath);
    
    expect(dialogMessage).toBe('Only image files are allowed.');
    
    // Ensure image was NOT inserted
    await expect(page.locator('.ProseMirror img')).toHaveCount(0);
  });
});
