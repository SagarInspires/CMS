import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/upload/route';
import { NextRequest } from 'next/server';
import { verifySession } from '../src/lib/auth/session';
import { hasPermission } from '../src/lib/auth/rbac';
import { storage } from '../src/lib/storage';

// Mock dependencies
vi.mock('../src/lib/auth/session', () => ({
  verifySession: vi.fn(),
}));

vi.mock('../src/lib/auth/rbac', () => ({
  hasPermission: vi.fn(),
}));

vi.mock('../src/lib/storage', () => ({
  storage: {
    upload: vi.fn(),
  },
}));

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormDataReq = (file: any) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    
    return {
      formData: async () => formData,
    } as unknown as NextRequest;
  };

  it('rejects unauthenticated users', async () => {
    vi.mocked(verifySession).mockResolvedValue(null);

    const res = await POST(createFormDataReq(null));
    expect(res.status).toBe(401);
  });

  it('rejects unauthorized users (no create permission)', async () => {
    vi.mocked(verifySession).mockResolvedValue({ isAuth: true, userId: '1', role: 'AUTHOR' });
    vi.mocked(hasPermission).mockReturnValue(false);

    const res = await POST(createFormDataReq(null));
    expect(res.status).toBe(401);
  });

  it('rejects missing file', async () => {
    vi.mocked(verifySession).mockResolvedValue({ isAuth: true, userId: '1', role: 'AUTHOR' });
    vi.mocked(hasPermission).mockReturnValue(true);

    const res = await POST(createFormDataReq(null));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No file provided');
  });

  it('rejects non-image files', async () => {
    vi.mocked(verifySession).mockResolvedValue({ isAuth: true, userId: '1', role: 'AUTHOR' });
    vi.mocked(hasPermission).mockReturnValue(true);

    const pdfFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const res = await POST(createFormDataReq(pdfFile));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Only images are allowed');
  });

  it('rejects oversized images', async () => {
    vi.mocked(verifySession).mockResolvedValue({ isAuth: true, userId: '1', role: 'AUTHOR' });
    vi.mocked(hasPermission).mockReturnValue(true);

    // Create a 6MB file dummy
    const largeContent = new ArrayBuffer(6 * 1024 * 1024);
    const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });
    
    const res = await POST(createFormDataReq(largeFile));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('File size must be under 5MB');
  });

  it('returns safe relative URL on success', async () => {
    vi.mocked(verifySession).mockResolvedValue({ isAuth: true, userId: '1', role: 'AUTHOR' });
    vi.mocked(hasPermission).mockReturnValue(true);
    vi.mocked(storage.upload).mockResolvedValue('/uploads/12345-test.png');

    const validFile = new File(['image data'], 'test.png', { type: 'image/png' });
    const res = await POST(createFormDataReq(validFile));
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe('/uploads/12345-test.png');
    expect(storage.upload).toHaveBeenCalledTimes(1);
  });
});
