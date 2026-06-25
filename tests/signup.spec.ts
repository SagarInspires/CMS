import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

test.describe('Public Signup and Verification Workflow', () => {
  const testEmail = `test-author-${Date.now()}@editorialflow.local`;
  const testPassword = 'StrongPassword123!';
  const testName = 'Test Author';

  // Cleanup after test
  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail }
    });
    await prisma.$disconnect();
  });

  test('complete signup, verification, and role enforcement flow', async ({ page }) => {
    // 1. Visitor opens Register
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 1, name: 'Join the vanguard' })).toBeVisible();

    const nameInput = page.getByPlaceholder("Full Name");
    const emailInput = page.getByPlaceholder("Email Address");
    const passwordInput = page.getByPlaceholder("Password", { exact: true });
    const confirmPasswordInput = page.getByPlaceholder("Confirm Password");
    const submitButton = page.getByRole("button", { name: "Create Account" });

    // 2. Invalid form displays accessible errors (Password mismatch)
    await nameInput.fill(testName);
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await confirmPasswordInput.fill("WrongPassword123!");
    await submitButton.click();

    // Verify error appears
    const passwordMismatchAlert = page
      .getByRole("alert")
      .filter({
        hasText: "Passwords do not match",
      });

    await expect(passwordMismatchAlert).toBeVisible();
    await expect(passwordMismatchAlert).toContainText("Passwords do not match");

    // 3. Valid signup succeeds
    // Refill all required fields since server resets uncontrolled inputs on error
    await nameInput.fill(testName);
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await confirmPasswordInput.fill(testPassword);
    
    await expect(nameInput).toHaveValue(testName);
    await expect(emailInput).toHaveValue(testEmail);
    await expect(passwordInput).toHaveValue(testPassword);
    await expect(confirmPasswordInput).toHaveValue(testPassword);

    await submitButton.click();
    
    // Should see success state
    await expect(page.getByRole("heading", { level: 1, name: "Check your email" })).toBeVisible();

    // 4. Verify created account is AUTHOR and unverified directly in DB
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeTruthy();
    expect(user?.role).toBe('AUTHOR');
    expect(user?.status).toBe('PENDING_VERIFICATION');

    // 5. Login before verification fails
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    const verificationAlert = page
      .getByRole("alert")
      .filter({
        hasText: "Please verify your email address before logging in.",
      });

    await expect(verificationAlert).toBeVisible();
    await expect(verificationAlert).toContainText("Please verify your email address before logging in.");
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    // 6. Test verification flow activates account
    // Since we don't have a real inbox in E2E, we'll bypass the email by just finding the token.
    // However, the token hash is stored, so we cannot reverse it. 
    // Wait, since we can't reverse the hash, we must intercept the token during generation OR 
    // artificially inject a known token for test purposes.
    // Instead of intercepting the console log, let's inject a known token into the DB for the user.
    const rawToken = 'test-e2e-verification-token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user!.id },
      data: { tokenHash } // overwrite it with our known hash
    });

    // Visit verification link
    await page.goto(`/verify-email?token=${rawToken}`);
    
    // It should redirect to login with a success param
    await expect(page).toHaveURL(/.*\/login\?verified=true/);

    // Verify DB status updated
    const activeUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(activeUser?.status).toBe('ACTIVE');

    // 7. Verified user logs in
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 8. User reaches Author dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1', { hasText: 'Overview' })).toBeVisible();

    // 9. User cannot access Editor/Admin routes
    // AUTHOR cannot access Admin user management
    await page.goto("/dashboard/users");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "403 Forbidden",
      })
    ).toBeVisible();

    await expect(
      page.getByText(
        "You do not have permission to manage users.",
        { exact: true }
      )
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "User Management",
      })
    ).toHaveCount(0);
  });
});
