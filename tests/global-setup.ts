import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global setup: warm up the Next.js dev server by visiting key routes
 * so they are pre-compiled before tests start. This prevents cold
 * compilation delays from eating into the 30-second test timeouts.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://127.0.0.1:3000';
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Preflight: Ensure the development database is running.
  try {
    const healthResponse = await fetch(`${baseURL}/api/health`);
    const healthText = await healthResponse.text();
    if (!healthResponse.ok || !healthText.includes('connected')) {
      throw new Error(`Database health check failed (Status: ${healthResponse.status}). Body: ${healthText}`);
    }
  } catch (error) {
    throw new Error(`\n\n[E2E PREFLIGHT FAILED]\nThe development database is unreachable.\nPlease ensure you have started the isolated development database:\n  pnpm db:dev:up\n\nOriginal Error: ${(error as Error).message}\n`);
  }

  // Warm up critical routes by visiting them. Each visit triggers
  // on-demand compilation in Next.js dev mode.
  const warmupRoutes = [
    '/',
    '/login',
    '/articles/getting-started-with-nextjs-15',
    '/articles/draft-article-react-19',
    '/search?q=test',
    '/sitemap.xml',
  ];

  for (const route of warmupRoutes) {
    try {
      await page.goto(`${baseURL}${route}`, { timeout: 60000, waitUntil: 'load' });
    } catch {
      // Some routes (like 404s) may error, that's fine — we just need compilation
    }
  }

  // Now warm up protected routes by logging in first
  try {
    await page.goto(`${baseURL}/login`, { timeout: 30000, waitUntil: 'load' });
    await page.fill('input[name="email"]', 'admin@editorialflow.local');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });
    
    // Visit protected routes to compile them
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/articles/new',
      '/dashboard/articles',
      '/dashboard/users',
      '/dashboard/review',
    ];
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`${baseURL}${route}`, { timeout: 30000, waitUntil: 'load' });
      } catch {
        // Compilation errors are OK here
      }
    }
  } catch {
    // Login might fail during warmup; that's OK
  }

  await browser.close();
}

export default globalSetup;
