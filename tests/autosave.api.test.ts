import { test, expect, vi } from 'vitest';
import { POST } from '../src/app/api/articles/[id]/autosave/route';
import { NextRequest } from 'next/server';
import * as sessionModule from '../src/lib/auth/session';

vi.mock('../src/lib/auth/session', () => ({
  verifySession: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    article: {
      findUnique: vi.fn().mockResolvedValue(null),
    }
  }
}));

test('autosave endpoint returns JSON 401 when unauthenticated', async () => {
  vi.mocked(sessionModule.verifySession).mockResolvedValue(null);

  const req = new NextRequest('http://localhost:3000/api/articles/123/autosave', {
    method: 'POST',
    body: JSON.stringify({ title: 'T', contentJson: {}, htmlContent: '', version: 1 })
  });
  
  const res = await POST(req, { params: Promise.resolve({ id: '123' }) });
  expect(res.status).toBe(401);
  const data = await res.json();
  expect(data).toHaveProperty('error', 'Unauthorized');
});

test('autosave endpoint returns JSON 404 for missing article', async () => {
  vi.mocked(sessionModule.verifySession).mockResolvedValue({
    isAuth: true,
    userId: 'user1',
    role: 'AUTHOR'
  });

  const req = new NextRequest('http://localhost:3000/api/articles/non-existent-id/autosave', {
    method: 'POST',
    body: JSON.stringify({ title: 'T', contentJson: {}, htmlContent: '', version: 1 })
  });
  
  const res = await POST(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
  expect(res.status).toBe(404);
  const data = await res.json();
  expect(data).toHaveProperty('error', 'Article not found');
});

