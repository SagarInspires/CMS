import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser } from '../src/app/register/actions';
import { prisma } from '../src/lib/prisma';
import * as argon2 from 'argon2';

// Mock dependencies
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    emailVerificationToken: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  }
}));

vi.mock('../src/lib/audit', () => ({
  logAuthEvent: vi.fn(),
}));

vi.mock('../src/lib/email', () => ({
  emailProvider: {
    sendVerificationEmail: vi.fn(),
  }
}));

// We must mock the rate limiter so tests don't get blocked
vi.mock('../src/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10 }),
}));

describe('registerUser Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valid signup creates an AUTHOR only with PENDING_VERIFICATION status', async () => {
    const formData = new FormData();
    formData.append('name', 'Test User');
    formData.append('email', 'test@example.com');
    formData.append('password', 'StrongPass123!');
    formData.append('confirmPassword', 'StrongPass123!');
    
    // Simulate user creation
    (prisma.user.create as any).mockResolvedValue({ id: 'user_123', role: 'AUTHOR' });

    const result = await registerUser(null, formData);
    
    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        role: 'AUTHOR',
        status: 'PENDING_VERIFICATION'
      })
    }));
  });

  it('client-supplied role is ignored/rejected', async () => {
    const formData = new FormData();
    formData.append('name', 'Hacker');
    formData.append('email', 'hacker@example.com');
    formData.append('password', 'StrongPass123!');
    formData.append('confirmPassword', 'StrongPass123!');
    // Attempt to inject an admin role
    formData.append('role', 'ADMIN');
    formData.append('status', 'ACTIVE');
    
    (prisma.user.create as any).mockResolvedValue({ id: 'user_123' });

    await registerUser(null, formData);
    
    // Ensure the create call strictly overrides any injected role/status
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        role: 'AUTHOR',
        status: 'PENDING_VERIFICATION'
      })
    }));
  });

  it('password is stored as Argon2id hash', async () => {
    const formData = new FormData();
    formData.append('name', 'Hash Test');
    formData.append('email', 'hash@example.com');
    formData.append('password', 'StrongPass123!');
    formData.append('confirmPassword', 'StrongPass123!');
    
    (prisma.user.create as any).mockResolvedValue({ id: 'user_123' });

    await registerUser(null, formData);
    
    const createCall = (prisma.user.create as any).mock.calls[0][0];
    const passwordHash = createCall.data.passwordHash;
    
    // Verify it's an argon2 hash format
    expect(passwordHash).toMatch(/^\$argon2/);
    
    // Ensure raw password is NOT saved
    expect(createCall.data).not.toHaveProperty('password');
  });

  it('duplicate email is handled safely', async () => {
    const formData = new FormData();
    formData.append('name', 'Dup User');
    formData.append('email', 'dup@example.com');
    formData.append('password', 'StrongPass123!');
    formData.append('confirmPassword', 'StrongPass123!');
    
    // Simulate email exists
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user_123', status: 'ACTIVE' });

    const result = await registerUser(null, formData);
    
    // Must return generic success, not an error
    expect(result.success).toBe(true);
    expect(result.message).toContain('instructions have been sent');
    
    // But it must NOT create a new user or token
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled();
  });
});
